from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from models import models
from schemas import administration_schema

def get_administrations(db: Session, lodge_id: int, skip: int = 0, limit: int = 100) -> list[models.Administration]:
    """
    List administrations for a specific lodge.
    """
    return (
        db.query(models.Administration)
        .filter(models.Administration.lodge_id == lodge_id)
        .options(
            joinedload(models.Administration.role_histories).joinedload(models.RoleHistory.role),
            joinedload(models.Administration.role_histories).joinedload(models.RoleHistory.member)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_current_administration(db: Session, lodge_id: int) -> models.Administration | None:
    """
    Get the currently active administration for a lodge.
    """
    return (
        db.query(models.Administration)
        .filter(models.Administration.lodge_id == lodge_id, models.Administration.is_current == True)
        .options(
            joinedload(models.Administration.role_histories).joinedload(models.RoleHistory.role),
            joinedload(models.Administration.role_histories).joinedload(models.RoleHistory.member)
        )
        .first()
    )

def create_administration(
    db: Session, 
    data: administration_schema.AdministrationCreate, 
    current_user_payload: dict
) -> models.Administration:
    """
    Create a new administration. 
    If officers are provided, create RoleHistory entries linked to this administration.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        raise HTTPException(status_code=403, detail="User not associated with a lodge.")

    # 1. Handle 'is_current' logic
    if data.is_current:
        # User wants this to be the current one, so disable others
        _unset_current_administration(db, lodge_id)
    
    # 2. Create Administration
    db_admin = models.Administration(
        identifier=data.identifier,
        start_date=data.start_date,
        end_date=data.end_date,
        is_current=data.is_current,
        lodge_id=lodge_id
    )
    db.add(db_admin)
    db.flush() # Get ID

    # 3. Create Officers (Role History)
    if data.officers:
        for officer in data.officers:
            _create_officer_entry(db, db_admin, officer.role_id, officer.member_id, lodge_id)

    db.commit()
    db.refresh(db_admin)
    return db_admin

def update_administration(
    db: Session,
    admin_id: int,
    data: administration_schema.AdministrationUpdate,
    current_user_payload: dict
) -> models.Administration:
    """
    Update administration details and/or board composition.
    """
    lodge_id = current_user_payload.get("lodge_id")
    db_admin = db.query(models.Administration).filter(models.Administration.id == admin_id, models.Administration.lodge_id == lodge_id).first()
    
    if not db_admin:
        raise HTTPException(status_code=404, detail="Administration not found.")

    # 1. Update basic fields
    if data.identifier is not None:
        db_admin.identifier = data.identifier
    if data.start_date is not None:
        db_admin.start_date = data.start_date
    if data.end_date is not None:
        db_admin.end_date = data.end_date
    
    # 2. Handle 'is_current' switch
    if data.is_current is not None:
        if data.is_current and not db_admin.is_current:
             _unset_current_administration(db, lodge_id, exclude_id=admin_id)
        db_admin.is_current = data.is_current

    # 3. Handle Officers Update (Full Replacement Strategy for simplicity)
    if data.officers is not None:
        # Remove existing officers for this administration
        # Note: This deletes the history record. If we wanted to keep "audit", we might soft delete or handle differently.
        # But for "Definition of Execution", replacement makes sense.
        db.query(models.RoleHistory).filter(models.RoleHistory.administration_id == admin_id).delete()
        
        # Add new ones
        for officer in data.officers:
             _create_officer_entry(db, db_admin, officer.role_id, officer.member_id, lodge_id)

        # Optional: Ask user if they want to update dates of existing records? 
        # For now, we assume the RoleHistory record matches the Admin dates exactly.

    db.commit()
    db.refresh(db_admin)
    return db_admin

def _unset_current_administration(db: Session, lodge_id: int, exclude_id: int = None):
    query = db.query(models.Administration).filter(models.Administration.lodge_id == lodge_id, models.Administration.is_current == True)
    if exclude_id:
        query = query.filter(models.Administration.id != exclude_id)
    
    currents = query.all()
    for c in currents:
        c.is_current = False
    
def _create_officer_entry(db: Session, admin: models.Administration, role_id: int, member_id: int, lodge_id: int):
    # Check if member exists in lodge? skipped for brevity, FK handles it mostly.
    
    new_role_history = models.RoleHistory(
        member_id=member_id,
        role_id=role_id,
        lodge_id=lodge_id,
        administration_id=admin.id,
        start_date=admin.start_date,
        end_date=admin.end_date
    )
    db.add(new_role_history)
