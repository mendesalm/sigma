from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import dependencies
from app.modules.access_control.schemas import webmaster_schema as schemas
from app.modules.access_control.services import webmaster_service
from database import get_db
from app.core.logger import logger

router = APIRouter(
    prefix="/webmasters",
    tags=["Webmasters"],
)

@router.get(
    "/", 
    response_model=list[schemas.Webmaster],
    summary="Listar Webmasters",
    description="Retorna uma lista paginada de webmasters cadastrados no sistema. Acesso restrito a Super Admins."
)
def read_webmasters(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    return webmaster_service.get_webmasters(db, skip=skip, limit=limit)

@router.get(
    "/{webmaster_id}", 
    response_model=schemas.Webmaster,
    summary="Obter Webmaster por ID",
    description="Busca os detalhes de um webmaster específico. Acesso restrito a Super Admins."
)
def read_webmaster(
    webmaster_id: int, db: Session = Depends(get_db), current_user: dict = Depends(dependencies.get_current_super_admin)
):
    db_webmaster = webmaster_service.get_webmaster(db, webmaster_id=webmaster_id)
    if db_webmaster is None:
        logger.warning("Webmaster não encontrado na busca", extra={"extra_data": {"webmaster_id": webmaster_id}})
        raise HTTPException(status_code=404, detail="Webmaster não encontrado.")
    return db_webmaster

@router.post(
    "/", 
    response_model=schemas.Webmaster, 
    status_code=201,
    summary="Criar Webmaster",
    description="Cadastra um novo webmaster com associação a uma loja ou obediência. Acesso restrito a Super Admins."
)
def create_webmaster(
    webmaster: schemas.WebmasterCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    new_webmaster = webmaster_service.create_webmaster(db=db, webmaster=webmaster)
    logger.info("Webmaster criado com sucesso", extra={"extra_data": {"webmaster_id": new_webmaster.id, "username": new_webmaster.username}})
    return new_webmaster

@router.put(
    "/{webmaster_id}", 
    response_model=schemas.Webmaster,
    summary="Atualizar Webmaster",
    description="Atualiza as informações de um webmaster existente (ex: mudar o lodge_id vinculado). Acesso restrito a Super Admins."
)
def update_webmaster(
    webmaster_id: int,
    webmaster_update: schemas.WebmasterUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    db_webmaster = webmaster_service.update_webmaster(
        db=db, webmaster_id=webmaster_id, webmaster_update=webmaster_update
    )
    if db_webmaster is None:
        logger.warning("Tentativa de atualizar webmaster inexistente", extra={"extra_data": {"webmaster_id": webmaster_id}})
        raise HTTPException(status_code=404, detail="Webmaster não encontrado.")
        
    logger.info("Webmaster atualizado com sucesso", extra={"extra_data": {"webmaster_id": webmaster_id}})
    return db_webmaster

@router.delete(
    "/{webmaster_id}", 
    status_code=204,
    summary="Excluir Webmaster",
    description="Remove um webmaster do banco de dados. Acesso restrito a Super Admins."
)
def delete_webmaster(
    webmaster_id: int, db: Session = Depends(get_db), current_user: dict = Depends(dependencies.get_current_super_admin)
):
    db_webmaster = webmaster_service.delete_webmaster(db=db, webmaster_id=webmaster_id)
    if db_webmaster is None:
        logger.warning("Tentativa de excluir webmaster inexistente", extra={"extra_data": {"webmaster_id": webmaster_id}})
        raise HTTPException(status_code=404, detail="Webmaster não encontrado.")
        
    logger.info("Webmaster excluído com sucesso", extra={"extra_data": {"webmaster_id": webmaster_id}})
    return

@router.post(
    "/{webmaster_id}/reset-password", 
    response_model=schemas.Webmaster,
    summary="Resetar Senha do Webmaster",
    description="Força a redefinição de senha para o webmaster especificado. Acesso restrito a Super Admins."
)
def reset_webmaster_password(
    webmaster_id: int, db: Session = Depends(get_db), current_user: dict = Depends(dependencies.get_current_super_admin)
):
    db_webmaster = webmaster_service.reset_password(db, webmaster_id=webmaster_id)
    if db_webmaster is None:
        logger.warning("Tentativa de resetar senha de webmaster inexistente", extra={"extra_data": {"webmaster_id": webmaster_id}})
        raise HTTPException(status_code=404, detail="Webmaster não encontrado.")
        
    logger.info("Senha de webmaster resetada com sucesso", extra={"extra_data": {"webmaster_id": webmaster_id}})
    return db_webmaster
