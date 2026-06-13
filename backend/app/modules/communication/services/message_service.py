from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import os

from app.modules.communication.models import EntityMessage, MessageAttachment
from app.modules.communication.schemas.message_schema import EntityMessageCreate

def get_inbox(db: Session, lodge_id: int | None, obedience_id: int | None, skip: int = 0, limit: int = 50):
    query = db.query(EntityMessage)
    if lodge_id:
        query = query.filter(EntityMessage.recipient_lodge_id == lodge_id)
    elif obedience_id:
        query = query.filter(EntityMessage.recipient_obedience_id == obedience_id)
    else:
        return []
    
    return query.order_by(EntityMessage.created_at.desc()).offset(skip).limit(limit).all()

def get_sent(db: Session, lodge_id: int | None, obedience_id: int | None, skip: int = 0, limit: int = 50):
    query = db.query(EntityMessage)
    if lodge_id:
        query = query.filter(EntityMessage.sender_lodge_id == lodge_id)
    elif obedience_id:
        query = query.filter(EntityMessage.sender_obedience_id == obedience_id)
    else:
        return []
    
    return query.order_by(EntityMessage.created_at.desc()).offset(skip).limit(limit).all()

def send_message(db: Session, message_data: EntityMessageCreate, sender_lodge_id: int | None, sender_obedience_id: int | None):
    if not message_data.recipient_lodge_id and not message_data.recipient_obedience_id:
        raise HTTPException(status_code=400, detail="Destinatário é obrigatório.")

    # Create Message
    db_message = EntityMessage(
        sender_lodge_id=sender_lodge_id,
        sender_obedience_id=sender_obedience_id,
        recipient_lodge_id=message_data.recipient_lodge_id,
        recipient_obedience_id=message_data.recipient_obedience_id,
        subject=message_data.subject,
        body=message_data.body,
        status="UNREAD"
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    return db_message

def get_message(db: Session, message_id: int, user_lodge_id: int | None, user_obedience_id: int | None):
    message = db.query(EntityMessage).filter(EntityMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Mensagem não encontrada.")

    # Check access
    is_sender = (message.sender_lodge_id == user_lodge_id and user_lodge_id) or \
                (message.sender_obedience_id == user_obedience_id and user_obedience_id)
    is_recipient = (message.recipient_lodge_id == user_lodge_id and user_lodge_id) or \
                   (message.recipient_obedience_id == user_obedience_id and user_obedience_id)
    
    if not is_sender and not is_recipient:
        raise HTTPException(status_code=403, detail="Acesso negado à mensagem.")

    # Mark as read if recipient
    if is_recipient and message.status == "UNREAD":
        message.status = "READ"
        db.commit()
        db.refresh(message)

    return message
