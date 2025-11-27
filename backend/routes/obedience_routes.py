from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import database, dependencies
from ..schemas import obedience_schema
from ..services import obedience_service

router = APIRouter(
    prefix="/obediences",
    tags=["Obediences"],
)

# Dependency to check for super admin role
# Dependency to check for super admin role
# Now using shared dependency


@router.post("/", response_model=obedience_schema.ObedienceResponse, status_code=status.HTTP_201_CREATED)
def create_obedience(
    obedience: obedience_schema.ObedienceCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """Create a new obedience. Only accessible by super admins."""
    return obedience_service.create_obedience(db=db, obedience=obedience)


@router.get("/", response_model=list[obedience_schema.ObedienceResponse])
def read_obediences(
    skip: int = 0, limit: int = 100, only_top_level: bool = False, db: Session = Depends(database.get_db)
):
    """Retrieve all obediences. Publicly accessible."""
    obediences = obedience_service.get_obediences(db, skip=skip, limit=limit, only_top_level=only_top_level)
    return obediences


@router.get("/{obedience_id}", response_model=obedience_schema.ObedienceResponse)
def read_obedience(obedience_id: int, db: Session = Depends(database.get_db)):
    """Retrieve a single obedience by ID. Publicly accessible."""
    db_obedience = obedience_service.get_obedience(db, obedience_id=obedience_id)
    if db_obedience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obedience not found")
    return db_obedience


@router.put("/{obedience_id}", response_model=obedience_schema.ObedienceResponse)
def update_obedience(
    obedience_id: int,
    obedience: obedience_schema.ObedienceUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """Update an obedience. Only accessible by super admins."""
    db_obedience = obedience_service.update_obedience(db, obedience_id=obedience_id, obedience_update=obedience)
    if db_obedience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obedience not found")
    return db_obedience


@router.delete("/{obedience_id}", response_model=obedience_schema.ObedienceResponse)
def delete_obedience(
    obedience_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """Delete an obedience. Only accessible by super admins."""
    db_obedience = obedience_service.delete_obedience(db, obedience_id=obedience_id)
    if db_obedience is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obedience not found")
    return db_obedience
