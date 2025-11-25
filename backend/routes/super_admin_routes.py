from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..services import super_admin_service

router = APIRouter(
    prefix="/super-admins",
    tags=["Super Admins"],
    # dependencies=[Depends(get_current_active_user)], # TODO: Add authentication
)

@router.post("/", response_model=schemas.SuperAdminResponse)
def create_super_admin(super_admin: schemas.SuperAdminCreate, db: Session = Depends(get_db)):
    db_super_admin = super_admin_service.get_super_admin_by_email(db, email=super_admin.email)
    if db_super_admin:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    return super_admin_service.create_super_admin(db=db, super_admin=super_admin)

@router.get("/", response_model=List[schemas.SuperAdminResponse])
def read_super_admins(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    super_admins = super_admin_service.get_super_admins(db, skip=skip, limit=limit)
    return super_admins

@router.get("/{super_admin_id}", response_model=schemas.SuperAdminResponse)
def read_super_admin(super_admin_id: int, db: Session = Depends(get_db)):
    db_super_admin = super_admin_service.get_super_admin(db, super_admin_id=super_admin_id)
    if db_super_admin is None:
        raise HTTPException(status_code=404, detail="Super Admin não encontrado")
    return db_super_admin

@router.put("/{super_admin_id}", response_model=schemas.SuperAdminResponse)
def update_super_admin(super_admin_id: int, super_admin: schemas.SuperAdminUpdate, db: Session = Depends(get_db)):
    db_super_admin = super_admin_service.update_super_admin(db, super_admin_id=super_admin_id, super_admin_update=super_admin)
    if db_super_admin is None:
        raise HTTPException(status_code=404, detail="Super Admin não encontrado")
    return db_super_admin

@router.delete("/{super_admin_id}", response_model=schemas.SuperAdminResponse)
def delete_super_admin(super_admin_id: int, db: Session = Depends(get_db)):
    db_super_admin = super_admin_service.delete_super_admin(db, super_admin_id=super_admin_id)
    if db_super_admin is None:
        raise HTTPException(status_code=404, detail="Super Admin não encontrado")
    return db_super_admin

@router.post("/{super_admin_id}/reset-password", response_model=schemas.SuperAdminResponse)
def reset_super_admin_password(super_admin_id: int, db: Session = Depends(get_db)):
    db_super_admin = super_admin_service.reset_password(db, super_admin_id=super_admin_id)
    if db_super_admin is None:
        raise HTTPException(status_code=404, detail="Super Admin não encontrado")
    return db_super_admin
