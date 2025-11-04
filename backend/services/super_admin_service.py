# backend/services/super_admin_service.py

from sqlalchemy.orm import Session
from typing import List, Optional

from models.models import SuperAdmin
from schemas.super_admin_schema import SuperAdminCreate, SuperAdminUpdate
from fastapi import HTTPException, status
from services.auth_service import get_password_hash, verify_password # Reutiliza as funções de hash

def create_super_admin(db: Session, super_admin: SuperAdminCreate) -> SuperAdmin:
    """Cria um novo Super Administrador."""
    db_super_admin = db.query(SuperAdmin).filter(SuperAdmin.email == super_admin.email).first()
    if db_super_admin:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A Super Admin with this email already exists.")

    hashed_password = get_password_hash(super_admin.password)
    new_super_admin = SuperAdmin(
        username=super_admin.username,
        email=super_admin.email,
        password_hash=hashed_password
    )
    db.add(new_super_admin)
    db.commit()
    db.refresh(new_super_admin)
    return new_super_admin

def get_super_admin(db: Session, super_admin_id: int) -> Optional[SuperAdmin]:
    """Busca um único Super Administrador pelo ID."""
    db_super_admin = db.query(SuperAdmin).filter(SuperAdmin.id == super_admin_id).first()
    if not db_super_admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Super Admin not found.")
    return db_super_admin

def get_all_super_admins(db: Session) -> List[SuperAdmin]:
    """Retorna todos os Super Administradores."""
    return db.query(SuperAdmin).all()

def update_super_admin(db: Session, super_admin_id: int, super_admin_update: SuperAdminUpdate) -> SuperAdmin:
    """Atualiza um Super Administrador existente."""
    db_super_admin = get_super_admin(db, super_admin_id)

    update_data = super_admin_update.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        db_super_admin.password_hash = get_password_hash(update_data["password"])
        del update_data["password"] # Remove a senha do dicionário para não tentar setar no modelo diretamente

    for key, value in update_data.items():
        setattr(db_super_admin, key, value)
    
    db.add(db_super_admin)
    db.commit()
    db.refresh(db_super_admin)
    return db_super_admin

def delete_super_admin(db: Session, super_admin_id: int):
    """Deleta um Super Administrador."""
    db_super_admin = get_super_admin(db, super_admin_id)

    db.delete(db_super_admin)
    db.commit()
    return {"message": "Super Admin deleted successfully."}
