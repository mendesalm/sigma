import os
import uuid

from sqlalchemy.orm import Session

from models import models
from schemas import lodge_schema
from services import auth_service


def get_lodge(db: Session, lodge_id: int) -> models.Lodge | None:
    """Fetches a single lodge by its ID."""
    return db.query(models.Lodge).filter(models.Lodge.id == lodge_id).first()


def get_lodges(db: Session, skip: int = 0, limit: int = 100) -> list[models.Lodge]:
    """Fetches all lodges with pagination."""
    return db.query(models.Lodge).offset(skip).limit(limit).all()


def create_lodge(db: Session, lodge: lodge_schema.LodgeCreate) -> models.Lodge:
    """
    Creates a new lodge with a unique lodge_code and an associated Webmaster user for its technical contact.
    """
    # Generate a unique code for the lodge
    unique_code = str(uuid.uuid4())  # Simple unique code generation

    try:
        db_lodge = models.Lodge(
            **lodge.model_dump(),
            lodge_code=unique_code,
            is_active=True,  # Set default active status
        )
        db.add(db_lodge)
        db.flush()  # Flush to get the ID

        # Now, create the associated webmaster user
        auth_service._create_webmaster_user(
            db=db,
            name=lodge.technical_contact_name,
            email=lodge.technical_contact_email,
            lodge_id=db_lodge.id,
            commit=False,  # Do not commit yet
        )

        # Create storage directory for the lodge
        # Sanitize lodge_number to ensure valid directory name
        safe_lodge_number = (
            "".join(c for c in lodge.lodge_number if c.isalnum() or c in (" ", "-", "_")).strip().replace(" ", "_")
        )
        storage_path = os.path.join("storage", "lodges", f"loja_{safe_lodge_number}")
        os.makedirs(storage_path, exist_ok=True)

        db.commit()
        db.refresh(db_lodge)

    except Exception as e:
        db.rollback()
        raise e

    return db_lodge


def update_lodge(db: Session, lodge_id: int, lodge_update: lodge_schema.LodgeUpdate) -> models.Lodge | None:
    """Updates an existing lodge."""
    db_lodge = get_lodge(db, lodge_id)
    if not db_lodge:
        return None

    update_data = lodge_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lodge, key, value)

    db.commit()
    db.refresh(db_lodge)
    return db_lodge


def delete_lodge(db: Session, lodge_id: int) -> models.Lodge | None:
    """Deletes a lodge."""
    db_lodge = get_lodge(db, lodge_id)
    if not db_lodge:
        return None

    db.delete(db_lodge)
    db.commit()
    return db_lodge
