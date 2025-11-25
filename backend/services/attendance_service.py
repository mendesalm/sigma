from datetime import datetime, timedelta

from fastapi import HTTPException, status
from geopy.distance import geodesic  # Dependência para cálculo de distância
from sqlalchemy.orm import Session, joinedload

from ..models import models
from ..schemas import attendance_schema, session_attendance_schema
from . import session_service  # Reutilizando o serviço de sessão

# --- Helper Functions ---

def _validate_session_access(db: Session, session_id: int, current_member: models.Member) -> models.MasonicSession:
    """
    Valida se a sessão existe e se o membro atual pertence à loja da sessão.
    Retorna o objeto da sessão se a validação for bem-sucedida.
    """
    session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")

    admin_association = db.query(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.member_id == current_member.id,
        models.MemberLodgeAssociation.lodge_id == session.lodge_id
    ).first()
    if not admin_association:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="O usuário não tem permissão para acessar os dados desta sessão."
        )
    return session

# --- Funções de Serviço para Presença ---

def get_attendance_for_session(db: Session, session_id: int, current_member: models.Member) -> list[models.SessionAttendance]:
    """
    Retorna todos os registros de presença para uma sessão específica,
    incluindo os detalhes dos membros, após validar o acesso.
    """
    _validate_session_access(db, session_id, current_member) # Valida o acesso
    return db.query(models.SessionAttendance).options(
        joinedload(models.SessionAttendance.member)
    ).filter(models.SessionAttendance.session_id == session_id).all()

def record_manual_attendance(
    db: Session,
    session_id: int,
    attendance_update: attendance_schema.ManualAttendanceUpdate,
    current_member: models.Member
) -> models.SessionAttendance:
    """
    Registra ou atualiza manualmente a presença de um membro em uma sessão.
    Ação permitida para usuários com a permissão 'manage_attendance'.
    """
    session = _validate_session_access(db, session_id, current_member) # Valida o acesso

    # Valida o status da sessão
    if session.status not in ['AGENDADA', 'EM_ANDAMENTO']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível registrar presença. A sessão não está agendada ou em andamento."
        )
    
    # Valida se o membro-alvo pertence à mesma loja
    target_member_id = attendance_update.member_id
    target_association = db.query(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.member_id == target_member_id,
        models.MemberLodgeAssociation.lodge_id == session.lodge_id
    ).first()
    if not target_association:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O membro alvo não pertence a esta loja."
        )

    # Procura ou cria o registro de presença
    attendance_record = db.query(models.SessionAttendance).filter(
        models.SessionAttendance.session_id == session_id,
        models.SessionAttendance.member_id == target_member_id
    ).first()

    if not attendance_record:
        # Cria o registro se não existir
        attendance_record = models.SessionAttendance(
            session_id=session_id,
            member_id=target_member_id,
        )
        db.add(attendance_record)

    # Atualiza o registro
    attendance_record.attendance_status = attendance_update.attendance_status
    attendance_record.check_in_method = 'MANUAL'
    attendance_record.check_in_datetime = datetime.utcnow() if attendance_update.attendance_status == "Presente" else None

    db.commit()
    db.refresh(attendance_record)
    return attendance_record

def record_visitor_attendance(
    db: Session,
    session_id: int,
    visitor_data: attendance_schema.VisitorCreate,
    current_member: models.Member
) -> models.SessionAttendance:
    """
    Registra a presença de um visitante em uma sessão.
    """
    session = _validate_session_access(db, session_id, current_member)

    if session.status not in ['AGENDADA', 'EM_ANDAMENTO']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível registrar visitantes. A sessão não está agendada ou em andamento."
        )

    # Cria ou encontra o visitante
    visitor = None
    if visitor_data.cpf:
        visitor = db.query(models.Visitor).filter(models.Visitor.cpf == visitor_data.cpf).first()

    if not visitor:
        visitor = models.Visitor(**visitor_data.model_dump())
        db.add(visitor)
        db.flush() # Para obter o ID do visitante

    # Cria o registro de presença para o visitante
    visitor_attendance = models.SessionAttendance(
        session_id=session_id,
        visitor_id=visitor.id,
        attendance_status="Presente",
        check_in_method="MANUAL",
        check_in_datetime=datetime.utcnow()
    )
    db.add(visitor_attendance)
    db.commit()
    db.refresh(visitor_attendance)
    return visitor_attendance

