from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import database, dependencies
from ..models import models
from ..schemas import member_role_schema

router = APIRouter(
    prefix="/members",
    tags=["Member Roles & Permissions"],
)


@router.post("/{member_id}/roles", status_code=status.HTTP_201_CREATED)
def assign_role_to_member(
    member_id: int,
    assignment: member_role_schema.MemberRoleAssign,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(dependencies.require_permission("members:assign_role")),
):
    # Verify target member exists
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Verify Role exists
    role = db.query(models.Role).filter(models.Role.id == assignment.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Security Check: Ensure Webmaster/User is assigning role within their allowed context
    # If Webmaster, must match their lodge_id/obedience_id
    if context.user_type == "webmaster":
        if assignment.lodge_id and context.lodge_id != assignment.lodge_id:
            raise HTTPException(status_code=403, detail="Cannot assign role to another Lodge")
        if assignment.obedience_id and context.obedience_id != assignment.obedience_id:
            raise HTTPException(status_code=403, detail="Cannot assign role to another Obedience")

    # Create Association
    if assignment.lodge_id:
        # Check if association already exists
        existing = (
            db.query(models.MemberLodgeAssociation)
            .filter(
                models.MemberLodgeAssociation.member_id == member_id,
                models.MemberLodgeAssociation.lodge_id == assignment.lodge_id,
            )
            .first()
        )

        if existing:
            # Update existing association (change role)
            existing.role_id = assignment.role_id
            existing.start_date = assignment.start_date
            existing.end_date = assignment.end_date
        else:
            new_assoc = models.MemberLodgeAssociation(
                member_id=member_id,
                lodge_id=assignment.lodge_id,
                role_id=assignment.role_id,
                start_date=assignment.start_date,
                end_date=assignment.end_date,
            )
            db.add(new_assoc)

    elif assignment.obedience_id:
        existing = (
            db.query(models.MemberObedienceAssociation)
            .filter(
                models.MemberObedienceAssociation.member_id == member_id,
                models.MemberObedienceAssociation.obedience_id == assignment.obedience_id,
            )
            .first()
        )

        if existing:
            existing.role_id = assignment.role_id
            existing.start_date = assignment.start_date
            existing.end_date = assignment.end_date
        else:
            new_assoc = models.MemberObedienceAssociation(
                member_id=member_id,
                obedience_id=assignment.obedience_id,
                role_id=assignment.role_id,
                start_date=assignment.start_date,
                end_date=assignment.end_date,
            )
            db.add(new_assoc)

    db.commit()
    return {"message": "Role assigned successfully"}


@router.post("/{member_id}/permissions/exceptions", status_code=status.HTTP_201_CREATED)
def manage_permission_exception(
    member_id: int,
    exception_data: member_role_schema.MemberPermissionExceptionCreate,
    db: Session = Depends(database.get_db),
    context: dependencies.UserContext = Depends(dependencies.require_permission("admin:manage_permissions")),
):
    # Verify member
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Verify context security
    if context.user_type == "webmaster":
        if exception_data.lodge_id and context.lodge_id != exception_data.lodge_id:
            raise HTTPException(status_code=403, detail="Cannot manage exceptions for another Lodge")
        if exception_data.obedience_id and context.obedience_id != exception_data.obedience_id:
            raise HTTPException(status_code=403, detail="Cannot manage exceptions for another Obedience")

    # Check if exception already exists
    query = db.query(models.MemberPermissionException).filter(
        models.MemberPermissionException.member_id == member_id,
        models.MemberPermissionException.permission_id == exception_data.permission_id,
    )
    if exception_data.lodge_id:
        query = query.filter(models.MemberPermissionException.lodge_id == exception_data.lodge_id)
    elif exception_data.obedience_id:
        query = query.filter(models.MemberPermissionException.obedience_id == exception_data.obedience_id)

    existing = query.first()

    if existing:
        existing.exception_type = exception_data.exception_type
    else:
        new_exception = models.MemberPermissionException(
            member_id=member_id,
            permission_id=exception_data.permission_id,
            exception_type=exception_data.exception_type,
            lodge_id=exception_data.lodge_id,
            obedience_id=exception_data.obedience_id,
        )
        db.add(new_exception)

    db.commit()
    return {"message": "Permission exception updated successfully"}
