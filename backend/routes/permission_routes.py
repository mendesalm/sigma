from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.permission_schema import PermissionCreate, PermissionUpdate, PermissionResponse
from services import permission_service
from middleware.dependencies import get_current_super_admin

router = APIRouter(
    prefix="/permissions",
    tags=["Permissions"]
)

@router.post("/", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED, summary="Cria uma nova Permissão")
def create_permission_route(permission: PermissionCreate, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    return permission_service.create_permission(db=db, permission=permission)

@router.get("/", response_model=List[PermissionResponse], summary="Lista todas as Permissões")
def get_all_permissions_route(db: Session = Depends(get_db)):
    return permission_service.get_all_permissions(db=db)

@router.get("/{permission_id}", response_model=PermissionResponse, summary="Busca uma Permissão por ID")
def get_permission_route(permission_id: int, db: Session = Depends(get_db)):
    return permission_service.get_permission(db=db, permission_id=permission_id)

@router.put("/{permission_id}", response_model=PermissionResponse, summary="Atualiza uma Permissão")
def update_permission_route(permission_id: int, permission_update: PermissionUpdate, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    return permission_service.update_permission(db=db, permission_id=permission_id, permission_update=permission_update)

@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Deleta uma Permissão")
def delete_permission_route(permission_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    permission_service.delete_permission(db=db, permission_id=permission_id)
    return
