
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import database, dependencies
from ..services import lodge_service
from ..schemas import lodge_schema

router = APIRouter(
    prefix="/lodges",
    tags=["Lodges"],
)

# Dependency to check for super admin role
# This can be moved to a shared dependency file later if needed
def get_current_super_admin(payload: dict = Depends(dependencies.get_current_user_payload)):
    if payload.get("user_type") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )
    return payload

@router.post("/", response_model=lodge_schema.LodgeResponse, status_code=status.HTTP_201_CREATED)
def create_lodge(
    lodge: lodge_schema.LodgeCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin)
):
    """Create a new lodge. Only accessible by super admins."""
    return lodge_service.create_lodge(db=db, lodge=lodge)

@router.get("/", response_model=List[lodge_schema.LodgeResponse])
def read_lodges(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    """Retrieve all lodges. Publicly accessible."""
    lodges = lodge_service.get_lodges(db, skip=skip, limit=limit)
    return lodges

@router.get("/{lodge_id}", response_model=lodge_schema.LodgeResponse)
def read_lodge(
    lodge_id: int,
    db: Session = Depends(database.get_db)
):
    """Retrieve a single lodge by ID. Publicly accessible."""
    db_lodge = lodge_service.get_lodge(db, lodge_id=lodge_id)
    if db_lodge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lodge not found")
    return db_lodge

@router.put("/{lodge_id}", response_model=lodge_schema.LodgeResponse)
def update_lodge(
    lodge_id: int,
    lodge: lodge_schema.LodgeUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin)
):
    """Update a lodge. Only accessible by super admins."""
    db_lodge = lodge_service.update_lodge(db, lodge_id=lodge_id, lodge_update=lodge)
    if db_lodge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lodge not found")
    return db_lodge

@router.delete("/{lodge_id}", response_model=lodge_schema.LodgeResponse)
def delete_lodge(
    lodge_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin)
):
    """Delete a lodge. Only accessible by super admins."""
    db_lodge = lodge_service.delete_lodge(db, lodge_id=lodge_id)
    if db_lodge is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lodge not found")
    return db_lodge
