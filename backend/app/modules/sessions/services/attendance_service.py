from datetime import datetime, timedelta, date
from fastapi import HTTPException, status
from geopy.distance import geodesic  # Dependência para cálculo de distância
from sqlalchemy.orm import Session, joinedload

from app.modules.sessions.schemas import attendance_schema
from models import models

# --- Helper Functions ---


from dependencies import UserContext

def _validate_session_access(db: Session, session_id: int, current_user: UserContext) -> models.MasonicSession:
    """
    Valida se a sessão existe e se o usuário atual pertence à loja da sessão.
    Retorna o objeto da sessão se a validação for bem-sucedida.
    """
    session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")

    if getattr(current_user, 'user_type', None) == 'super_admin':
        return session

    if getattr(current_user, 'lodge_id', None) != session.lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="O usuário não tem permissão para acessar os dados desta sessão.",
        )
    return session


# --- Funções de Serviço para Presença ---


def get_attendance_for_session(
    db: Session, session_id: int, current_user: UserContext
) -> list[models.SessionAttendance]:
    """
    Retorna todos os registros de presença para uma sessão específica,
    incluindo os detalhes dos membros, após validar o acesso.
    """
    _validate_session_access(db, session_id, current_user)  # Valida o acesso
    return (
        db.query(models.SessionAttendance)
        .options(joinedload(models.SessionAttendance.member), joinedload(models.SessionAttendance.visitor))
        .filter(models.SessionAttendance.session_id == session_id)
        .all()
    )


def record_manual_attendance(
    db: Session,
    session_id: int,
    attendance_update: attendance_schema.ManualAttendanceUpdate,
    current_user: UserContext,
) -> models.SessionAttendance:
    """
    Registra ou atualiza manualmente a presença de um membro em uma sessão.
    Ação permitida para usuários com a permissão 'manage_attendance'.
    """
    session = _validate_session_access(db, session_id, current_user)  # Valida o acesso

    is_webmaster = getattr(current_user, 'user_type', None) == 'webmaster'
    
    if session.status == "ENCERRADA":
        if not is_webmaster:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas webmasters podem alterar presenças de sessões encerradas."
            )
        if not attendance_update.reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O motivo da correção é obrigatório para sessões encerradas."
            )
    elif session.status not in ["EM_ANDAMENTO", "REALIZADA"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível registrar presença. A sessão não está em andamento ou realizada.",
        )

    # Valida se o membro-alvo pertence à mesma loja
    target_member_id = attendance_update.member_id
    target_association = (
        db.query(models.MemberLodgeAssociation)
        .filter(
            models.MemberLodgeAssociation.member_id == target_member_id,
            models.MemberLodgeAssociation.lodge_id == session.lodge_id,
        )
        .first()
    )
    if not target_association:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="O membro alvo não pertence a esta loja.")

    # Procura ou cria o registro de presença
    attendance_record = (
        db.query(models.SessionAttendance)
        .filter(
            models.SessionAttendance.session_id == session_id, models.SessionAttendance.member_id == target_member_id
        )
        .first()
    )

    if not attendance_record:
        # Cria o registro se não existir
        attendance_record = models.SessionAttendance(
            session_id=session_id,
            member_id=target_member_id,
        )
        db.add(attendance_record)

    # Atualiza o registro
    attendance_record.attendance_status = attendance_update.attendance_status
    attendance_record.check_in_method = "MANUAL"
    attendance_record.check_in_datetime = (
        datetime.utcnow() if attendance_update.attendance_status == "Presente" else None
    )

    if session.status == "ENCERRADA" and is_webmaster:
        audit_log = models.AttendanceAuditLog(
            session_id=session.id,
            webmaster_id=current_user.user.id,
            target_member_id=target_member_id,
            action="MANUAL_ATTENDANCE_UPDATE",
            reason=attendance_update.reason
        )
        db.add(audit_log)

    db.commit()
    db.refresh(attendance_record)
    return attendance_record


