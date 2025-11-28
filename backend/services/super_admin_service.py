import secrets
import string

from sqlalchemy.orm import Session

import models
from schemas import super_admin_schema
from utils import password_utils
from . import email_service


def get_super_admin(db: Session, super_admin_id: int):
    return db.query(models.SuperAdmin).filter(models.SuperAdmin.id == super_admin_id).first()


def get_super_admin_by_email(db: Session, email: str):
    return db.query(models.SuperAdmin).filter(models.SuperAdmin.email == email).first()


def get_super_admins(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.SuperAdmin).offset(skip).limit(limit).all()


def create_super_admin(db: Session, super_admin: super_admin_schema.SuperAdminCreate):
    hashed_password = password_utils.hash_password(super_admin.password)
    db_super_admin = models.SuperAdmin(
        email=super_admin.email, username=super_admin.username, password_hash=hashed_password
    )
    db.add(db_super_admin)
    db.commit()
    db.refresh(db_super_admin)
    return db_super_admin


def update_super_admin(db: Session, super_admin_id: int, super_admin_update: super_admin_schema.SuperAdminUpdate):
    db_super_admin = get_super_admin(db, super_admin_id)
    if not db_super_admin:
        return None
    update_data = super_admin_update.model_dump(exclude_unset=True)
    if "password" in update_data and update_data["password"]:
        hashed_password = password_utils.hash_password(update_data["password"])
        update_data["password_hash"] = hashed_password
        del update_data["password"]

    for key, value in update_data.items():
        setattr(db_super_admin, key, value)

    db.commit()
    db.refresh(db_super_admin)
    return db_super_admin


def delete_super_admin(db: Session, super_admin_id: int):
    db_super_admin = get_super_admin(db, super_admin_id)
    if not db_super_admin:
        return None
    db.delete(db_super_admin)
    db.commit()
    return db_super_admin


def reset_password(db: Session, super_admin_id: int):
    db_super_admin = get_super_admin(db, super_admin_id)
    if not db_super_admin:
        return None

    alphabet = string.ascii_letters + string.digits
    temp_password = "".join(secrets.choice(alphabet) for i in range(10))

    hashed_password = password_utils.hash_password(temp_password)
    db_super_admin.password_hash = hashed_password
    db.commit()

    email_service.send_password_reset_email(to=db_super_admin.email, new_password=temp_password)

    return db_super_admin


def get_dashboard_stats(db: Session):
    total_obediences = db.query(models.Obedience).count()
    total_lodges = db.query(models.Lodge).filter(models.Lodge.is_active == True).count()
    active_members = db.query(models.Member).filter(models.Member.status == "Active").count()

    return {"total_obediences": total_obediences, "total_lodges": total_lodges, "active_members": active_members}
