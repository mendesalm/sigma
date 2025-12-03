from datetime import date, datetime, timedelta

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker, joinedload

from config import settings
from models import models
from schemas import masonic_session_schema
from .document_generation_service import DocumentGenerationService
from . import geo_service


def _create_attendance_records_task(db_url: str, session_id: int, lodge_id: int):
    """
    Background task to create session attendance records for active members.
    Creates its own database session to ensure thread safety.
    """
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        db_session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
        if not db_session:
            print(f"Background task: Session {session_id} not found.")
            return

        active_members = (
            db.query(models.MemberLodgeAssociation).filter(models.MemberLodgeAssociation.lodge_id == lodge_id).all()
        )

        existing_attendances = {att.member_id for att in db_session.attendances if att.member_id}
        members_to_add = [assoc.member_id for assoc in active_members if assoc.member_id not in existing_attendances]

        new_attendances = [
            models.SessionAttendance(
                session_id=session_id,
                member_id=member_id,
                attendance_status="Ausente",  # Status inicial
            )
            for member_id in members_to_add
        ]

        if new_attendances:
            db.add_all(new_attendances)
            db.commit()
            print(f"Background task: Created {len(new_attendances)} attendance records for session {session_id}.")
    finally:
        db.close()


# --- Funções de Serviço para Sessões Maçônicas ---


def create_session(
    db: Session, 
    session_data: masonic_session_schema.MasonicSessionCreate, 
    current_user_payload: dict,
    background_tasks: BackgroundTasks
) -> models.MasonicSession:
    """
    Cria uma nova sessão maçônica associada à loja do usuário.
    Verifica se já existe uma sessão agendada para a mesma data na mesma loja.
    Gera automaticamente uma minuta do Balaústre.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Operação não permitida: Usuário não associado a uma loja."
        )

    # Verifica se já existe uma sessão para a mesma data na mesma loja (ignorando canceladas)
    existing_session = (
        db.query(models.MasonicSession)
        .filter(
            models.MasonicSession.lodge_id == lodge_id, 
            models.MasonicSession.session_date == session_data.session_date,
            models.MasonicSession.status != "CANCELADA"
        )
        .first()
    )

    if existing_session:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Já existe uma sessão agendada para esta data nesta loja."
        )

    db_session = models.MasonicSession(**session_data.model_dump(exclude_unset=True), lodge_id=lodge_id)

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    # Dispara a geração da minuta do Balaústre em background
    doc_gen_service = DocumentGenerationService()
    background_tasks.add_task(doc_gen_service.generate_balaustre_pdf_task, db_session.id, current_user_payload)

    return db_session


def get_session_by_id(db: Session, session_id: int, current_user_payload: dict) -> models.MasonicSession:
    """
    Busca uma sessão pelo ID, garantindo que pertença à loja do usuário.
    """
    lodge_id = current_user_payload.get("lodge_id")
    session = (
        db.query(models.MasonicSession)
        .filter(models.MasonicSession.id == session_id, models.MasonicSession.lodge_id == lodge_id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
    return session


def get_sessions_by_lodge(
    db: Session,
    current_user_payload: dict,
    start_date: date | None = None,
    end_date: date | None = None,
    status: str | None = None,
) -> list[models.MasonicSession]:
    """
    Lista todas as sessões associadas à loja do usuário, com filtros opcionais.
    """
    from sqlalchemy.orm import joinedload
    
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        return []

    query = db.query(models.MasonicSession).filter(models.MasonicSession.lodge_id == lodge_id).options(
        joinedload(models.MasonicSession.attendances)
    )

    if start_date:
        query = query.filter(models.MasonicSession.session_date >= start_date)
    if end_date:
        query = query.filter(models.MasonicSession.session_date <= end_date)
    if status:
        query = query.filter(models.MasonicSession.status == status)

    return query.all()


def update_session(
    db: Session,
    session_id: int,
    session_update: masonic_session_schema.MasonicSessionUpdate,
    current_user_payload: dict,
) -> models.MasonicSession:
    """
    Atualiza uma sessão existente, garantindo que pertença à loja do usuário.
    Verifica conflitos de data se a data da sessão for alterada.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)  # Valida propriedade

    # Se a data da sessão for atualizada, verifica por conflitos
    if session_update.session_date and session_update.session_date != db_session.session_date:
        existing_session_on_date = (
            db.query(models.MasonicSession)
            .filter(
                models.MasonicSession.lodge_id == db_session.lodge_id,
                models.MasonicSession.session_date == session_update.session_date,
                models.MasonicSession.id != session_id,  # Exclui a própria sessão
                models.MasonicSession.status != "CANCELADA" # Ignora sessões canceladas
            )
            .first()
        )
        if existing_session_on_date:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe outra sessão agendada para esta nova data nesta loja.",
            )

    for key, value in session_update.model_dump(exclude_unset=True).items():
        setattr(db_session, key, value)

    db.commit()
    db.refresh(db_session)
    return db_session


