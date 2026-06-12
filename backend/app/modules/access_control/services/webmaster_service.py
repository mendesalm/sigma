import secrets
import string

from sqlalchemy.orm import Session

import models
from app.modules.access_control.schemas import webmaster_schema as schemas
from app.modules.access_control.utils import password_utils
from app.modules.core.services import email_service
from app.core.logger import logger


def get_webmaster(db: Session, webmaster_id: int):
    """Busca um Webmaster pelo seu ID exclusivo."""
    return db.query(models.Webmaster).filter(models.Webmaster.id == webmaster_id).first()


def get_webmasters(db: Session, skip: int = 0, limit: int = 100):
    """Retorna a lista paginada de todos os Webmasters cadastrados."""
    return db.query(models.Webmaster).offset(skip).limit(limit).all()


def create_webmaster(db: Session, webmaster: schemas.WebmasterCreate):
    """
    Cria um novo Webmaster e gera o hash seguro da sua senha antes de
    armazená-lo no banco de dados.
    """
    hashed_password = password_utils.get_password_hash(webmaster.password)
    db_webmaster = models.Webmaster(
        username=webmaster.username,
        email=webmaster.email,
        password_hash=hashed_password,
        is_active=webmaster.is_active,
        lodge_id=webmaster.lodge_id,
        obedience_id=webmaster.obedience_id,
    )
    db.add(db_webmaster)
    db.commit()
    db.refresh(db_webmaster)
    return db_webmaster


def update_webmaster(db: Session, webmaster_id: int, webmaster_update: schemas.WebmasterUpdate):
    """
    Atualiza as informações de um Webmaster. Se a senha for alterada,
    realiza o hash da nova senha automaticamente.
    """
    db_webmaster = get_webmaster(db, webmaster_id)
    if not db_webmaster:
        return None

    update_data = webmaster_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["password_hash"] = password_utils.get_password_hash(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(db_webmaster, key, value)

    db.commit()
    db.refresh(db_webmaster)
    return db_webmaster


def delete_webmaster(db: Session, webmaster_id: int):
    """Remove um Webmaster definitivamente do banco de dados."""
    db_webmaster = get_webmaster(db, webmaster_id)
    if not db_webmaster:
        return None

    db.delete(db_webmaster)
    db.commit()
    return db_webmaster


def reset_password(db: Session, webmaster_id: int):
    """
    Reseta a senha do Webmaster, gerando uma nova senha temporária alfanumérica,
    atualiza o hash no banco e envia a nova senha por e-mail.
    """
    db_webmaster = get_webmaster(db, webmaster_id)
    if not db_webmaster:
        return None

    alphabet = string.ascii_letters + string.digits
    temp_password = "".join(secrets.choice(alphabet) for i in range(10))

    hashed_password = password_utils.get_password_hash(temp_password)
    db_webmaster.password_hash = hashed_password
    db.commit()

    try:
        email_service.send_password_reset_email(to=db_webmaster.email, new_password=temp_password)
        logger.info("E-mail de reset de senha enviado com sucesso", extra={"extra_data": {"webmaster_id": webmaster_id, "email": db_webmaster.email}})
    except Exception as e:
        logger.error(f"Falha ao enviar e-mail de reset de senha: {str(e)}", exc_info=True, extra={"extra_data": {"webmaster_id": webmaster_id}})

    return db_webmaster
