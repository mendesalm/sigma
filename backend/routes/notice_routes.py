from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import date

from database import get_db
from schemas.notice_schemas import NoticeResponse, NoticeCreate, NoticeUpdate
from services.notice_service import NoticeService
from dependencies import get_current_active_user_with_permissions, UserContext

router = APIRouter(prefix="/notices", tags=["Notices"])

# Permission Helper (similar to Publication)
def check_write_permission(context: UserContext, lodge_id: int):
    # Same logic: Admin, Webmaster (Lodge), Secretary
    if context.user_type == 'super_admin': return
    if context.user_type == 'webmaster':
        if context.user.lodge_id != lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster access denied for this Lodge.")
        return
    if context.user_type == 'member':
        # Check roles
        allowed_roles = ["Secretário", "Venerável Mestre", "Secretário Adjunto"]
        user_roles = [rh.role.name for rh in context.user.role_history if rh.lodge_id == lodge_id and rh.end_date is None]
        if any(role in allowed_roles for role in user_roles):
            return
    raise HTTPException(status_code=403, detail="Permission denied.")

@router.get("/", response_model=List[NoticeResponse])
def get_notices(
    lodge_id: int, 
    active_only: bool = True,
    db: Session = Depends(get_db),
    context: UserContext = Depends(get_current_active_user_with_permissions)
):
    # Read permission: Members of the lodge
    # Simplified check for now: if you clearly have lodge_id in context or association
    # Assuming authenticated user can read notices of their lodge
    return NoticeService.get_notices(db, lodge_id, active_only)

@router.post("/", response_model=NoticeResponse)
def create_notice(
    notice: NoticeCreate,
    db: Session = Depends(get_db),
    context: UserContext = Depends(get_current_active_user_with_permissions)
):
    check_write_permission(context, notice.lodge_id)
    return NoticeService.create_notice(db, notice)

@router.put("/{notice_id}", response_model=NoticeResponse)
def update_notice(
    notice_id: int,
    notice_update: NoticeUpdate,
    lodge_id: int = Query(...), # To verify permission
    db: Session = Depends(get_db),
    context: UserContext = Depends(get_current_active_user_with_permissions)
):
    check_write_permission(context, lodge_id)
    updated = NoticeService.update_notice(db, notice_id, notice_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Notice not found")
    return updated

@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notice(
    notice_id: int,
    lodge_id: int = Query(...), 
    db: Session = Depends(get_db),
    context: UserContext = Depends(get_current_active_user_with_permissions)
):
    check_write_permission(context, lodge_id)
    NoticeService.delete_notice(db, notice_id)