def _start_session_internal(
    db: Session, db_session: models.MasonicSession, background_tasks: BackgroundTasks
) -> models.MasonicSession:
    """
    Lógica interna e centralizada para iniciar uma sessão.
    Muda o status e dispara a criação dos registros de presença em background.
    """
    if db_session.status != "AGENDADA":
        print(
            f"Tentativa de iniciar sessão {db_session.id} que não está 'AGENDADA'. Status atual: {db_session.status}."
        )
        return db_session

    db_session.status = "EM_ANDAMENTO"
    db.commit()
    db.refresh(db_session)

    # Dispara a criação de registros de presença em background
    background_tasks.add_task(
        _create_attendance_records_task, settings.DATABASE_URL, db_session.id, db_session.lodge_id
    )

    return db_session


def start_session(
    db: Session, session_id: int, current_user_payload: dict, background_tasks: BackgroundTasks
) -> models.MasonicSession:
    """
    Inicia uma sessão maçônica (chamado via API).
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)
    return _start_session_internal(db, db_session, background_tasks)


def start_scheduled_session(db: Session, session_id: int) -> models.MasonicSession | None:
    """
    Inicia uma sessão maçônica (chamado pelo agendador).
    Não levanta exceção HTTP, apenas retorna ou loga o erro.
    """
    db_session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
    if not db_session:
        print(f"Agendador: Sessão {session_id} não encontrada para iniciar.")
        return None

    # O agendador precisa de sua própria instância de BackgroundTasks
    background_tasks = BackgroundTasks()
    return _start_session_internal(db, db_session, background_tasks)


def end_session(
    db: Session, session_id: int, current_user_payload: dict, background_tasks: BackgroundTasks
) -> models.MasonicSession:
    """
    Finaliza uma sessão maçônica, mudando seu status para 'REALIZADA'.
    Dispara a geração do Balaústre/Ata em background.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)

    if db_session.status != "EM_ANDAMENTO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sessão não pode ser finalizada. Status atual: {db_session.status}.",
        )

    db_session.status = "REALIZADA"
    db.commit()
    db.refresh(db_session)

    # Dispara a geração do Balaústre em background
    doc_gen_service = DocumentGenerationService()
    background_tasks.add_task(doc_gen_service.generate_balaustre_pdf_task, session_id, current_user_payload)

    return db_session


def cancel_session(db: Session, session_id: int, current_user_payload: dict) -> models.MasonicSession:
    """
    Cancela uma sessão maçônica, mudando seu status para 'CANCELADA'.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)

    if db_session.status == "REALIZADA":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Sessão já realizada não pode ser cancelada."
        )

    db_session.status = "CANCELADA"
    db.commit()
    db.refresh(db_session)
    return db_session


def delete_session(db: Session, session_id: int, current_user_payload: dict) -> None:
    """
    Deleta uma sessão maçônica.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)  # Valida propriedade
    db.delete(db_session)
    db.commit()
    return None


async def generate_session_document(
    db: Session, session_id: int, document_type: str, current_user_payload: dict, background_tasks: BackgroundTasks
) -> dict[str, str]:
    """
    Dispara a geração de um documento específico para uma sessão em background.
    """
    session = get_session_by_id(db, session_id, current_user_payload)  # Garante acesso à sessão

    doc_gen_service = DocumentGenerationService()

    if document_type.upper() == "BALAUSTRE":
        background_tasks.add_task(doc_gen_service.generate_balaustre_pdf_task, session_id, current_user_payload)
        return {"message": "Geração do Balaústre iniciada em background."}
    elif document_type.upper() == "EDITAL":
        background_tasks.add_task(doc_gen_service.generate_edital_pdf_task, session_id, current_user_payload)
        return {"message": "Geração do Edital iniciada em background."}
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de documento inválido.")