def record_visitor_attendance(
    db: Session, session_id: int, visitor_data: attendance_schema.VisitorCreate, current_user: UserContext
) -> models.SessionAttendance:
    """
    Registra a presença de um visitante em uma sessão.
    """
    session = _validate_session_access(db, session_id, current_user)

    is_webmaster = getattr(current_user, 'user_type', None) == 'webmaster'
    
    if session.status == "ENCERRADA":
        if not is_webmaster:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas webmasters podem alterar presenças de sessões encerradas."
            )
        if not visitor_data.reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O motivo da correção é obrigatório para sessões encerradas."
            )
    elif session.status not in ["EM_ANDAMENTO", "REALIZADA"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível registrar visitantes. A sessão não está em andamento ou realizada.",
        )

    # Cria ou encontra o visitante
    visitor = db.query(models.Visitor).filter(models.Visitor.cim == visitor_data.cim).first()

    trust_level = "Verificado"
    
    # Lógica de Loja de Origem
    if visitor_data.origin_lodge_id:
        origin_lodge = db.query(models.Lodge).filter(models.Lodge.id == visitor_data.origin_lodge_id).first()
        if origin_lodge:
            trust_level = "Certificado" # Achou no sigma
    else:
        # Criar Request de Loja se não existir
        if visitor_data.manual_lodge_name:
            creation_request = models.LodgeCreationRequest(
                requester_id=current_user.user.id,
                requested_lodge_name=visitor_data.manual_lodge_name,
                requested_lodge_number=visitor_data.manual_lodge_number,
                requested_obedience=visitor_data.manual_lodge_obedience,
                status="PENDENTE"
            )
            db.add(creation_request)

    if not visitor:
        v_data = visitor_data.model_dump(exclude={"reason"})
        visitor = models.Visitor(**v_data)
        visitor.trust_level = trust_level
        db.add(visitor)
        db.flush()  # Para obter o ID do visitante
    elif trust_level == "Certificado" and visitor.trust_level != "Certificado":
        visitor.trust_level = "Certificado" # Evolui confiança

    # Cria o registro de presença para o visitante
    visitor_attendance = models.SessionAttendance(
        session_id=session_id,
        visitor_id=visitor.id,
        attendance_status="Presente",
        check_in_method="MANUAL",
        check_in_datetime=datetime.utcnow(),
    )
    db.add(visitor_attendance)
    
    if session.status == "ENCERRADA" and is_webmaster:
        audit_log = models.AttendanceAuditLog(
            session_id=session.id,
            webmaster_id=current_user.user.id,
            target_visitor_id=visitor.id,
            action="VISITOR_ATTENDANCE_UPDATE",
            reason=visitor_data.reason
        )
        db.add(audit_log)
    db.commit()
    db.refresh(visitor_attendance)
    return visitor_attendance


