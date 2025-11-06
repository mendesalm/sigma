from sqlalchemy.orm import Session
from .. import models
from ..schemas import webmaster_schema
from ..services.auth_service import get_password_hash

def get_webmaster(db: Session, webmaster_id: int):
    return db.query(models.Webmaster).filter(models.Webmaster.id == webmaster_id).first()

def get_webmaster_by_email(db: Session, email: str):
    return db.query(models.Webmaster).filter(models.Webmaster.email == email).first()

def get_webmasters(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Webmaster).offset(skip).limit(limit).all()

def create_webmaster(db: Session, webmaster: webmaster_schema.WebmasterCreate):
    hashed_password = get_password_hash(webmaster.password)
    db_webmaster = models.Webmaster(
        username=webmaster.username,
        email=webmaster.email,
        password_hash=hashed_password,
        is_active=webmaster.is_active,
        lodge_id=webmaster.lodge_id,
        obedience_id=webmaster.obedience_id
    )
    db.add(db_webmaster)
    db.commit()
    db.refresh(db_webmaster)
    return db_webmaster

def update_webmaster(db: Session, webmaster_id: int, webmaster: webmaster_schema.WebmasterUpdate):
    db_webmaster = get_webmaster(db, webmaster_id)
    if not db_webmaster:
        return None

    update_data = webmaster.dict(exclude_unset=True)
    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        update_data["password_hash"] = hashed_password
        del update_data["password"]

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