def get_session_attendance(
    db: Session, session_id: int, current_user_payload: dict
) -> list[models.SessionAttendance]:
    """
    Retorna a lista de presença de uma sessão.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)
    
    return db.query(models.SessionAttendance).filter(
        models.SessionAttendance.session_id == session_id
    ).options(
        joinedload(models.SessionAttendance.member),
        joinedload(models.SessionAttendance.visitor)
    ).all()


def update_manual_attendance(
    db: Session, session_id: int, member_id: int, status: str, current_user_payload: dict
) -> models.SessionAttendance:
    """
    Atualiza manualmente o status de presença de um membro.
    """
    # Valida acesso à sessão
    get_session_by_id(db, session_id, current_user_payload)
    
    attendance = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.session_id == session_id,
        models.SessionAttendance.member_id == member_id
    ).first()
    
    if not attendance:
        # Se não existir registro (ex: membro adicionado depois), cria um
        attendance = models.SessionAttendance(
            session_id=session_id,
            member_id=member_id,
            attendance_status=status,
            check_in_method="MANUAL"
        )
        db.add(attendance)
    else:
        attendance.attendance_status = status
        attendance.check_in_method = "MANUAL"
        
    db.commit()
    db.refresh(attendance)
    return attendance


def register_visitor_attendance(
    db: Session, session_id: int, visitor_data: dict, current_user_payload: dict
) -> models.SessionAttendance:
    """
    Registra a presença de um visitante. Cria o visitante se não existir.
    """
    # Valida acesso à sessão
    get_session_by_id(db, session_id, current_user_payload)
    
    # Procura visitante existente por CPF ou Email (se fornecidos)
    visitor = None
    if visitor_data.get("cpf"):
        visitor = db.query(models.Visitor).filter(models.Visitor.cpf == visitor_data["cpf"]).first()
    
    if not visitor and visitor_data.get("email"):
        visitor = db.query(models.Visitor).filter(models.Visitor.email == visitor_data["email"]).first()
        
    if not visitor:
        visitor = models.Visitor(
            full_name=visitor_data["full_name"],
            email=visitor_data.get("email"),
            cpf=visitor_data.get("cpf"),
            origin_lodge=visitor_data.get("origin_lodge")
        )
        db.add(visitor)
        db.commit()
        db.refresh(visitor)
        
    # Verifica se já está na lista
    attendance = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.session_id == session_id,
        models.SessionAttendance.visitor_id == visitor.id
    ).first()
    
    if not attendance:
        attendance = models.SessionAttendance(
            session_id=session_id,
            visitor_id=visitor.id,
            attendance_status="Presente",
            check_in_method="MANUAL"
        )
        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        
    return attendance


def perform_check_in(
    db: Session, 
    session_id: int, 
    member_id: int, 
    qr_code_token: str, 
    latitude: float, 
    longitude: float,
    current_user_payload: dict
) -> models.SessionAttendance:
    """
    Realiza o check-in de um membro na sessão usando validação de QR Code e Geolocalização.
    """
    # 1. Busca a sessão e a loja
    db_session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
    
    lodge = db_session.lodge
    
    # 2. Valida Status da Sessão
    if db_session.status != "EM_ANDAMENTO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Check-in não permitido. A sessão não está em andamento (Status: {db_session.status})."
        )
        
    # 3. Valida QR Code da Loja
    if lodge.qr_code_id != qr_code_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="QR Code inválido para esta Loja."
        )
        
    # 4. Valida Geolocalização
    # Default radius 200m if not set (though we plan to add it to DB, for now hardcode or use attribute if exists)
    radius = getattr(lodge, "geofence_radius", 200) 
    if not geo_service.is_within_radius(latitude, longitude, lodge.latitude, lodge.longitude, radius):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Você está fora do raio permitido para check-in nesta Loja."
        )

    # 5. Busca ou Cria Registro de Presença
    attendance = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.session_id == session_id,
        models.SessionAttendance.member_id == member_id
    ).first()
    
    now = datetime.now()
    
    if attendance:
        attendance.attendance_status = "Presente"
        attendance.check_in_method = "QR_CODE" # Mapear para APP_QR_GEO se/quando atualizar o Enum
        attendance.check_in_datetime = now
        attendance.check_in_latitude = latitude
        attendance.check_in_longitude = longitude
    else:
        # Membro não estava na lista (ex: visitante de mesma obediência ou membro recém cadastrado)
        attendance = models.SessionAttendance(
            session_id=session_id,
            member_id=member_id,
            attendance_status="Presente",
            check_in_method="QR_CODE",
            check_in_datetime=now,
            check_in_latitude=latitude,
            check_in_longitude=longitude
        )
        db.add(attendance)
        
    db.commit()
    db.refresh(attendance)
    return attendance


def close_scheduled_session(db: Session, session_id: int) -> models.MasonicSession | None:
    """
    Encerra automaticamente uma sessão (chamado pelo agendador).
    Muda status para ENCERRADA.
    """
    db_session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
    if not db_session:
        print(f"Agendador: Sessão {session_id} não encontrada para encerrar.")
        return None

    if db_session.status != "EM_ANDAMENTO":
        # Se já foi realizada ou cancelada, não faz nada
        return db_session

    db_session.status = "ENCERRADA"
    db.commit()
    db.refresh(db_session)
    print(f"Agendador: Sessão {session_id} encerrada automaticamente.")
    
    return db_session


def find_nearest_active_session(
    db: Session, latitude: float, longitude: float
) -> models.MasonicSession | None:
    """
    Encontra a sessão ativa (EM_ANDAMENTO) mais próxima das coordenadas fornecidas.
    Considera o raio de geofence da loja.
    """
    active_sessions = db.query(models.MasonicSession).filter(
        models.MasonicSession.status == "EM_ANDAMENTO"
    ).options(joinedload(models.MasonicSession.lodge)).all()
    
    nearest_session = None
    min_distance = float('inf')
    
    for session in active_sessions:
        lodge = session.lodge
        if not lodge.latitude or not lodge.longitude:
            continue
            
        radius = getattr(lodge, "geofence_radius", 200)
        distance = geo_service.calculate_distance(latitude, longitude, lodge.latitude, lodge.longitude)
        
        if distance <= radius and distance < min_distance:
            min_distance = distance
            nearest_session = session
            
    return nearest_session


def perform_visitor_check_in(
    db: Session,
    session_id: int,
    visitor_id: str, # ID Global (UUID)
    latitude: float,
    longitude: float
) -> models.SessionAttendance:
    """
    Realiza o check-in de um VISITANTE GLOBAL na sessão.
    Não requer autenticação de usuário, mas valida geolocalização.
    """
    # 1. Busca a sessão e a loja
    db_session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
    
    lodge = db_session.lodge
    
    # 2. Valida Status da Sessão
    if db_session.status != "EM_ANDAMENTO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Check-in não permitido. A sessão não está em andamento."
        )
        
    # 3. Valida Geolocalização
    radius = getattr(lodge, "geofence_radius", 200) 
    if not geo_service.is_within_radius(latitude, longitude, lodge.latitude, lodge.longitude, radius):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Você está fora do raio permitido para check-in nesta Loja."
        )

    # 4. Busca ou Cria Registro de Presença
    # Nota: SessionAttendance precisa de um campo para armazenar o ID do visitante global
    # Como o modelo atual tem 'visitor_id' (FK para tabela local Visitor), precisamos adaptar.
    # Opção A: Criar um registro na tabela local 'visitors' espelhando o global.
    # Opção B: Adicionar campo 'global_visitor_id' em SessionAttendance.
    # Vamos usar a Opção A para manter integridade referencial local por enquanto.
    
    # Busca dados do visitante global para criar o local
    # Precisamos de uma conexão com o banco global aqui? 
    # Idealmente sim, mas para simplificar e evitar dependência circular, 
    # vamos assumir que o frontend passou os dados ou confiar no ID.
    # Mas espere, se não validarmos o ID, qualquer um pode injetar.
    # O correto é buscar no banco global.
    
    from database import get_oriente_db
    from models.global_models import GlobalVisitor
    
    # Hack para pegar sessão do banco global sem injeção de dependência direta aqui
    # (Em prod, refatorar para receber a session global como argumento)
    oriente_db_gen = get_oriente_db()
    oriente_db = next(oriente_db_gen)
    
    try:
        global_visitor = oriente_db.query(GlobalVisitor).filter(GlobalVisitor.id == visitor_id).first()
        if not global_visitor:
            raise HTTPException(status_code=404, detail="Visitante global não encontrado.")
            
        # Sincroniza/Cria visitante local
        local_visitor = db.query(models.Visitor).filter(models.Visitor.cpf == global_visitor.cim).first() # Usando CIM no campo CPF ou criar campo CIM
        
        if not local_visitor:
             # Tenta achar por nome se CIM falhar (ou cria novo)
             # Melhor criar um campo 'global_id' na tabela local Visitor para linkar
             local_visitor = models.Visitor(
                 full_name=global_visitor.full_name,
                 cpf=global_visitor.cim, # Adaptando CIM para CPF por enquanto
                 origin_lodge=f"Global ID: {global_visitor.origin_lodge_id or 'Manual'}"
             )
             db.add(local_visitor)
             db.commit()
             db.refresh(local_visitor)
             
        # Registra presença
        attendance = db.query(models.SessionAttendance).filter(
            models.SessionAttendance.session_id == session_id,
            models.SessionAttendance.visitor_id == local_visitor.id
        ).first()
        
        now = datetime.now()
        
        if attendance:
            attendance.attendance_status = "Presente"
            attendance.check_in_method = "APP_VISITOR"
            attendance.check_in_datetime = now
        else:
            attendance = models.SessionAttendance(
                session_id=session_id,
                visitor_id=local_visitor.id,
                attendance_status="Presente",
                check_in_method="APP_VISITOR",
                check_in_datetime=now,
                check_in_latitude=latitude,
                check_in_longitude=longitude
            )
            db.add(attendance)
            
        db.commit()
        db.refresh(attendance)
        return attendance
        
    finally:
        oriente_db.close()

