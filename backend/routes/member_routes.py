from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import database, dependencies
from ..schemas import member_schema
from ..services import member_service

router = APIRouter(
    prefix="/members",
    tags=["Lodge Members"],
)


@router.post("/", response_model=member_schema.MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    member: member_schema.MemberCreateWithAssociation,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Create a new member. Webmasters can only create for their lodge."""
    user_type = current_user.get("user_type")
    
    if user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        if member.lodge_id != lodge_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You can only create members for your own lodge."
            )
    elif user_type != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    return member_service.create_member_for_lodge(db=db, member_data=member)


@router.get("/", response_model=list[member_schema.MemberResponse])
def read_members(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Retrieve members. SuperAdmins see all, Webmasters see their lodge's."""
    user_type = current_user.get("user_type")

    if user_type == "super_admin":
        return db.query(dependencies.Member).offset(skip).limit(limit).all()
    elif user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        return member_service.get_members_by_lodge(db, lodge_id=lodge_id, skip=skip, limit=limit)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.get("/{member_id}", response_model=member_schema.MemberResponse)
def read_member(
    member_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Retrieve a specific member."""
    user_type = current_user.get("user_type")
    
    if user_type == "super_admin":
        db_member = db.query(dependencies.Member).filter(dependencies.Member.id == member_id).first()
        if db_member is None:
            raise HTTPException(status_code=404, detail="Member not found")
        return db_member
    elif user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        db_member = member_service.get_member_in_lodge(db, member_id=member_id, lodge_id=lodge_id)
        if db_member is None:
            raise HTTPException(status_code=404, detail="Member not found in this lodge")
        return db_member
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.put("/{member_id}", response_model=member_schema.MemberResponse)
def update_member(
    member_id: int,
    member: member_schema.MemberUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Update a member."""
    user_type = current_user.get("user_type")
    
    if user_type == "super_admin":
        # For SuperAdmin, we need a generic update service or reuse existing logic if appropriate
        # For now, let's assume we can use the same service but we need to be careful about lodge association checks
        # Ideally we should have a generic update_member service. 
        # But member_service.update_member_in_lodge checks for lodge association.
        
        # Let's fetch the member first
        db_member = db.query(dependencies.Member).filter(dependencies.Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")
            
        # Update logic similar to update_member_in_lodge but without lodge check
        from ..utils.password_utils import hash_password
        update_data = member.model_dump(exclude_unset=True)
        if "password" in update_data:
            db_member.password_hash = hash_password(update_data.pop("password"))

        for key, value in update_data.items():
            setattr(db_member, key, value)

        db.commit()
        db.refresh(db_member)
        return db_member

    elif user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        db_member = member_service.update_member_in_lodge(db, member_id=member_id, lodge_id=lodge_id, member_update=member)
        if db_member is None:
            raise HTTPException(status_code=404, detail="Member not found in this lodge")
        return db_member
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member_association(
    member_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Disassociate a member (Webmaster) or Delete member (SuperAdmin)."""
    user_type = current_user.get("user_type")
    
    if user_type == "super_admin":
        # SuperAdmin deletes the member entirely? Or just association?
        # For now, let's implement full delete for SuperAdmin
        db_member = db.query(dependencies.Member).filter(dependencies.Member.id == member_id).first()
        if not db_member:
            raise HTTPException(status_code=404, detail="Member not found")
        db.delete(db_member)
        db.commit()
        return

    elif user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        deleted_association = member_service.delete_member_association(db, member_id=member_id, lodge_id=lodge_id)
        if deleted_association is None:
            raise HTTPException(status_code=404, detail="Member association not found in this lodge")
        return
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.post("/{member_id}/roles", response_model=member_schema.RoleHistoryResponse, status_code=status.HTTP_201_CREATED)
def add_role_history(
    member_id: int,
    role_data: member_schema.RoleHistoryCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Add a role history entry for a member."""
    user_type = current_user.get("user_type")
    
    if user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
        
        # Verify member belongs to lodge
        member = member_service.get_member_in_lodge(db, member_id, lodge_id)
        if not member:
            raise HTTPException(status_code=404, detail="Member not found in this lodge")
            
        return member_service.add_role_to_member(db, member_id, lodge_id, role_data)
        
    elif user_type == "super_admin":
        # For SuperAdmin, we need to know which lodge context. 
        # Ideally, the frontend should pass lodge_id, but RoleHistoryCreate doesn't have it.
        # We can assume the member's primary lodge or require lodge_id in the request.
        # For simplicity, let's look up the member's lodge association.
        # WARNING: This might be ambiguous if member has multiple lodges.
        # For now, let's fetch the first lodge association.
        member = db.query(dependencies.Member).filter(dependencies.Member.id == member_id).first()
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
            
        association = db.query(dependencies.MemberLodgeAssociation).filter(dependencies.MemberLodgeAssociation.member_id == member_id).first()
        if not association:
             raise HTTPException(status_code=400, detail="Member has no lodge association")
             
        return member_service.add_role_to_member(db, member_id, association.lodge_id, role_data)
    else:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.delete("/{member_id}/roles/{role_history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role_history(
    member_id: int,
    role_history_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Delete a role history entry."""
    user_type = current_user.get("user_type")
    
    if user_type == "webmaster":
        lodge_id = current_user.get("lodge_id")
        if not lodge_id:
             raise HTTPException(status_code=403, detail="Webmaster not associated with a lodge")
             
        success = member_service.delete_role_history(db, member_id, role_history_id, lodge_id)
        if not success:
            raise HTTPException(status_code=404, detail="Role history entry not found or not accessible")
            
    elif user_type == "super_admin":
        # SuperAdmin can delete any, but service requires lodge_id.
        # We need to find the lodge_id for this role_history entry.
        role_history = db.query(dependencies.RoleHistory).filter(dependencies.RoleHistory.id == role_history_id).first()
        if not role_history:
             raise HTTPException(status_code=404, detail="Role history entry not found")
             
        success = member_service.delete_role_history(db, member_id, role_history_id, role_history.lodge_id)
        if not success:
             raise HTTPException(status_code=404, detail="Failed to delete role history")
    else:
        raise HTTPException(status_code=403, detail="Not authorized")
