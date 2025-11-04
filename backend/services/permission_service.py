# backend/services/permission_service.py

from sqlalchemy.orm import Session
from typing import List, Optional

from models.models import Permission
from schemas.permission_schema import PermissionCreate, PermissionUpdate
from fastapi import HTTPException, status

def create_permission(db: Session, permission: PermissionCreate) -> Permission:
    """Cria uma nova Permissão (Permission)."""
    db_permission = db.query(Permission).filter(Permission.action == permission.action).first()
    if db_permission:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A permission with this action already exists.")

    new_permission = Permission(**permission.model_dump())
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    return new_permission

def get_permission(db: Session, permission_id: int) -> Optional[Permission]:
    """Busca uma única permissão pelo ID."""
    db_permission = db.query(Permission).filter(Permission.id == permission_id).first()
    if not db_permission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found.")
    return db_permission

def get_all_permissions(db: Session) -> List[Permission]:
    """Retorna todas as permissões."""
    return db.query(Permission).all()

def update_permission(db: Session, permission_id: int, permission_update: PermissionUpdate) -> Permission:
    """Atualiza uma permissão existente."""
    db_permission = get_permission(db, permission_id)

    update_data = permission_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_permission, key, value)

    db.add(db_permission)
    db.commit()
    db.refresh(db_permission)
    return db_permission

def delete_permission(db: Session, permission_id: int):
    """Deleta uma permissão."""
    db_permission = get_permission(db, permission_id)

    db.delete(db_permission)
    db.commit()
    return {"message": "Permission deleted successfully."}
