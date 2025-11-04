from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas.lodge_schema import LodgeCreate, LodgeUpdate, LodgeResponse
from services import lodge_service
from middleware.dependencies import get_current_super_admin

router = APIRouter(
    prefix="/lodges",
    tags=["Lodges"]
)

@router.post("/", response_model=LodgeResponse, status_code=status.HTTP_201_CREATED, summary="Cria uma nova Loja")
def create_lodge_route(lodge: LodgeCreate, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Cria uma nova Loja no sistema."""
    return lodge_service.create_lodge(db=db, lodge=lodge)

@router.get("/", response_model=List[LodgeResponse], summary="Lista todas as Lojas")
def get_all_lodges_route(db: Session = Depends(get_db)):
    """Retorna uma lista de todas as Lojas."""
    return lodge_service.get_all_lodges(db=db)

@router.get("/{lodge_id}", response_model=LodgeResponse, summary="Busca uma Loja por ID")
def get_lodge_route(lodge_id: int, db: Session = Depends(get_db)):
    """Busca uma Loja específica pelo seu ID."""
    return lodge_service.get_lodge(db=db, lodge_id=lodge_id)

@router.put("/{lodge_id}", response_model=LodgeResponse, summary="Atualiza uma Loja")
def update_lodge_route(lodge_id: int, lodge_update: LodgeUpdate, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Atualiza as informações de uma Loja existente."""
    return lodge_service.update_lodge(db=db, lodge_id=lodge_id, lodge_update=lodge_update)

@router.delete("/{lodge_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Deleta uma Loja")
def delete_lodge_route(lodge_id: int, db: Session = Depends(get_db), current_admin: dict = Depends(get_current_super_admin)):
    """Deleta uma Loja pelo seu ID."""
    lodge_service.delete_lodge(db=db, lodge_id=lodge_id)
    return