def record_qr_code_attendance(
    db: Session, check_in_data: attendance_schema.QrCheckInRequest
) -> models.SessionAttendance:
    """
    Valida e registra a presença de um usuário via check-in por QR code,
    identificando se o usuário é membro do quadro ou visitante.
    """
    # 1. Encontra a sessão ativa para a loja informada
    session = (
        db.query(models.MasonicSession)
        .filter(
            models.MasonicSession.lodge_id == check_in_data.lodge_id, models.MasonicSession.status == "EM_ANDAMENTO"
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma sessão ativa encontrada para esta loja."
        )

    # 2. Validação de Janela de Tempo
    if not session.session_date or not session.start_time:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Data ou hora da sessão não configurada."
        )

    session_start_datetime = datetime.combine(session.session_date, session.start_time)
    check_in_window_start = session_start_datetime - timedelta(minutes=session.lodge.checkin_window_start_minutes)
    check_in_window_end = session_start_datetime + timedelta(minutes=session.lodge.checkin_window_end_minutes)

    if not (check_in_window_start <= datetime.now() <= check_in_window_end):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Fora da janela de tempo para check-in.")

    # 3. Validação de Geolocalização
    lodge_coords = (session.lodge.latitude, session.lodge.longitude)
    user_coords = (check_in_data.latitude, check_in_data.longitude)

    if not lodge_coords[0] or not lodge_coords[1]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Geolocalização da loja não configurada."
        )

    distance_km = geodesic(lodge_coords, user_coords).kilometers
    MAX_DISTANCE_KM = 0.2  # Raio de 200 metros (Configurável)

    if distance_km > MAX_DISTANCE_KM:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Check-in realizado fora da localização permitida."
        )

    # 4. Identifica o tipo de usuário (Membro do Quadro ou Visitante)
    is_lodge_member = (
        db.query(models.MemberLodgeAssociation)
        .filter(
            models.MemberLodgeAssociation.member_id == check_in_data.user_id,
            models.MemberLodgeAssociation.lodge_id == check_in_data.lodge_id,
        )
        .first()
    )

    # 5. Atualiza ou cria o registro de presença
    if is_lodge_member:
        # É MEMBRO DO QUADRO
        attendance_record = (
            db.query(models.SessionAttendance)
            .filter(
                models.SessionAttendance.session_id == session.id,
                models.SessionAttendance.member_id == check_in_data.user_id,
            )
            .first()
        )
        if not attendance_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sua presença como membro não foi pré-registrada para esta sessão.",
            )
    else:
        # É VISITANTE
        user_as_member = db.query(models.Member).filter(models.Member.id == check_in_data.user_id).first()
        if not user_as_member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado no sistema.")

        # Busca visitante pelo CIM (agora obrigatório e único)
        # Busca visitante pelo CIM (agora obrigatório e único)
        visitor = db.query(models.Visitor).filter(models.Visitor.cim == user_as_member.cim).first()

        if not visitor:
            # Cria novo registro de visitante local baseado no membro do Sigma
            visitor = models.Visitor(
                full_name=user_as_member.full_name,
                cim=user_as_member.cim,
                degree=user_as_member.degree,
                email=user_as_member.email,
                manual_lodge_name="Membro Sigma de outra loja",  # Identificador genérico
                remarks=f"Membro Sigma ID: {user_as_member.id}",
                trust_level="Certificado", # É um membro validado no Sigma
            )
            db.add(visitor)
            db.flush()
        elif visitor.trust_level != "Certificado":
            visitor.trust_level = "Certificado"

        # Cria ou encontra o registro de presença para o visitante
        attendance_record = (
            db.query(models.SessionAttendance)
            .filter(
                models.SessionAttendance.session_id == session.id, models.SessionAttendance.visitor_id == visitor.id
            )
            .first()
        )

        if not attendance_record:
            attendance_record = models.SessionAttendance(session_id=session.id, visitor_id=visitor.id)
            db.add(attendance_record)

        # **NOVA LÓGICA: Registra a visita para a(s) loja(s) de origem do membro**
        home_associations = (
            db.query(models.MemberLodgeAssociation)
            .filter(models.MemberLodgeAssociation.member_id == check_in_data.user_id)
            .all()
        )

        for assoc in home_associations:
            # Evita criar registro de visita para a própria loja
            if assoc.lodge_id != check_in_data.lodge_id:
                existing_visit = (
                    db.query(models.Visit)
                    .filter(models.Visit.member_id == check_in_data.user_id, models.Visit.session_id == session.id)
                    .first()
                )
                if not existing_visit:
                    new_visit = models.Visit(
                        visit_date=session.session_date,
                        member_id=check_in_data.user_id,
                        home_lodge_id=assoc.lodge_id,
                        visited_lodge_id=check_in_data.lodge_id,
                        session_id=session.id,
                    )
                    db.add(new_visit)

    # Atualiza e salva o registro
    if attendance_record.attendance_status == "Presente":
        db.commit()  # Garante que o registro de visita seja salvo mesmo se a presença já estiver registrada
        return attendance_record  # Retorna sucesso se já fez check-in

    attendance_record.attendance_status = "Presente"
    attendance_record.check_in_method = "QR_CODE"
    attendance_record.check_in_latitude = check_in_data.latitude
    attendance_record.check_in_longitude = check_in_data.longitude
    attendance_record.check_in_datetime = datetime.utcnow()

    if session.status == "ENCERRADA" and is_webmaster:
        audit_log = models.AttendanceAuditLog(
            session_id=session.id,
            webmaster_id=current_user.user.id,
            target_member_id=target_member_id,
            action="MANUAL_ATTENDANCE_UPDATE",
            reason=attendance_update.reason
        )
        db.add(audit_log)

    db.commit()
    db.refresh(attendance_record)
    return attendance_record



from app.modules.access_control.utils import auth_utils

