

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status

from ..models import models
from ..schemas import obedience_schema
from ..services import auth_service


def get_obedience(db: Session, obedience_id: int) -> models.Obedience | None:
    """Fetches a single obedience by its ID."""
    return db.query(models.Obedience).filter(models.Obedience.id == obedience_id).first()

def get_obediences(db: Session, skip: int = 0, limit: int = 100) -> list[models.Obedience]:
    """Fetches all obediences with pagination."""
    return db.query(models.Obedience).offset(skip).limit(limit).all()

def create_obedience(db: Session, obedience: obedience_schema.ObedienceCreate) -> models.Obedience:
    """
    Creates a new obedience and an associated Webmaster user for its technical contact.
    """
    try:
        # Create the obedience first
        db_obedience = models.Obedience(**obedience.model_dump())
        db.add(db_obedience)
        db.commit()
        db.refresh(db_obedience)
    except IntegrityError as e:
        db.rollback()
        # Check if the error is due to duplicate name or other unique constraint
        if "Duplicate entry" in str(e) and "'obediences.name'" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Já existe uma obediência com este nome."
            )
        # Handle other potential integrity errors if necessary
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro de integridade ao criar obediência: {e}"
        )

    # Now, create the associated webmaster user
    auth_service._create_webmaster_user(
        db=db,
        name=obedience.technical_contact_name,
        email=obedience.technical_contact_email,
        obedience_id=db_obedience.id
    )

    return db_obedience

def update_obedience(db: Session, obedience_id: int, obedience_update: obedience_schema.ObedienceUpdate) -> models.Obedience | None:
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

def delete_obedience(db: Session, obedience_id: int) -> models.Obedience | None:
    """Deletes an obedience."""
    db_obedience = get_obedience(db, obedience_id)
    if not db_obedience:
        return None

    db.delete(db_obedience)
    db.commit()
    return db_obedience
