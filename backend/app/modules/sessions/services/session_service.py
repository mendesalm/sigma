from datetime import date, datetime, timedelta

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, joinedload, sessionmaker

from app.modules.core.services import geo_service
from app.modules.core.services import lodge_service
from app.modules.sessions.schemas import masonic_session_schema
from config import settings
from models import models
from app.core.logger import get_logger

logger = get_logger(__name__)

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
            logger.warning(f"Background task: Session {session_id} not found.", extra={"session_id": session_id})
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
            logger.info(f"Background task: Created {len(new_attendances)} attendance records for session {session_id}.", extra={"session_id": session_id, "records_count": len(new_attendances)})
    finally:
        db.close()


def _update_session_status_based_on_rules(db: Session, session: models.MasonicSession):
    """
    Atualiza o status da sessão baseado nas regras de negócio de tempo.

    Regras:
    1. AGENDADA -> EM_ANDAMENTO: 2 horas antes do início.
    2. EM_ANDAMENTO -> REALIZADA: 3 horas após o início.
    3. REALIZADA -> ENCERRADA: 14 dias após a data da sessão (aprovação automática da ata).
    """
    if session.status in ["CANCELADA", "ENCERRADA"]:
        return

    now = datetime.now()

    # Se não tiver horário definido, assume 20:00 como padrão para cálculos ou ignora transição de tempo curto
    start_time = session.start_time or datetime.strptime("20:00", "%H:%M").time()

    session_start_dt = datetime.combine(session.session_date, start_time)

    # Janelas de tempo
    start_window = session_start_dt - timedelta(hours=2)
    end_window = session_start_dt + timedelta(hours=3)
    auto_close_date = session_start_dt + timedelta(days=14)

    # Transição para EM_ANDAMENTO
    if session.status == "AGENDADA":
        if start_window <= now <= end_window:
            session.status = "EM_ANDAMENTO"
            db.commit()
            db.refresh(session)
        # Se já passou muito do tempo e ainda está agendada (ex: sistema ficou off), move para REALIZADA
        elif now > end_window:
            session.status = "REALIZADA"
            db.commit()
            db.refresh(session)

    # Transição para REALIZADA
    if session.status == "EM_ANDAMENTO":
        if now > end_window:
            session.status = "REALIZADA"
            db.commit()
            db.refresh(session)

    # Transição para ENCERRADA (Auto-aprovação da ata após 2 semanas)
    if session.status == "REALIZADA":
        if now > auto_close_date:
            session.status = "ENCERRADA"
            db.commit()
            db.refresh(session)


def approve_session_minutes(db: Session, session_id: int, current_user_payload: dict) -> models.MasonicSession:
    """
    Aprova manualmente a ata da sessão, mudando o status para ENCERRADA.
    Valida se o balaústre foi enviado.
    """
    session = get_session_by_id(db, session_id, current_user_payload)

    if session.status != "REALIZADA":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Apenas sessões 'Realizadas' podem ter a ata aprovada. Status atual: {session.status}",
        )

    if not session.balaustre_file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível aprovar a ata sem realizar o upload do arquivo PDF do Balaústre.",
        )

    session.status = "ENCERRADA"
    db.commit()
    db.refresh(session)
    return session


def reopen_session(db: Session, session_id: int, current_user_payload: dict) -> models.MasonicSession:
    """
    Reabre uma sessão encerrada (Apenas Webmaster/Admin), voltando para REALIZADA.
    """
    session = get_session_by_id(db, session_id, current_user_payload)

    # TODO: Validar se é Webmaster ou Admin (assumindo que a rota fará essa validação ou payload tem roles)
    # Por enquanto, confiamos que a rota protege isso ou adicionamos verificação aqui se necessário.

    if session.status != "ENCERRADA":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Apenas sessões 'Encerradas' podem ser reabertas. Status atual: {session.status}",
        )

    session.status = "REALIZADA"
    db.commit()
    db.refresh(session)
    return session


# --- Funções de Serviço para Sessões Maçônicas ---