def record_qr_code_attendance(
    db: Session,
    check_in_data: attendance_schema.QrCheckInRequest
) -> models.SessionAttendance:
    """
    Valida e registra a presença de um usuário via check-in por QR code,
    identificando se o usuário é membro do quadro ou visitante.
    """
    # 1. Encontra a sessão ativa para a loja informada
    session = db.query(models.MasonicSession).filter(
        models.MasonicSession.lodge_id == check_in_data.lodge_id,
        models.MasonicSession.status == 'EM_ANDAMENTO'
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma sessão ativa encontrada para esta loja.")

    # 2. Validação de Janela de Tempo
    if not session.session_date or not session.start_time:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Data ou hora da sessão não configurada.")

    session_start_datetime = datetime.combine(session.session_date, session.start_time)
    check_in_window_start = session_start_datetime - timedelta(minutes=30) # Configurável
    check_in_window_end = session_start_datetime + timedelta(minutes=60) # Configurável

    if not (check_in_window_start <= datetime.now() <= check_in_window_end):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Fora da janela de tempo para check-in.")

    # 3. Validação de Geolocalização
    lodge_coords = (session.lodge.latitude, session.lodge.longitude)
    user_coords = (check_in_data.latitude, check_in_data.longitude)

    if not lodge_coords[0] or not lodge_coords[1]:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Geolocalização da loja não configurada.")

    distance_km = geodesic(lodge_coords, user_coords).kilometers
    MAX_DISTANCE_KM = 0.2 # Raio de 200 metros (Configurável)

    if distance_km > MAX_DISTANCE_KM:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Check-in realizado fora da localização permitida.")

    # 4. Identifica o tipo de usuário (Membro do Quadro ou Visitante)
    is_lodge_member = db.query(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.member_id == check_in_data.user_id,
        models.MemberLodgeAssociation.lodge_id == check_in_data.lodge_id
    ).first()

    # 5. Atualiza ou cria o registro de presença
    if is_lodge_member:
        # É MEMBRO DO QUADRO
        attendance_record = db.query(models.SessionAttendance).filter(
            models.SessionAttendance.session_id == session.id,
            models.SessionAttendance.member_id == check_in_data.user_id
        ).first()
        if not attendance_record:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sua presença como membro não foi pré-registrada para esta sessão.")
    else:
        # É VISITANTE
        user_as_member = db.query(models.Member).filter(models.Member.id == check_in_data.user_id).first()
        if not user_as_member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado no sistema.")

        visitor = db.query(models.Visitor).filter(models.Visitor.cpf == user_as_member.cpf).first()
        if not visitor:
            visitor = models.Visitor(
                full_name=user_as_member.full_name,
                email=user_as_member.email,
                cpf=user_as_member.cpf,
                origin_lodge="Membro de outra loja" # Informação pode ser melhorada
            )
            db.add(visitor)
            db.flush()

        # Cria ou encontra o registro de presença para o visitante
        attendance_record = db.query(models.SessionAttendance).filter(
            models.SessionAttendance.session_id == session.id,
            models.SessionAttendance.visitor_id == visitor.id
        ).first()

        if not attendance_record:
            attendance_record = models.SessionAttendance(
                session_id=session.id,
                visitor_id=visitor.id
            )
            db.add(attendance_record)

        # **NOVA LÓGICA: Registra a visita para a(s) loja(s) de origem do membro**
        home_associations = db.query(models.MemberLodgeAssociation).filter(
            models.MemberLodgeAssociation.member_id == check_in_data.user_id
        ).all()

        for assoc in home_associations:
            # Evita criar registro de visita para a própria loja
            if assoc.lodge_id != check_in_data.lodge_id:
                existing_visit = db.query(models.Visit).filter(
                    models.Visit.member_id == check_in_data.user_id,
                    models.Visit.session_id == session.id
                ).first()
                if not existing_visit:
                    new_visit = models.Visit(
                        visit_date=session.session_date,
                        member_id=check_in_data.user_id,
                        home_lodge_id=assoc.lodge_id,
                        visited_lodge_id=check_in_data.lodge_id,
                        session_id=session.id
                    )
                    db.add(new_visit)

    # Atualiza e salva o registro
    if attendance_record.attendance_status == "Presente":
        db.commit() # Garante que o registro de visita seja salvo mesmo se a presença já estiver registrada
        return attendance_record # Retorna sucesso se já fez check-in

    attendance_record.attendance_status = "Presente"
    attendance_record.check_in_method = 'QR_CODE'
    attendance_record.check_in_latitude = check_in_data.latitude
    attendance_record.check_in_longitude = check_in_data.longitude
    attendance_record.check_in_datetime = datetime.utcnow()

    db.commit()
    db.refresh(attendance_record)
    return attendance_record

