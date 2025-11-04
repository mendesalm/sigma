# backend/services/role_service.py

from sqlalchemy.orm import Session
from typing import List, Optional

from models.models import Role
from schemas.role_schema import RoleCreate, RoleUpdate
from fastapi import HTTPException, status

def create_role(db: Session, role: RoleCreate) -> Role:
    """Cria um novo Cargo (Role)."""
    db_role = db.query(Role).filter(Role.name == role.name).first()
    if db_role:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A role with this name already exists.")

    new_role = Role(**role.model_dump())
    db.add(new_role)
    db.commit()
    db.refresh(new_role)
    return new_role

def get_role(db: Session, role_id: int) -> Optional[Role]:
    """Busca um único cargo pelo ID."""
    db_role = db.query(Role).filter(Role.id == role_id).first()
    if not db_role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found.")
    return db_role

def get_all_roles(db: Session) -> List[Role]:
    """Retorna todos os cargos."""
    return db.query(Role).all()

def update_role(db: Session, role_id: int, role_update: RoleUpdate) -> Role:
    """Atualiza um cargo existente."""
    db_role = get_role(db, role_id)

    update_data = role_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_role, key, value)

    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def delete_role(db: Session, role_id: int):
    """Deleta um cargo."""
    db_role = get_role(db, role_id)

    # Lógica de verificação de dependências pode ser adicionada aqui

    db.delete(db_role)
    db.commit()
    return {"message": "Role deleted successfully."}
