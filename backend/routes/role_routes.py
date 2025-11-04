from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.role_schema import RoleCreate, RoleUpdate, RoleResponse
from services import role_service
from middleware.dependencies import get_current_super_admin

router = APIRouter(
    prefix="/roles",
    tags=["Roles"]
)

@router.post("/", response_model=RoleResponse, status_code=status.HTTP_201_CREATED, summary="Cria um novo Cargo (Role)")
def create_role_route(role: RoleCreate, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Cria um novo Cargo (Role) no sistema."""
    return role_service.create_role(db=db, role=role)

@router.get("/", response_model=List[RoleResponse], summary="Lista todos os Cargos")
def get_all_roles_route(db: Session = Depends(get_db)):
    """Retorna uma lista de todos os Cargos."""
    return role_service.get_all_roles(db=db)

@router.get("/{role_id}", response_model=RoleResponse, summary="Busca um Cargo por ID")
def get_role_route(role_id: int, db: Session = Depends(get_db)):
    """Busca um Cargo específico pelo seu ID."""
    return role_service.get_role(db=db, role_id=role_id)

@router.put("/{role_id}", response_model=RoleResponse, summary="Atualiza um Cargo")
def update_role_route(role_id: int, role_update: RoleUpdate, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Atualiza as informações de um Cargo existente."""
    return role_service.update_role(db=db, role_id=role_id, role_update=role_update)

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Deleta um Cargo")
def delete_role_route(role_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Deleta um Cargo pelo seu ID."""
    role_service.delete_role(db=db, role_id=role_id)
    return