def record_totem_attendance(
    db: Session, totem_data: attendance_schema.TotemCheckInRequest
) -> models.SessionAttendance:
    """
    Valida o JWT do Maçom app e registra a presença na sessão ativa da loja do Totem.
    """
    # 1. Encontra a sessão ativa para a loja do totem
    session = (
        db.query(models.MasonicSession)
        .filter(
            models.MasonicSession.lodge_id == totem_data.lodge_id, models.MasonicSession.status == "EM_ANDAMENTO"
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma sessão ativa encontrada para o Totem."
        )

    # 2. Decodifica o JWT do QR Code do usuário
    payload = auth_utils.decode_access_token(totem_data.jwt_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="QR Code inválido ou expirado."
        )

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="QR Code inválido: sem identificação do membro."
        )

    # 3. Identifica se é Membro da Loja ou Visitante
    is_lodge_member = (
        db.query(models.MemberLodgeAssociation)
        .filter(
            models.MemberLodgeAssociation.member_id == user_id,
            models.MemberLodgeAssociation.lodge_id == totem_data.lodge_id,
        )
        .first()
    )

    if is_lodge_member:
        # MEMBRO DO QUADRO
        attendance_record = (
            db.query(models.SessionAttendance)
            .filter(
                models.SessionAttendance.session_id == session.id,
                models.SessionAttendance.member_id == user_id,
            )
            .first()
        )
        if not attendance_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sua presença como membro não foi pré-registrada para esta sessão.",
            )
    else:
        # VISITANTE
        user_as_member = db.query(models.Member).filter(models.Member.id == user_id).first()
        if not user_as_member:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado no sistema.")

        visitor = db.query(models.Visitor).filter(models.Visitor.cim == user_as_member.cim).first()

        if not visitor:
            # Cria novo registro de visitante local baseado no membro do Sigma
            visitor = models.Visitor(
                full_name=user_as_member.full_name,
                cim=user_as_member.cim,
                degree=user_as_member.degree,
                email=user_as_member.email,
                manual_lodge_name="Membro Sigma de outra loja",
                remarks=f"Membro Sigma ID: {user_as_member.id}",
                trust_level="Certificado",
            )
            db.add(visitor)
            db.flush()
        elif visitor.trust_level != "Certificado":
            visitor.trust_level = "Certificado"

        # Cria ou encontra o registro de presença para o visitante
        attendance_record = (
            db.query(models.SessionAttendance)
            .filter(
                models.SessionAttendance.session_id == session.id, models.SessionAttendance.visitor_id == visitor.id
            )
            .first()
        )

        if not attendance_record:
            attendance_record = models.SessionAttendance(session_id=session.id, visitor_id=visitor.id)
            db.add(attendance_record)

        # Registra a visita para as lojas de origem do membro
        home_associations = (
            db.query(models.MemberLodgeAssociation)
            .filter(models.MemberLodgeAssociation.member_id == user_id)
            .all()
        )

        for assoc in home_associations:
            if assoc.lodge_id != totem_data.lodge_id:
                existing_visit = (
                    db.query(models.Visit)
                    .filter(models.Visit.member_id == user_id, models.Visit.session_id == session.id)
                    .first()
                )
                if not existing_visit:
                    new_visit = models.Visit(
                        visit_date=session.session_date,
                        member_id=user_id,
                        home_lodge_id=assoc.lodge_id,
                        visited_lodge_id=totem_data.lodge_id,
                        session_id=session.id,
                    )
                    db.add(new_visit)

    # Atualiza status e salva
    if attendance_record.attendance_status != "Presente":
        attendance_record.attendance_status = "Presente"
        attendance_record.check_in_method = "TOTEM"
        attendance_record.check_in_datetime = datetime.utcnow()

    db.commit()
    db.refresh(attendance_record)

    # ADD ALERTS
    alerts = []
    if is_lodge_member:
        if is_lodge_member.status in ["Inativo", "Desativado", "Suspenso"]:
            alerts.append(f"Membro com status {is_lodge_member.status}")
        if is_lodge_member.member_class == "Irregular":
            alerts.append("Membro Irregular")
    
    setattr(attendance_record, "alerts", alerts)
    return attendance_record


