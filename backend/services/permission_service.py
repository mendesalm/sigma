
from sqlalchemy.orm import Session
from typing import List, Optional

from ..models import models
from ..schemas import permission_schema

def get_permission(db: Session, permission_id: int) -> Optional[models.Permission]:
    return db.query(models.Permission).filter(models.Permission.id == permission_id).first()

def get_permission_by_action(db: Session, action: str) -> Optional[models.Permission]:
    return db.query(models.Permission).filter(models.Permission.action == action).first()

def get_permissions(db: Session, skip: int = 0, limit: int = 100) -> List[models.Permission]:
    return db.query(models.Permission).offset(skip).limit(limit).all()

def create_permission(db: Session, permission: permission_schema.PermissionCreate) -> models.Permission:
    db_permission = models.Permission(**permission.model_dump())
    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission

def update_permission(db: Session, permission_id: int, permission_update: permission_schema.PermissionUpdate) -> Optional[models.Permission]:
    db_permission = get_permission(db, permission_id)
    if not db_permission:
        return None
    
    update_data = permission_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permission, key, value)
    
    db.commit()
    db.refresh(db_permission)
    return db_permission

def delete_permission(db: Session, permission_id: int) -> Optional[models.Permission]:
    db_permission = get_permission(db, permission_id)
    if not db_permission:
        return None
        
    db.delete(db_permission)
    db.commit()
    return db_permission
