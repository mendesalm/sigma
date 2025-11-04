# backend/services/lodge_service.py

from sqlalchemy.orm import Session
from typing import List, Optional

from models.models import Lodge
from schemas.lodge_schema import LodgeCreate, LodgeUpdate
from fastapi import HTTPException, status

def create_lodge(db: Session, lodge: LodgeCreate) -> Lodge:
    """Cria uma nova Loja."""
    db_lodge = db.query(Lodge).filter(Lodge.lodge_code == lodge.lodge_code).first()
    if db_lodge:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A lodge with this code already exists.")

    new_lodge = Lodge(**lodge.model_dump())
    db.add(new_lodge)
    db.commit()
    db.refresh(new_lodge)
    return new_lodge

def get_lodge(db: Session, lodge_id: int) -> Optional[Lodge]:
    """Busca uma única loja pelo ID."""
    db_lodge = db.query(Lodge).filter(Lodge.id == lodge_id).first()
    if not db_lodge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lodge not found.")
    return db_lodge

def get_all_lodges(db: Session) -> List[Lodge]:
    """Retorna todas as lojas."""
    return db.query(Lodge).all()

def update_lodge(db: Session, lodge_id: int, lodge_update: LodgeUpdate) -> Lodge:
    """Atualiza uma loja existente."""
    db_lodge = get_lodge(db, lodge_id)

    update_data = lodge_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lodge, key, value)

    db.add(db_lodge)
    db.commit()
    db.refresh(db_lodge)
    return db_lodge

def delete_lodge(db: Session, lodge_id: int):
    """Deleta uma loja."""
    db_lodge = get_lodge(db, lodge_id)

    # Lógica de verificação de dependências pode ser adicionada aqui

    db.delete(db_lodge)
    db.commit()
    return {"message": "Lodge deleted successfully."}
