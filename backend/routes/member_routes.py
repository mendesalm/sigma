from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from .. import models
from ..schemas import member_schema
from ..services import member_service
from ..middleware.dependencies import get_db

router = APIRouter()

@router.post("/members/", response_model=member_schema.MemberResponse)
def create_member(member: member_schema.MemberCreateWithAssociation, db: Session = Depends(get_db)):
    db_member = member_service.get_member_by_email(db, email=member.email)
    if db_member:
        raise HTTPException(status_code=400, detail="Email already registered")
    return member_service.create_member_with_association(db=db, member=member)


@router.get("/members/", response_model=List[member_schema.MemberResponse])
def read_members(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    members = member_service.get_members(db, skip=skip, limit=limit)
    return members


@router.get("/members/{member_id}", response_model=member_schema.MemberResponse)
def read_member(member_id: int, db: Session = Depends(get_db)):
    db_member = member_service.get_member(db, member_id=member_id)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_member


@router.put("/members/{member_id}", response_model=member_schema.MemberResponse)
def update_member(member_id: int, member: member_schema.MemberUpdate, db: Session = Depends(get_db)):
    db_member = member_service.update_member(db, member_id=member_id, member=member)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_member


@router.delete("/members/{member_id}", response_model=member_schema.MemberResponse)
def delete_member(member_id: int, db: Session = Depends(get_db)):
    db_member = member_service.delete_member(db, member_id=member_id)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_member