def create_session(
    db: Session,
    session_data: masonic_session_schema.MasonicSessionCreate,
    current_user_payload: dict,
    background_tasks: BackgroundTasks,
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
            models.MasonicSession.status != "CANCELADA",
        )
        .first()
    )

    if existing_session:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Já existe uma sessão agendada para esta data nesta loja."
        )

    # Regra: Não permitir sessões retroativas
    if session_data.session_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Não é possível criar uma sessão com data retroativa."
        )

    # --- Lógica de Exercício Maçônico e Numeração ---

    # 1. Busca ou cria o Exercício Maçônico (Administration)
    # Tenta encontrar uma administração que englobe a data da sessão
    administration = (
        db.query(models.Administration)
        .filter(
            models.Administration.lodge_id == lodge_id,
            models.Administration.start_date <= session_data.session_date,
            models.Administration.end_date >= session_data.session_date,
        )
        .first()
    )

    # Se não encontrar, cria uma padrão (ex: anual, começando em Junho ou Janeiro, ou apenas o ano corrente)
    # Por padrão, vamos assumir um exercício de 2 anos se não existir, ou anual.
    # O usuário sugeriu "Exercício Maçônico 2025-2027", então vamos tentar inferir ou criar um padrão.
    # Vamos criar um exercício de 1 ano para simplificar se não existir, começando em Junho (comum na maçonaria) ou Jan.
    # Melhor: Se não existir, cria um exercício que começa no dia da sessão e vai até 1 ou 2 anos depois,
    # ou pede para o usuário criar (mas aqui precisamos automatizar).
    # Vamos criar um exercício "Ad-hoc" se não existir, cobrindo o ano da sessão.

    if not administration:
        # Lógica simplificada: Exercício anual do ano da sessão
        # Ou melhor: Exercício bienal começando em Junho dos anos ímpares (ex: GOB) ou conforme a loja.
        # Vamos usar um padrão genérico: Ano da Sessão.
        start_year = session_data.session_date.year
        # Se for antes de Junho, pode ser que o exercício começou no ano anterior (se for calendário maçônico de Junho)
        # Mas para simplificar, vamos criar um exercício anual Jan-Dez se não houver regra.

        # TODO: Criar configurações de loja para definir início do exercício.

        admin_start = date(start_year, 1, 1)
        end_year = start_year + 2  # Biênio (ex: 2025-2027)
        admin_end = date(end_year, 12, 31)
        identifier = f"Exercício Maçônico {start_year}-{end_year}"

        administration = models.Administration(
            identifier=identifier,
            start_date=admin_start,
            end_date=admin_end,
            lodge_id=lodge_id,
            is_current=True,  # Assume que o novo é o corrente se não tinha
        )
        db.add(administration)
        db.commit()
        db.refresh(administration)

    # 2. Calcula o número da sessão se não fornecido
    if session_data.session_number is None:
        last_session = (
            db.query(models.MasonicSession)
            .filter(
                models.MasonicSession.administration_id == administration.id,
                models.MasonicSession.status != "CANCELADA",
            )
            .order_by(models.MasonicSession.session_number.desc())
            .first()
        )

        next_number = (last_session.session_number if last_session and last_session.session_number else 0) + 1
        session_data.session_number = next_number

    db_session = models.MasonicSession(
        **session_data.model_dump(exclude_unset=True), lodge_id=lodge_id, administration_id=administration.id
    )

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    # Dispara a geração da minuta do Balaústre em background
    # doc_gen_service = DocumentGenerationService(db_session=db)
    # background_tasks.add_task(doc_gen_service.generate_balaustre_pdf_task, db_session.id, current_user_payload)

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

    # Atualiza status baseado no tempo
    _update_session_status_based_on_rules(db, session)

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
    from sqlalchemy.orm import selectinload

    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        return []

    # Use selectinload for 1-to-many collections (attendances) and then joinedload for many-to-1 inside
    query = (
        db.query(models.MasonicSession)
        .filter(models.MasonicSession.lodge_id == lodge_id)
        .options(
            selectinload(models.MasonicSession.attendances).joinedload(models.SessionAttendance.member),
            selectinload(models.MasonicSession.attendances).joinedload(models.SessionAttendance.visitor),
        )
    )

    if start_date:
        query = query.filter(models.MasonicSession.session_date >= start_date)
    if end_date:
        query = query.filter(models.MasonicSession.session_date <= end_date)
    if status:
        query = query.filter(models.MasonicSession.status == status)

    sessions = query.all()

    # Atualiza status de todas as sessões recuperadas
    for session in sessions:
        _update_session_status_based_on_rules(db, session)

    return sessions


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

    if db_session.status == "ENCERRADA":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Sessão encerrada não pode ser editada. Contate o Webmaster."
        )

    # Se a data da sessão for atualizada, verifica por conflitos
    if session_update.session_date and session_update.session_date != db_session.session_date:
        existing_session_on_date = (
            db.query(models.MasonicSession)
            .filter(
                models.MasonicSession.lodge_id == db_session.lodge_id,
                models.MasonicSession.session_date == session_update.session_date,
                models.MasonicSession.id != session_id,  # Exclui a própria sessão
                models.MasonicSession.status != "CANCELADA",  # Ignora sessões canceladas
            )
            .first()
        )
        if existing_session_on_date:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe outra sessão agendada para esta nova data nesta loja.",
            )
            
        # Marca a sessão como modificada manualmente para não ser sobrescrita pelo gerador automático
        db_session.is_manually_modified = True

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
    # doc_gen_service = DocumentGenerationService(db_session=db)
    # background_tasks.add_task(doc_gen_service.generate_balaustre_pdf_task, session_id, current_user_payload)

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

    # Valida que sessões realizadas não podem ser excluídas
    if db_session.status == "REALIZADA":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sessões realizadas não podem ser excluídas. Status atual: {db_session.status}.",
        )
    db.delete(db_session)
    db.commit()
    return None


