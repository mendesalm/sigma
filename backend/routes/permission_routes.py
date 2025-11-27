from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import database, dependencies
from ..schemas import permission_schema
from ..services import permission_service

router = APIRouter(
    prefix="/permissions",
    tags=["Permissions"],
)


# Dependency for Super Admin check
def get_current_super_admin(payload: dict = Depends(dependencies.get_current_user_payload)):
    if payload.get("user_type") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to perform this action."
        )
    return payload


@router.post("/", response_model=permission_schema.PermissionResponse, status_code=status.HTTP_201_CREATED)
def create_permission(
    permission: permission_schema.PermissionCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin),
):
    db_permission = permission_service.get_permission_by_action(db, action=permission.action)
    if db_permission:
        raise HTTPException(status_code=400, detail="Permission action already exists")
    return permission_service.create_permission(db=db, permission=permission)


@router.get("/", response_model=list[permission_schema.PermissionResponse])
def read_permissions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin),  # Secure this endpoint as well
):
    permissions = permission_service.get_permissions(db, skip=skip, limit=limit)
    return permissions


@router.get("/{permission_id}", response_model=permission_schema.PermissionResponse)
def read_permission(
    permission_id: int, db: Session = Depends(database.get_db), current_user: dict = Depends(get_current_super_admin)
):
    db_permission = permission_service.get_permission(db, permission_id=permission_id)
    if db_permission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
    return db_permission


@router.put("/{permission_id}", response_model=permission_schema.PermissionResponse)
def update_permission(
    permission_id: int,
    permission: permission_schema.PermissionUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_super_admin),
):
    db_permission = permission_service.update_permission(db, permission_id=permission_id, permission_update=permission)
    if db_permission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
    return db_permission


@router.delete("/{permission_id}", response_model=permission_schema.PermissionResponse)
def delete_permission(
    permission_id: int, db: Session = Depends(database.get_db), current_user: dict = Depends(get_current_super_admin)
):
    db_permission = permission_service.delete_permission(db, permission_id=permission_id)
    if db_permission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
    return db_permission
