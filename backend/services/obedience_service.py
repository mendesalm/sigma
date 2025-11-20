
from sqlalchemy.orm import Session
from typing import List, Optional

from ..models import models
from ..schemas import obedience_schema

def get_obedience(db: Session, obedience_id: int) -> Optional[models.Obedience]:
    """Fetches a single obedience by its ID."""
    return db.query(models.Obedience).filter(models.Obedience.id == obedience_id).first()

def get_obediences(db: Session, skip: int = 0, limit: int = 100) -> List[models.Obedience]:
    """Fetches all obediences with pagination."""
    return db.query(models.Obedience).offset(skip).limit(limit).all()

def create_obedience(db: Session, obedience: obedience_schema.ObedienceCreate) -> models.Obedience:
    """Creates a new obedience."""
    db_obedience = models.Obedience(**obedience.model_dump())
    db.add(db_obedience)
    db.commit()
    db.refresh(db_obedience)
    return db_obedience

def update_obedience(db: Session, obedience_id: int, obedience_update: obedience_schema.ObedienceUpdate) -> Optional[models.Obedience]:
    """Updates an existing obedience."""
    db_obedience = get_obedience(db, obedience_id)
    if not db_obedience:
        return None
    
    update_data = obedience_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obedience, key, value)
    
    db.commit()
    db.refresh(db_obedience)
    return db_obedience

def delete_obedience(db: Session, obedience_id: int) -> Optional[models.Obedience]:
    """Deletes an obedience."""
    db_obedience = get_obedience(db, obedience_id)
    if not db_obedience:
        return None
        
    db.delete(db_obedience)
    db.commit()
    return db_obedience
