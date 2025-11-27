import secrets
import string

from sqlalchemy.orm import Session

from .. import models, schemas
from ..utils import password_utils
from . import email_service


def get_webmaster(db: Session, webmaster_id: int):
    return db.query(models.Webmaster).filter(models.Webmaster.id == webmaster_id).first()


def get_webmasters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Webmaster).offset(skip).limit(limit).all()


def create_webmaster(db: Session, webmaster: schemas.WebmasterCreate):
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
    db_webmaster = get_webmaster(db, webmaster_id)
    if not db_webmaster:
        return None

    db.delete(db_webmaster)
    db.commit()
    return db_webmaster


def reset_password(db: Session, webmaster_id: int):
    db_webmaster = get_webmaster(db, webmaster_id)
    if not db_webmaster:
        return None

    alphabet = string.ascii_letters + string.digits
    temp_password = "".join(secrets.choice(alphabet) for i in range(10))

    hashed_password = password_utils.get_password_hash(temp_password)
    db_webmaster.password_hash = hashed_password
    db.commit()

    email_service.send_password_reset_email(to=db_webmaster.email, new_password=temp_password)

    return db_webmaster
