from sqlalchemy.orm import Session
from .. import models
from ..schemas import webmaster_schema
from ..utils import password_utils
from . import email_service
import secrets
import string

def get_webmaster(db: Session, webmaster_id: int):
    return db.query(models.Webmaster).filter(models.Webmaster.id == webmaster_id).first()

def get_webmasters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Webmaster).offset(skip).limit(limit).all()

def reset_password(db: Session, webmaster_id: int):
    db_webmaster = get_webmaster(db, webmaster_id)
    if not db_webmaster:
        return None

    alphabet = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(alphabet) for i in range(10))
    
    hashed_password = password_utils.get_password_hash(temp_password)
    db_webmaster.password_hash = hashed_password
    db.commit()

    email_service.send_password_reset_email(to=db_webmaster.email, new_password=temp_password)
    
    return db_webmaster
