from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session
from datetime import date
from sqlalchemy import desc

from database import get_db
from models.models import Member, Publication, Role, MemberLodgeAssociation, Webmaster, RoleHistory, PublicationTypeEnum
from schemas.publication_schemas import PublicationResponse, PublicationCreate
from services.auth_service import get_current_user
from services.publication_service import PublicationService

router = APIRouter(prefix="/publications", tags=["Publications"])

def check_secretary_permissions(user: Member, lodge_id: int, db: Session):
    # Check if SuperAdmin (usually a separate table or flag, assuming SuperAdmin user handling elsewhere, 
    # but here we check roles).
    # Check Webmaster
    webmaster = db.query(Webmaster).filter(Webmaster.email == user.email).first()
    if webmaster:
        return True

    # Check Role in Lodge
    # We look for active association with role that has permission.
    # For now, simplistic check: "Secretário" in role name? 
    # Or better: check explicit Role names allowed.
    # We don't have a robust RBAC service injected here yet, so we query Association.
    
    # We need to find the MemberLodgeAssociation for this lodge
    assoc = db.query(MemberLodgeAssociation).filter(
        MemberLodgeAssociation.member_id == user.id,
        MemberLodgeAssociation.lodge_id == lodge_id,
        MemberLodgeAssociation.status == "Ativo"
    ).first()
    
    if not assoc:
        raise HTTPException(status_code=403, detail="Not a member of this lodge.")
        
    # Check user roles history or current active roles?
    # The current system seems to use 'RoleHistory' for roles? Or 'roles' in tables?
    # The models show 'Role' and 'RoleHistory'.
    # A member has 'role_history'. We need 'current' role.
    # 'MemberObedienceAssociation' has 'role_id'. 'MemberLodgeAssociation' does NOT have 'role_id'.
    # This implies Role is tracked via 'RoleHistory' where end_date is None?
    # Let's check RoleHistory for this member + lodge + end_date is None.
    

    current_roles = db.query(RoleHistory).filter(
        RoleHistory.member_id == user.id,
        RoleHistory.lodge_id == lodge_id,
        RoleHistory.end_date.is_(None)
    ).all()
    
    allowed_roles = ["Secretário", "Venerável Mestre", "Secretário Adjunto"]
    
    has_permission = False
    for hist in current_roles:
        if hist.role.name in allowed_roles:
            has_permission = True
            break
            
    if not has_permission:
        # Fallback: Check if user is the 'Technical Contact' of the lodge? (Webmaster)
        # Already checked Webmaster table.
        raise HTTPException(status_code=403, detail="Permission denied. Only Secretaries can manage publications.")

@router.get("/", response_model=List[PublicationResponse])
def get_publications(
    lodge_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all publications for a specific lodge.
    """
    # 1. Verify if user is member of this lodge
    is_member = db.query(MemberLodgeAssociation).filter(
        MemberLodgeAssociation.member_id == current_user.id,
        MemberLodgeAssociation.lodge_id == lodge_id
    ).first()
    
    if not is_member and not db.query(Webmaster).filter(Webmaster.email == current_user.email).first():
         raise HTTPException(status_code=403, detail="Access denied for this lodge.")
    
    return PublicationService.get_publications(db, lodge_id, skip, limit)

@router.post("/", response_model=PublicationResponse)
def create_publication(
    lodge_id: int = Form(...),
    title: str = Form(...),
    type: PublicationTypeEnum = Form(...),
    content: Optional[str] = Form(None),
    valid_until: Optional[date] = Form(None),
    file: UploadFile = File(...),
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_secretary_permissions(current_user, lodge_id, db)
    
    pub_data = PublicationCreate(
        title=title,
        type=type,
        content=content,
        valid_until=valid_until
    )
    
    return PublicationService.create_publication(
        db=db,
        publication_data=pub_data,
        file=file,
        author_id=current_user.id,
        lodge_id=lodge_id
    )

@router.delete("/{pub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_publication(
    pub_id: int,
    lodge_id: int = Query(...), # Require lodge_id to verify ownership/permission
    current_user: Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_secretary_permissions(current_user, lodge_id, db)
    PublicationService.delete_publication(db, pub_id, lodge_id)
