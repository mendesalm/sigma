from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from schemas import administration_schema
from database import get_db
from schemas import administration_schema
from services import administration_service
import dependencies

router = APIRouter(prefix="/administrations", tags=["Administrations"])

@router.get("/", response_model=List[administration_schema.AdministrationResponse])
def get_administrations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(dependencies.get_current_user_payload)
):
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        return []
    return administration_service.get_administrations(db, lodge_id, skip, limit)

@router.get("/current", response_model=administration_schema.AdministrationResponse | None)
def get_current_administration(
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(dependencies.get_current_user_payload)
):
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        return None
    return administration_service.get_current_administration(db, lodge_id)

@router.post("/", response_model=administration_schema.AdministrationResponse, status_code=status.HTTP_201_CREATED)
def create_administration(
    admin_data: administration_schema.AdministrationCreate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(dependencies.get_current_user_payload)
):
    # Verify permissions: Webmaster or Admin
    # For now, strict check not implemented inside service, assuming route access implies capability or add check here
    return administration_service.create_administration(db, admin_data, current_user_payload)

@router.put("/{admin_id}", response_model=administration_schema.AdministrationResponse)
def update_administration(
    admin_id: int,
    admin_update: administration_schema.AdministrationUpdate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(dependencies.get_current_user_payload)
):
    return administration_service.update_administration(db, admin_id, admin_update, current_user_payload)
