

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import database, dependencies
from ..schemas import role_schema
from ..services import role_service

router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
)

# Dependency for Super Admin check
def get_current_super_admin(payload: dict = Depends(dependencies.get_current_user_payload)):
    if payload.get("user_type") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action."
        )
    return payload

@router.post("/", response_model=role_schema.RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    role: role_schema.RoleCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin)
):
    db_role = role_service.get_role_by_name(db, name=role.name)
    if db_role:
        raise HTTPException(status_code=400, detail="Role name already exists")
    return role_service.create_role(db=db, role=role)

@router.get("/", response_model=list[role_schema.RoleResponse])
def read_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin)
):
    roles = role_service.get_roles(db, skip=skip, limit=limit)
    return roles

@router.get("/{role_id}", response_model=role_schema.RoleResponse)
def read_role(
    role_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin)
):
    db_role = role_service.get_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return db_role

@router.put("/{role_id}", response_model=role_schema.RoleResponse)
def update_role(
    role_id: int,
    role: role_schema.RoleUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin)
):
    db_role = role_service.update_role(db, role_id=role_id, role_update=role)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return db_role

@router.delete("/{role_id}", response_model=role_schema.RoleResponse)
def delete_role(
    role_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin)
):
    db_role = role_service.delete_role(db, role_id=role_id)
    if db_role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return db_role