import os
from fastapi import UploadFile
from sqlalchemy.orm import joinedload

def get_balaustre_draft(db: Session, session_id: int, current_user_payload: dict) -> dict:
    """
    Retorna os dados consolidados da sessão organizados para redigir o balaústre nominal.
    Lista membros agrupados por grau, visitantes agrupados por loja e faltas justificadas.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)
    
    # Coletar presenças
    attendances = (
        db.query(models.SessionAttendance)
        .filter(models.SessionAttendance.session_id == session_id, models.SessionAttendance.attendance_status == "Presente")
        .options(joinedload(models.SessionAttendance.member), joinedload(models.SessionAttendance.visitor))
        .all()
    )
    
    # Coletar Faltas Justificadas Aprovadas
    justifications = (
        db.query(models.AbsenceJustification)
        .filter(models.AbsenceJustification.session_id == session_id, models.AbsenceJustification.status == "Aprovado")
        .options(joinedload(models.AbsenceJustification.member))
        .all()
    )

    members_by_degree = {
        "Aprendiz": [],
        "Companheiro": [],
        "Mestre": [],
        "Outros": []
    }
    
    visitors_by_lodge = {}
    present_members_count = 0
    present_visitors_count = 0

    for att in attendances:
        if att.member:
            degree = getattr(att.member, "degree", "Outros") or "Outros"
            if degree in members_by_degree:
                members_by_degree[degree].append(att.member.full_name)
            else:
                members_by_degree["Outros"].append(att.member.full_name)
            present_members_count += 1
        elif att.visitor:
            lodge_name = att.visitor.manual_lodge_name or "Desconhecida"
            if lodge_name not in visitors_by_lodge:
                visitors_by_lodge[lodge_name] = []
            visitors_by_lodge[lodge_name].append(att.visitor.full_name)
            present_visitors_count += 1

    justified_absences = [j.member.full_name for j in justifications if j.member]

    # Ordenar alfabeticamente
    for degree in members_by_degree:
        members_by_degree[degree].sort()
    for lodge in visitors_by_lodge:
        visitors_by_lodge[lodge].sort()
    justified_absences.sort()

    return {
        "session_id": db_session.id,
        "title": db_session.title,
        "session_date": db_session.session_date.isoformat() if db_session.session_date else None,
        "start_time": db_session.start_time.strftime("%H:%M") if db_session.start_time else None,
        "session_type": db_session.session_type,
        "status": db_session.status,
        "temporary_role_assignments": db_session.temporary_role_assignments,
        "present_members_count": present_members_count,
        "present_visitors_count": present_visitors_count,
        "nominal_list": {
            "members_by_degree": members_by_degree,
            "visitors_by_lodge": visitors_by_lodge,
            "justified_absences": justified_absences
        }
    }

def upload_balaustre(db: Session, session_id: int, file: UploadFile, current_user_payload: dict) -> models.MasonicSession:
    """
    Faz o upload do arquivo PDF do balaústre e salva o caminho no banco.
    """
    db_session = get_session_by_id(db, session_id, current_user_payload)
    
    if db_session.status == "ENCERRADA":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Sessão já encerrada. O Balaústre não pode ser alterado sem reabrir a sessão."
        )
    
    lodge_id = db_session.lodge_id
    base_dir = f"storage/lodges/loja_{lodge_id}/sessions/{session_id}"
    os.makedirs(base_dir, exist_ok=True)
    
    file_path = os.path.join(base_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
        
    db_session.balaustre_file_path = file_path
    db.commit()
    db.refresh(db_session)
    return db_session
