# backend/routes/super_admin_routes.py

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.super_admin_schema import SuperAdminCreate, SuperAdminUpdate, SuperAdminResponse
from services import super_admin_service
from middleware.dependencies import get_current_super_admin

router = APIRouter(
    prefix="/super-admins",
    tags=["Super Admins"]
)

@router.post("/", response_model=SuperAdminResponse, status_code=status.HTTP_201_CREATED, summary="Cria um novo Super Administrador")
def create_super_admin_route(super_admin: SuperAdminCreate, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Cria um novo Super Administrador no sistema."""
    return super_admin_service.create_super_admin(db=db, super_admin=super_admin)

@router.get("/", response_model=List[SuperAdminResponse], summary="Lista todos os Super Administradores")
def get_all_super_admins_route(db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Retorna uma lista de todos os Super Administradores."""
    return super_admin_service.get_all_super_admins(db=db)

@router.get("/{super_admin_id}", response_model=SuperAdminResponse, summary="Busca um Super Administrador por ID")
def get_super_admin_route(super_admin_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Busca um Super Administrador específico pelo seu ID."""
    return super_admin_service.get_super_admin(db=db, super_admin_id=super_admin_id)

@router.put("/{super_admin_id}", response_model=SuperAdminResponse, summary="Atualiza um Super Administrador")
def update_super_admin_route(super_admin_id: int, super_admin_update: SuperAdminUpdate, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Atualiza as informações de um Super Administrador existente."""
    return super_admin_service.update_super_admin(db=db, super_admin_id=super_admin_id, super_admin_update=super_admin_update)

@router.delete("/{super_admin_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Deleta um Super Administrador")
def delete_super_admin_route(super_admin_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Deleta um Super Administrador pelo seu ID."""
    super_admin_service.delete_super_admin(db=db, super_admin_id=super_admin_id)
    return