def get_lodge_attendance_stats(db: Session, lodge_id: int, period_months: int = 12) -> dict:
    """
    Calcula estatísticas de presença da loja para os últimos X meses.
    """
    # 1. Definir período
    end_date = date.today()
    start_date = end_date - timedelta(days=period_months * 30)

    # 2. Buscar sessões realizadas/encerradas no período
    sessions = (
        db.query(models.MasonicSession)
        .filter(
            models.MasonicSession.lodge_id == lodge_id,
            models.MasonicSession.session_date >= start_date,
            models.MasonicSession.session_date <= end_date,
            models.MasonicSession.status.in_(["REALIZADA", "ENCERRADA"]),
        )
        .all()
    )

    total_sessions = len(sessions)
    if total_sessions == 0:
        return {"total_sessions": 0, "average_attendance": 0.0, "member_stats": []}

    # 3. Calcular média de presença por sessão
    total_attendance_count = 0
    session_ids = [s.id for s in sessions]

    # Busca todas as presenças dessas sessões
    all_attendances = (
        db.query(models.SessionAttendance)
        .filter(
            models.SessionAttendance.session_id.in_(session_ids),
            models.SessionAttendance.attendance_status == "Presente",
        )
        .all()
    )

    total_attendance_count = len(all_attendances)
    average_attendance = total_attendance_count / total_sessions if total_sessions > 0 else 0

    # 4. Calcular estatísticas por membro
    # Primeiro, buscar membros ativos da loja
    active_members = (
        db.query(models.Member)
        .join(models.MemberLodgeAssociation)
        .filter(models.MemberLodgeAssociation.lodge_id == lodge_id, models.MemberLodgeAssociation.status == "Ativo")
        .all()
    )

    member_stats = []
    for member in active_members:
        # Contar presenças deste membro nas sessões do período
        member_presence_count = sum(1 for a in all_attendances if a.member_id == member.id)

        attendance_rate = (member_presence_count / total_sessions) * 100

        member_stats.append(
            {
                "member_id": member.id,
                "member_name": member.full_name,
                "total_sessions": total_sessions,
                "present_sessions": member_presence_count,
                "attendance_rate": round(attendance_rate, 2),
            }
        )

    # Ordenar por taxa de presença (decrescente)
    member_stats.sort(key=lambda x: x["attendance_rate"], reverse=True)

    return {
        "total_sessions": total_sessions,
        "average_attendance": round(average_attendance, 2),
        "member_stats": member_stats,
    }


def record_bulk_totem_attendance(db: Session, bulk_data: attendance_schema.TotemBulkRequest) -> dict:
    """
    Sincroniza uma lista de check-ins coletados offline pelo Totem.
    Ignora a expiração do JWT (verify_exp=False) confiando na leitura local do totem.
    """
    import jwt
    from app.modules.access_control.utils.auth_utils import SECRET_KEY, ALGORITHM
    
    session = (
        db.query(models.MasonicSession)
        .filter(
            models.MasonicSession.lodge_id == bulk_data.lodge_id, 
            models.MasonicSession.status.in_(["EM_ANDAMENTO", "REALIZADA"])
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Nenhuma sessão ativa/realizada encontrada para o Totem."
        )

    success_count = 0
    errors = []

    for item in bulk_data.check_ins:
        try:
            # Decode bypassing expiration
            payload = jwt.decode(item.jwt_token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
            user_id = payload.get("user_id")
            if not user_id:
                errors.append(f"Token sem user_id: {item.jwt_token[:10]}...")
                continue
                
            # Identifica membro ou visitante
            is_lodge_member = (
                db.query(models.MemberLodgeAssociation)
                .filter(
                    models.MemberLodgeAssociation.member_id == user_id,
                    models.MemberLodgeAssociation.lodge_id == bulk_data.lodge_id,
                )
                .first()
            )
            
            visitor_id = None
            if not is_lodge_member:
                user_as_member = db.query(models.Member).filter(models.Member.id == user_id).first()
                if not user_as_member:
                    errors.append(f"Usuário não encontrado: {user_id}")
                    continue
                
                visitor = db.query(models.Visitor).filter(models.Visitor.cim == user_as_member.cim).first()
                if not visitor:
                    visitor = models.Visitor(
                        full_name=user_as_member.full_name,
                        cim=user_as_member.cim,
                        degree=user_as_member.degree,
                        trust_level="Certificado",
                    )
                    db.add(visitor)
                    db.flush()
                visitor_id = visitor.id

            attendance_record = (
                db.query(models.SessionAttendance)
                .filter(
                    models.SessionAttendance.session_id == session.id,
                    models.SessionAttendance.member_id == (user_id if is_lodge_member else None),
                    models.SessionAttendance.visitor_id == visitor_id
                )
                .first()
            )

            if not attendance_record:
                attendance_record = models.SessionAttendance(
                    session_id=session.id, 
                    member_id=(user_id if is_lodge_member else None),
                    visitor_id=visitor_id
                )
                db.add(attendance_record)

            if attendance_record.attendance_status != "Presente":
                attendance_record.attendance_status = "Presente"
                attendance_record.check_in_method = "TOTEM"
                # Use the offline timestamp
                attendance_record.check_in_datetime = item.timestamp_local

            db.commit()
            success_count += 1

        except Exception as e:
            db.rollback()
            errors.append(f"Erro ao processar token: {str(e)}")

    return {"processed": len(bulk_data.check_ins), "success": success_count, "errors": errors}
