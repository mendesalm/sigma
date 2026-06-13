from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from datetime import date
import os
import shutil
import uuid

import database
import dependencies
from app.modules.communication.schemas import message_schema
from app.modules.communication.services import message_service

router = APIRouter(
    prefix="/messages",
    tags=["Messages"],
    dependencies=[Depends(dependencies.require_module("communication"))]
)

def verify_message_access(context: dependencies.UserContext = Depends(dependencies.get_current_active_user_with_permissions)):
    if context.user_type in ["super_admin", "webmaster"]:
        return context

    if context.user_type == "member":
        today = date.today()
        # Verificar cargos ativos do membro
        has_access = False
        for role_history in context.user.role_history:
            # Checa se o cargo está ativo e se é um dos permitidos
            is_active = role_history.end_date is None or role_history.end_date >= today
            if is_active and role_history.role and role_history.role.name in ["Secretário", "Venerável Mestre", "Chanceler", "Orador"]:
                # Pode estender os cargos se necessário
                has_access = True
                break
        
        if not has_access:
            raise HTTPException(status_code=403, detail="Apenas Secretário, Venerável Mestre ou Administradores podem acessar os ofícios.")
    
    return context

@router.get("/inbox", response_model=list[message_schema.EntityMessageResponse])
def get_inbox(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(verify_message_access)
):
    """Retorna as mensagens recebidas pela entidade atual."""
    lodge_id = context.lodge_id
    obedience_id = context.obedience_id
    
    # Must belong to an entity to check inbox
    if not lodge_id and not obedience_id:
        raise HTTPException(status_code=403, detail="Usuário não associado a uma entidade.")
        
    return message_service.get_inbox(db, lodge_id, obedience_id, skip, limit)

@router.get("/sent", response_model=list[message_schema.EntityMessageResponse])
def get_sent(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(verify_message_access)
):
    """Retorna as mensagens enviadas pela entidade atual."""
    lodge_id = context.lodge_id
    obedience_id = context.obedience_id
    
    if not lodge_id and not obedience_id:
        raise HTTPException(status_code=403, detail="Usuário não associado a uma entidade.")
        
    return message_service.get_sent(db, lodge_id, obedience_id, skip, limit)

@router.post("/", response_model=message_schema.EntityMessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    message: message_schema.EntityMessageCreate,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(verify_message_access)
):
    """Envia uma nova mensagem de uma entidade para outra."""
    sender_lodge_id = context.lodge_id
    sender_obedience_id = context.obedience_id
    
    if not sender_lodge_id and not sender_obedience_id:
        raise HTTPException(status_code=403, detail="Usuário não associado a uma entidade para enviar ofício.")

    db_message = message_service.send_message(db, message, sender_lodge_id, sender_obedience_id)
    return db_message

@router.get("/{message_id}", response_model=message_schema.EntityMessageResponse)
def get_message(
    message_id: int,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(verify_message_access)
):
    """Recupera detalhes de uma mensagem (lida apenas por remetente ou destinatário)."""
    lodge_id = context.lodge_id
    obedience_id = context.obedience_id
    
    if not lodge_id and not obedience_id:
        raise HTTPException(status_code=403, detail="Usuário não associado a uma entidade.")

    return message_service.get_message(db, message_id, lodge_id, obedience_id)

@router.post("/{message_id}/attachments")
def upload_message_attachment(
    message_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(verify_message_access)
):
    """Faz o upload de um anexo para uma mensagem."""
    lodge_id = context.lodge_id
    obedience_id = context.obedience_id

    message = message_service.get_message(db, message_id, lodge_id, obedience_id)
    
    # Check if user is the sender (only sender can attach)
    is_sender = (message.sender_lodge_id == lodge_id and lodge_id) or \
                (message.sender_obedience_id == obedience_id and obedience_id)
    
    if not is_sender:
        raise HTTPException(status_code=403, detail="Apenas o remetente pode adicionar anexos.")

    # Save file
    safe_filename = f"{uuid.uuid4()}_{file.filename.replace(' ', '_')}"
    storage_dir = os.path.join("storage", "messages", str(message_id))
    os.makedirs(storage_dir, exist_ok=True)
    
    file_path = os.path.join(storage_dir, safe_filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar anexo: {str(e)}")

    url_path = f"/storage/messages/{message_id}/{safe_filename}"
    
    from app.modules.communication.models import MessageAttachment
    attachment = MessageAttachment(
        message_id=message_id,
        file_url=url_path,
        file_name=file.filename
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return {"id": attachment.id, "file_name": attachment.file_name, "file_url": attachment.file_url}
