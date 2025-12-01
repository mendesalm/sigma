from datetime import date
from sqlalchemy.orm import Session, joinedload

from models import models
from schemas import member_schema
from utils.password_utils import hash_password


def get_members_by_lodge(db: Session, lodge_id: int, skip: int = 0, limit: int = 100) -> list[models.Member]:
    """Fetches all members associated with a specific lodge with optimized eager loading."""
    members = (
        db.query(models.Member)
        .join(models.MemberLodgeAssociation)
        .filter(models.MemberLodgeAssociation.lodge_id == lodge_id)
        .options(
            joinedload(models.Member.role_history).joinedload(models.RoleHistory.role)
        )
        .order_by(models.Member.full_name)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return members


def get_member_in_lodge(db: Session, member_id: int, lodge_id: int) -> models.Member | None:
    """Fetches a single member if they are associated with the specified lodge."""
    return (
        db.query(models.Member)
        .join(models.MemberLodgeAssociation)
        .filter(models.Member.id == member_id, models.MemberLodgeAssociation.lodge_id == lodge_id)
        .first()
    )


def get_member_by_cim(db: Session, cim: str) -> models.Member | None:
    """Fetches a member by their CIM."""
    return db.query(models.Member).filter(models.Member.cim == cim).first()


def create_member_for_lodge(db: Session, member_data: member_schema.MemberCreateWithAssociation) -> models.Member:
    """Creates a new member and associates them with a lodge."""
    # Separate password and association data from the main member data
    password = member_data.password
    lodge_id = member_data.lodge_id
    role_id = member_data.role_id
    status = member_data.status
    member_class = member_data.member_class
    family_members_data = member_data.family_members

    member_dict = member_data.model_dump(exclude={"password", "lodge_id", "role_id", "family_members", "status", "member_class"})

    # Create Member instance
    db_member = models.Member(**member_dict, password_hash=hash_password(password))
    db.add(db_member)
    db.flush()  # Use flush to get the db_member.id before commit

    # Create Association (without role_id)
    association = models.MemberLodgeAssociation(
        member_id=db_member.id, 
        lodge_id=lodge_id,
        status=status,
        member_class=member_class,
        start_date=date.today()
    )
    db.add(association)

    # Create Initial Role History (only if role_id is provided)
    if role_id:
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


def associate_member_to_lodge(
    db: Session, 
    member_id: int, 
    association_data: member_schema.MemberAssociateLodge
) -> models.Member:
    """Associates an existing member with a lodge, updating their data if provided."""
    db_member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not db_member:
        raise ValueError("Member not found")

    # Check if already associated
    existing_association = (
        db.query(models.MemberLodgeAssociation)
        .filter(models.MemberLodgeAssociation.member_id == member_id, models.MemberLodgeAssociation.lodge_id == association_data.lodge_id)
        .first()
    )

    if existing_association:
        # Update existing association
        existing_association.status = association_data.status
        existing_association.member_class = association_data.member_class
    else:
        # Create new association
        new_association = models.MemberLodgeAssociation(
            member_id=member_id,
            lodge_id=association_data.lodge_id,
            status=association_data.status,
            member_class=association_data.member_class,
            start_date=date.today()
        )
        db.add(new_association)

    # Update Member Data if provided
    if association_data.member_update:
        update_data = association_data.member_update.model_dump(exclude_unset=True)
        if "password" in update_data:
             # Only update password if explicitly provided (and not None/Empty)
             if update_data["password"]:
                db_member.password_hash = hash_password(update_data.pop("password"))
             else:
                update_data.pop("password")

        for key, value in update_data.items():
            setattr(db_member, key, value)

    # Add Role History if provided
    if association_data.role_id:
        # Check if active role exists for this lodge
        active_role = (
            db.query(models.RoleHistory)
            .filter(
                models.RoleHistory.member_id == member_id,
                models.RoleHistory.lodge_id == association_data.lodge_id,
                models.RoleHistory.end_date.is_(None)
            )
            .first()
        )
        
        if active_role:
            if active_role.role_id != association_data.role_id:
                # End current role
                active_role.end_date = date.today()
                # Create new role
                new_role = models.RoleHistory(
                    member_id=member_id,
                    role_id=association_data.role_id,
                    lodge_id=association_data.lodge_id,
                    start_date=date.today()
                )
                db.add(new_role)
        else:
             new_role = models.RoleHistory(
                member_id=member_id,
                role_id=association_data.role_id,
                lodge_id=association_data.lodge_id,
                start_date=date.today()
            )
             db.add(new_role)

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
