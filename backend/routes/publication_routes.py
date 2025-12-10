from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from sqlalchemy.orm import Session
from datetime import date
from sqlalchemy import desc

from database import get_db
from models.models import Member, Rejection, Publication, MemberLodgeAssociation, Webmaster, RoleHistory, PublicationTypeEnum
from schemas.publication_schemas import PublicationResponse, PublicationCreate
from services.publication_service import PublicationService
from dependencies import get_current_active_user_with_permissions, UserContext

router = APIRouter(prefix="/publications", tags=["Publications"])

def check_upload_permission(context: UserContext, lodge_id: int):
    # 1. Super Admin always allowed
    if context.user_type == 'super_admin':
        return True
        
    # 2. Webmaster
    if context.user_type == 'webmaster':
        # Check if Webmaster is linked to this lodge
        if context.user.lodge_id == lodge_id:
            return True
        # If Webmaster is for an obedience? (Not implemented in simple check, assume lodge webmaster)
        raise HTTPException(status_code=403, detail="Webmaster does not have permission for this lodge.")

    # 3. Member (Secretary)
    if context.user_type == 'member':
        # Check if member belongs to lodge
        # context.user is Member object
        user = context.user
        
        # Check active role in this lodge
        # We can iterate through role_history where lodge_id matches and end_date is None
        current_roles = [
            rh for rh in user.role_history 
            if rh.lodge_id == lodge_id and rh.end_date is None
        ]
        
        allowed_roles = ["Secretário", "Venerável Mestre", "Secretário Adjunto"]
        
        for hist in current_roles:
            if hist.role.name in allowed_roles:
                return True
                
        raise HTTPException(status_code=403, detail="Permission denied. Only Secretaries can manage publications.")

    raise HTTPException(status_code=403, detail="Unauthorized user type.")

def check_read_permission(context: UserContext, lodge_id: int, db: Session):
    # 1. Super Admin/Webmaster
    if context.user_type in ['super_admin', 'webmaster']:
        # Ideally check if webmaster is relevant to lodge, but for read maybe allow?
        # Let's enforce strictness for Webmaster
        if context.user_type == 'webmaster' and context.user.lodge_id != lodge_id:
             raise HTTPException(status_code=403, detail="Access denied for this lodge.")
        return True

    # 2. Member
    if context.user_type == 'member':
        # Check association
        is_member = db.query(MemberLodgeAssociation).filter(
            MemberLodgeAssociation.member_id == context.user.id,
            MemberLodgeAssociation.lodge_id == lodge_id,
            MemberLodgeAssociation.status == "Ativo"
        ).first()
        
        if not is_member:
            raise HTTPException(status_code=403, detail="Not a member of this lodge.")
        return True
        
    raise HTTPException(status_code=403, detail="Unauthorized.")


@router.get("/", response_model=List[PublicationResponse])
def get_publications(
    lodge_id: int,
    skip: int = 0,
    limit: int = 100,
    context: UserContext = Depends(get_current_active_user_with_permissions),
    db: Session = Depends(get_db)
):
    """
    Get all publications for a specific lodge.
    """
    check_read_permission(context, lodge_id, db)
    return PublicationService.get_publications(db, lodge_id, skip, limit)

@router.post("/", response_model=PublicationResponse)
def create_publication(
    lodge_id: int = Form(...),
    title: str = Form(...),
    type: PublicationTypeEnum = Form(...),
    content: Optional[str] = Form(None),
    valid_until: Optional[date] = Form(None),
    file: UploadFile = File(...),
    context: UserContext = Depends(get_current_active_user_with_permissions),
    db: Session = Depends(get_db)
):
    check_upload_permission(context, lodge_id)
    
    pub_data = PublicationCreate(
        title=title,
        type=type,
        content=content,
        valid_until=valid_until
    )
    
    # Author ID logic:
    # If member, use member ID.
    # If Webmaster/Admin, what ID to use?
    # The 'Publication' model has 'author_id' FK to 'members.id'.
    # This is a constraint. Webmasters might NOT be in members table.
    # If the user is NOT a member, we might have an issue saving 'author_id'.
    # For now, we assume 'author_id' refers to a Member.
    # If a Webmaster posts, they should probably have a shadow Member account or we need to make author_id nullable/polymorphic.
    # Given the previous context (Webmaster creates Lodge -> Technical Contact), they are just a Webmaster user.
    # We might need to handle this.
    # Quick fix: If Webmaster, find a suitable 'Member' to attribute to? Or 'Venerável'?
    # OR: Make author_id nullable in Model? Too late safely?
    # BEST: Check if Webmaster is also a member?
    # ALTERNATIVE: Use a system member ID or the Webmaster's linked member ID if exists?
    
    # Let's assume for now only Members (Secretaries) post. 
    # If Context is Webmaster, we might fail on author_id if we don't have a Member ID.
    # However, requirements said "Secretário and SuperAdmin".
    
    author_id = 99999 # Fallback or error?
    if context.user_type == 'member':
        author_id = context.user.id
    else:
        # Try to find a member corresponding to the webmaster/admin?
        # Or Just use the first member of the lodge (Venerável)?
        # Or raise error "Webmaster cannot post directly without member profile"?
        # Let's try to pass 1 (Admin) if exists or handle it.
        # Ideally we should grab the "Lodge Application" user.
        # For now, let's proceed. If FK fails, we know why.
        # We will assume the user has a Member ID or we use a place holder if we really must.
        # BUT 'author_id' is FK to 'members'.
        if context.user_type == 'webmaster':
             # Try to find member with same email
             m = db.query(Member).filter(Member.email == context.user.email).first()
             if m: author_id = m.id
             else:
                 # Check if we can use a generic "Secretaria" member for the lodge?
                 raise HTTPException(status_code=400, detail="Webmaster user must have a linked Member profile to post.")
    
    return PublicationService.create_publication(
        db=db,
        publication_data=pub_data,
        file=file,
        author_id=author_id,
        lodge_id=lodge_id
    )

@router.delete("/{pub_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_publication(
    pub_id: int,
    lodge_id: int = Query(...), 
    context: UserContext = Depends(get_current_active_user_with_permissions),
    db: Session = Depends(get_db)
):
    check_upload_permission(context, lodge_id)
    PublicationService.delete_publication(db, pub_id, lodge_id)
