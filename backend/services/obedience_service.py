# backend/services/obedience_service.py

from sqlalchemy.orm import Session
from typing import List, Optional

from models.models import Obedience
from schemas.obedience_schema import ObedienceCreate, ObedienceUpdate
from fastapi import HTTPException, status

def create_obedience(db: Session, obedience: ObedienceCreate) -> Obedience:
    """Cria uma nova Obediência."""
    db_obedience = db.query(Obedience).filter(Obedience.name == obedience.name).first()
    if db_obedience:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An obedience with this name already exists.")

    new_obedience = Obedience(**obedience.model_dump())
    db.add(new_obedience)
    db.commit()
    db.refresh(new_obedience)
    return new_obedience

def get_obedience(db: Session, obedience_id: int) -> Optional[Obedience]:
    """Busca uma única obediência pelo ID."""
    db_obedience = db.query(Obedience).filter(Obedience.id == obedience_id).first()
    if not db_obedience:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obedience not found.")
    return db_obedience

def get_all_obediences(db: Session) -> List[Obedience]:
    """Retorna todas as obediências."""
    return db.query(Obedience).all()

def update_obedience(db: Session, obedience_id: int, obedience_update: ObedienceUpdate) -> Obedience:
    """Atualiza uma obediência existente."""
    db_obedience = get_obedience(db, obedience_id)

    update_data = obedience_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obedience, key, value)

    db.add(db_obedience)
    db.commit()
    db.refresh(db_obedience)
    return db_obedience

def delete_obedience(db: Session, obedience_id: int):
    """Deleta uma obediência."""
    db_obedience = get_obedience(db, obedience_id)

    # Lógica de verificação de dependências pode ser adicionada aqui
    # Por exemplo, verificar se a obediência tem lojas associadas antes de deletar.

    db.delete(db_obedience)
    db.commit()
    return {"message": "Obedience deleted successfully."}
