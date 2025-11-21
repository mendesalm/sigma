

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
    lodge_id: int = Depends(dependencies.get_current_lodge_webmaster)
):
    """Create a new member within the webmaster's lodge."""
    # Ensure the creation request is for the webmaster's own lodge
    if member.lodge_id != lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create members for your own lodge."
        )
    # You might also want to check if the role_id is valid for this lodge
    return member_service.create_member_for_lodge(db=db, member_data=member)

@router.get("/", response_model=list[member_schema.MemberResponse])
def read_members_for_lodge(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    lodge_id: int = Depends(dependencies.get_current_lodge_webmaster)
):
    """Retrieve all members of the webmaster's lodge."""
    members = member_service.get_members_by_lodge(db, lodge_id=lodge_id, skip=skip, limit=limit)
    return members

@router.get("/{member_id}", response_model=member_schema.MemberResponse)
def read_member(
    member_id: int,
    db: Session = Depends(database.get_db),
    lodge_id: int = Depends(dependencies.get_current_lodge_webmaster)
):
    """Retrieve a specific member from the webmaster's lodge."""
    db_member = member_service.get_member_in_lodge(db, member_id=member_id, lodge_id=lodge_id)
    if db_member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this lodge")
    return db_member

@router.put("/{member_id}", response_model=member_schema.MemberResponse)
def update_member(
    member_id: int,
    member: member_schema.MemberUpdate,
    db: Session = Depends(database.get_db),
    lodge_id: int = Depends(dependencies.get_current_lodge_webmaster)
):
    """Update a member in the webmaster's lodge."""
    db_member = member_service.update_member_in_lodge(db, member_id=member_id, lodge_id=lodge_id, member_update=member)
    if db_member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this lodge")
    return db_member

@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member_association(
    member_id: int,
    db: Session = Depends(database.get_db),
    lodge_id: int = Depends(dependencies.get_current_lodge_webmaster)
):
    """Disassociate a member from the webmaster's lodge (does not delete the member)."""
    deleted_association = member_service.delete_member_association(db, member_id=member_id, lodge_id=lodge_id)
    if deleted_association is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member association not found in this lodge")
    return
