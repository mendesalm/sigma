
from sqlalchemy.orm import Session
from typing import List, Optional

from ..models import models
from ..schemas import member_schema
from ..utils.password_utils import hash_password


def get_members_by_lodge(db: Session, lodge_id: int, skip: int = 0, limit: int = 100) -> List[models.Member]:
    """Fetches all members associated with a specific lodge."""
    return db.query(models.Member).join(models.MemberLodgeAssociation).filter(models.MemberLodgeAssociation.lodge_id == lodge_id).offset(skip).limit(limit).all()

def get_member_in_lodge(db: Session, member_id: int, lodge_id: int) -> Optional[models.Member]:
    """Fetches a single member if they are associated with the specified lodge."""
    return db.query(models.Member).join(models.MemberLodgeAssociation).filter(
        models.Member.id == member_id,
        models.MemberLodgeAssociation.lodge_id == lodge_id
    ).first()

def create_member_for_lodge(db: Session, member_data: member_schema.MemberCreateWithAssociation) -> models.Member:
    """Creates a new member and associates them with a lodge."""
    # Separate password and association data from the main member data
    password = member_data.password
    lodge_id = member_data.lodge_id
    role_id = member_data.role_id

    member_dict = member_data.model_dump(exclude={'password', 'lodge_id', 'role_id'})
    
    # Create Member instance
    db_member = models.Member(
        **member_dict,
        password_hash=hash_password(password)
    )
    db.add(db_member)
    db.flush() # Use flush to get the db_member.id before commit

    # Create Association
    association = models.MemberLodgeAssociation(
        member_id=db_member.id,
        lodge_id=lodge_id,
        role_id=role_id
    )
    db.add(association)
    
    db.commit()
    db.refresh(db_member)
    return db_member

def update_member_in_lodge(db: Session, member_id: int, lodge_id: int, member_update: member_schema.MemberUpdate) -> Optional[models.Member]:
    """Updates a member's data, ensuring they belong to the lodge."""
    db_member = get_member_in_lodge(db, member_id, lodge_id)
    if not db_member:
        return None

    update_data = member_update.model_dump(exclude_unset=True)
    if 'password' in update_data:
        db_member.password_hash = hash_password(update_data.pop('password'))

    for key, value in update_data.items():
        setattr(db_member, key, value)
    
    db.commit()
    db.refresh(db_member)
    return db_member

def delete_member_association(db: Session, member_id: int, lodge_id: int) -> Optional[models.MemberLodgeAssociation]:
    """Removes a member's association from a lodge, without deleting the member."""
    association = db.query(models.MemberLodgeAssociation).filter(
        models.MemberLodgeAssociation.member_id == member_id,
        models.MemberLodgeAssociation.lodge_id == lodge_id
    ).first()

    if not association:
        return None
    
    db.delete(association)
    db.commit()
    return association
