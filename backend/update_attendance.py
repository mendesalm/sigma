import sys
import re

# 1. Update check_in_routes.py
file_path_1 = r'app/modules/sessions/routes/check_in_routes.py'
with open(file_path_1, 'r', encoding='utf-8') as f:
    content_1 = f.read()

bulk_route = '''
@router.post(
    "/totem/bulk",
    summary="Sincronização em Lote (Offline) do Totem",
    description="Endpoint para sincronizar check-ins capturados offline pelo Totem."
)
def bulk_totem_check_in(bulk_data: attendance_schema.TotemBulkRequest, db: Session = Depends(get_db)):
    return attendance_service.record_bulk_totem_attendance(db=db, bulk_data=bulk_data)
'''
content_1 += bulk_route
with open(file_path_1, 'w', encoding='utf-8') as f:
    f.write(content_1)


# 2. Update attendance_service.py
file_path_2 = r'app/modules/sessions/services/attendance_service.py'
with open(file_path_2, 'r', encoding='utf-8') as f:
    content_2 = f.read()

# Add logic for alerts in totem check_in
target_totem = '''    if attendance_record.attendance_status != "Presente":
        attendance_record.attendance_status = "Presente"
        attendance_record.check_in_method = "TOTEM"
        attendance_record.check_in_datetime = datetime.utcnow()

    db.commit()
    db.refresh(attendance_record)
    return attendance_record'''

replacement_totem = '''    if attendance_record.attendance_status != "Presente":
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
    return attendance_record'''

content_2 = content_2.replace(target_totem, replacement_totem)

# Add logic for alerts in qr code check_in
target_qr = '''    if attendance_record.attendance_status != "Presente":
        attendance_record.attendance_status = "Presente"
        attendance_record.check_in_method = "QR_CODE"
        attendance_record.check_in_datetime = datetime.now()

    db.commit()
    db.refresh(attendance_record)
    return attendance_record'''

replacement_qr = '''    if attendance_record.attendance_status != "Presente":
        attendance_record.attendance_status = "Presente"
        attendance_record.check_in_method = "QR_CODE"
        attendance_record.check_in_datetime = datetime.now()

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
    return attendance_record'''

content_2 = content_2.replace(target_qr, replacement_qr)


# Add bulk logic
bulk_function = '''

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
'''

content_2 += bulk_function

with open(file_path_2, 'w', encoding='utf-8') as f:
    f.write(content_2)
print("success")
