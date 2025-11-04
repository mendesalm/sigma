from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.obedience_schema import ObedienceCreate, ObedienceUpdate, ObedienceResponse
from services import obedience_service
from middleware.dependencies import get_current_super_admin

router = APIRouter(
    prefix="/obediences",
    tags=["Obediences"]
)

@router.post("/", response_model=ObedienceResponse, status_code=status.HTTP_201_CREATED, summary="Cria uma nova Obediência")
def create_obedience_route(obedience: ObedienceCreate, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Cria uma nova Obediência no sistema."""
    return obedience_service.create_obedience(db=db, obedience=obedience)

@router.get("/", response_model=List[ObedienceResponse], summary="Lista todas as Obediências")
def get_all_obediences_route(db: Session = Depends(get_db)):
    """Retorna uma lista de todas as Obediências."""
    return obedience_service.get_all_obediences(db=db)

@router.get("/{obedience_id}", response_model=ObedienceResponse, summary="Busca uma Obediência por ID")
def get_obedience_route(obedience_id: int, db: Session = Depends(get_db)):
    """Busca uma Obediência específica pelo seu ID."""
    return obedience_service.get_obedience(db=db, obedience_id=obedience_id)

@router.put("/{obedience_id}", response_model=ObedienceResponse, summary="Atualiza uma Obediência")
def update_obedience_route(obedience_id: int, obedience_update: ObedienceUpdate, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Atualiza as informações de uma Obediência existente."""
    return obedience_service.update_obedience(db=db, obedience_id=obedience_id, obedience_update=obedience_update)

@router.delete("/{obedience_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Deleta uma Obediência")
def delete_obedience_route(obedience_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Deleta uma Obediência pelo seu ID."""
    obedience_service.delete_obedience(db=db, obedience_id=obedience_id)
    return
