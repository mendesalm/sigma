from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from models import models
from app.modules.sessions.schemas import attendance_schema
from dependencies import UserContext

def submit_absence_justification(db: Session, session_id: int, justification_data: attendance_schema.AbsenceJustificationCreate, current_user: UserContext) -> models.AbsenceJustification:
    # Verifica se a sessão existe
    masonic_session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
    if not masonic_session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
    
    # Valida se o usuário pertence à loja
    is_member = db.query(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.member_id == current_user.user.id,
        models.MemberLodgeAssociation.lodge_id == masonic_session.lodge_id
    ).first()
    
    if getattr(current_user, 'user_type', None) != 'super_admin' and not is_member:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não pertence à loja desta sessão.")
         
    # Verifica se já existe justificativa
    existing = db.query(models.AbsenceJustification).filter(
        models.AbsenceJustification.session_id == session_id,
        models.AbsenceJustification.member_id == current_user.user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Você já enviou uma justificativa para esta sessão.")

    justification = models.AbsenceJustification(
        session_id=session_id,
        member_id=current_user.user.id,
        justification_text=justification_data.justification_text,
        attachment_url=justification_data.attachment_url,
        status="Pendente"
    )
    db.add(justification)
    db.commit()
    db.refresh(justification)
    return justification

def get_session_justifications(db: Session, session_id: int, current_user: UserContext) -> list[models.AbsenceJustification]:
    masonic_session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
    if not masonic_session:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
    
    if getattr(current_user, 'user_type', None) != 'super_admin' and getattr(current_user, 'lodge_id', None) != masonic_session.lodge_id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem acesso a esta loja.")
         
    return db.query(models.AbsenceJustification).filter(models.AbsenceJustification.session_id == session_id).all()

def update_justification_status(db: Session, justification_id: int, update_data: attendance_schema.AbsenceJustificationUpdate, current_user: UserContext) -> models.AbsenceJustification:
    justification = db.query(models.AbsenceJustification).filter(models.AbsenceJustification.id == justification_id).first()
    if not justification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Justificativa não encontrada.")
        
    masonic_session = db.query(models.MasonicSession).filter(models.MasonicSession.id == justification.session_id).first()
    if getattr(current_user, 'user_type', None) != 'super_admin' and getattr(current_user, 'lodge_id', None) != masonic_session.lodge_id:
         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sem acesso a esta loja.")

    justification.status = update_data.status
    justification.reviewed_by_id = current_user.user.id
    justification.reviewed_at = datetime.utcnow()
    
    # Se aprovada, também registrar na presença principal como Justificado
    if update_data.status == "Aprovado":
        attendance_record = db.query(models.SessionAttendance).filter(
            models.SessionAttendance.session_id == justification.session_id,
            models.SessionAttendance.member_id == justification.member_id
        ).first()
        
        if not attendance_record:
            attendance_record = models.SessionAttendance(
                session_id=justification.session_id,
                member_id=justification.member_id,
            )
            db.add(attendance_record)
            
        attendance_record.attendance_status = "Justificado"
        attendance_record.check_in_method = "MANUAL"

    db.commit()
    db.refresh(justification)
    return justification
