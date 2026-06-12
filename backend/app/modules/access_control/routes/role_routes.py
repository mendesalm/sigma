from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import database
import dependencies
from app.modules.access_control.schemas import role_schema
from app.modules.access_control.services import role_service
from app.core.logger import logger

router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
)

def get_current_super_admin(payload: dict = Depends(dependencies.get_current_user_payload)):
    if payload.get("user_type") != "super_admin":
        logger.warning("Tentativa de acesso restrito a Super Admin negada", extra={"extra_data": {"user_id": payload.get("user_id")}})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Acesso negado. Ação restrita a Super Administradores."
        )
    return payload

@router.post(
    "/", 
    response_model=role_schema.RoleResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Criar Cargo",
    description="Cria um novo cargo (Role) no sistema de controle de acesso. Acesso restrito a Super Admins."
)
def create_role(
    role: role_schema.RoleCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin),
):
    db_role = role_service.get_role_by_name(db, name=role.name)
    if db_role:
        logger.warning("Tentativa de criar cargo duplicado", extra={"extra_data": {"role_name": role.name}})
        raise HTTPException(status_code=400, detail="O nome do cargo já existe.")
    
    new_role = role_service.create_role(db=db, role=role)
    logger.info("Cargo criado com sucesso", extra={"extra_data": {"role_id": new_role.id, "role_name": new_role.name}})
    return new_role

@router.get(
    "/", 
    response_model=list[role_schema.RoleResponse],
    summary="Listar Cargos",
    description="Retorna uma lista paginada de cargos, com suporte a filtros. Acesso permitido a usuários logados."
)
def read_roles(
    skip: int = 0,
    limit: int = 100,
    type: str = None,  # Optional filter
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    return role_service.get_roles(db, skip=skip, limit=limit, role_type=type)

@router.get(
    "/{role_id}", 
    response_model=role_schema.RoleResponse,
    summary="Obter Cargo por ID",
    description="Busca e retorna os detalhes de um cargo específico. Acesso permitido a usuários logados."
)
def read_role(
    role_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    db_role = role_service.get_role(db, role_id=role_id)
    if db_role is None:
        logger.warning("Cargo não encontrado na busca", extra={"extra_data": {"role_id": role_id}})
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo não encontrado.")
    return db_role

@router.put(
    "/{role_id}", 
    response_model=role_schema.RoleResponse,
    summary="Atualizar Cargo",
    description="Atualiza as informações de um cargo. Acesso restrito a Super Admins."
)
def update_role(
    role_id: int,
    role: role_schema.RoleUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin),
):
    db_role = role_service.update_role(db, role_id=role_id, role_update=role)
    if db_role is None:
        logger.warning("Tentativa de atualizar cargo inexistente", extra={"extra_data": {"role_id": role_id}})
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo não encontrado.")
    
    logger.info("Cargo atualizado com sucesso", extra={"extra_data": {"role_id": role_id}})
    return db_role

@router.delete(
    "/{role_id}", 
    response_model=role_schema.RoleResponse,
    summary="Excluir Cargo",
    description="Remove um cargo do banco de dados. Acesso restrito a Super Admins."
)
def delete_role(
    role_id: int, db: Session = Depends(database.get_db), current_user: dict = Depends(get_current_super_admin)
):
    db_role = role_service.delete_role(db, role_id=role_id)
    if db_role is None:
        logger.warning("Tentativa de excluir cargo inexistente", extra={"extra_data": {"role_id": role_id}})
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cargo não encontrado.")
    
    logger.info("Cargo excluído com sucesso", extra={"extra_data": {"role_id": role_id}})
    return db_role
