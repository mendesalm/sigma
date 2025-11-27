from datetime import date
from sqlalchemy.orm import Session

from ..models import models
from ..schemas import member_schema
from ..utils.password_utils import hash_password


def get_members_by_lodge(db: Session, lodge_id: int, skip: int = 0, limit: int = 100) -> list[models.Member]:
    """Fetches all members associated with a specific lodge."""
    return (
        db.query(models.Member)
        .join(models.MemberLodgeAssociation)
        .filter(models.MemberLodgeAssociation.lodge_id == lodge_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_member_in_lodge(db: Session, member_id: int, lodge_id: int) -> models.Member | None:
    """Fetches a single member if they are associated with the specified lodge."""
    return (
        db.query(models.Member)
        .join(models.MemberLodgeAssociation)
        .filter(models.Member.id == member_id, models.MemberLodgeAssociation.lodge_id == lodge_id)
        .first()
    )


def create_member_for_lodge(db: Session, member_data: member_schema.MemberCreateWithAssociation) -> models.Member:
    """Creates a new member and associates them with a lodge."""
    # Separate password and association data from the main member data
    password = member_data.password
    lodge_id = member_data.lodge_id
    role_id = member_data.role_id
    family_members_data = member_data.family_members

    member_dict = member_data.model_dump(exclude={"password", "lodge_id", "role_id", "family_members"})

    # Create Member instance
    db_member = models.Member(**member_dict, password_hash=hash_password(password))
    db.add(db_member)
    db.flush()  # Use flush to get the db_member.id before commit

    # Create Association (without role_id)
    association = models.MemberLodgeAssociation(member_id=db_member.id, lodge_id=lodge_id)
    db.add(association)

    # Create Initial Role History
    role_history = models.RoleHistory(
        member_id=db_member.id,
        role_id=role_id,
        lodge_id=lodge_id,
        start_date=date.today(),
        end_date=None
    )
    db.add(role_history)

    # Create Family Members
    if family_members_data:
        for fm_data in family_members_data:
            db_family_member = models.FamilyMember(**fm_data.model_dump(), member_id=db_member.id)
            db.add(db_family_member)

    db.commit()
    db.refresh(db_member)
    return db_member


def update_member_in_lodge(
    db: Session, member_id: int, lodge_id: int, member_update: member_schema.MemberUpdate
) -> models.Member | None:
    """Updates a member's data, ensuring they belong to the lodge."""
    db_member = get_member_in_lodge(db, member_id, lodge_id)
    if not db_member:
        return None

    update_data = member_update.model_dump(exclude_unset=True)
    if "password" in update_data:
        db_member.password_hash = hash_password(update_data.pop("password"))

    for key, value in update_data.items():
        setattr(db_member, key, value)

    db.commit()
    db.refresh(db_member)
    return db_member


def delete_member_association(db: Session, member_id: int, lodge_id: int) -> models.MemberLodgeAssociation | None:
    """Removes a member's association from a lodge, without deleting the member."""
    association = (
        db.query(models.MemberLodgeAssociation)
        .filter(
            models.MemberLodgeAssociation.member_id == member_id, models.MemberLodgeAssociation.lodge_id == lodge_id
        )
        .first()
    )

    if not association:
        return None

    db.delete(association)
    db.commit()
    return association


def add_role_to_member(
    db: Session, member_id: int, lodge_id: int, role_data: member_schema.RoleHistoryCreate
) -> models.RoleHistory:
    """Adds a role history entry for a member in a specific lodge."""
    role_history = models.RoleHistory(
        member_id=member_id,
        lodge_id=lodge_id,
        role_id=role_data.role_id,
        start_date=role_data.start_date,
        end_date=role_data.end_date
    )
    db.add(role_history)
    db.commit()
    db.refresh(role_history)
    return role_history


def delete_role_history(db: Session, member_id: int, role_history_id: int, lodge_id: int) -> bool:
    """Deletes a role history entry."""
    role_history = (
        db.query(models.RoleHistory)
        .filter(
            models.RoleHistory.id == role_history_id,
            models.RoleHistory.member_id == member_id,
            models.RoleHistory.lodge_id == lodge_id
        )
        .first()
    )

    if not role_history:
        return False

    db.delete(role_history)
    db.commit()
    return True
