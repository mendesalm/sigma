from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from dependencies import get_current_user_payload
from schemas import committee_schema
from services import committee_service

router = APIRouter(
    prefix="/committees",
    tags=["committees"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[committee_schema.CommitteeResponse])
def read_committees(
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        raise HTTPException(status_code=403, detail="Usuário não associado a uma loja.")
    return committee_service.get_committees(db, lodge_id)

@router.post("/", response_model=committee_schema.CommitteeResponse)
def create_committee(
    committee: committee_schema.CommitteeCreate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        raise HTTPException(status_code=403, detail="Usuário não associado a uma loja.")
    return committee_service.create_committee(db, committee, lodge_id)

@router.put("/{committee_id}", response_model=committee_schema.CommitteeResponse)
def update_committee(
    committee_id: int,
    committee: committee_schema.CommitteeUpdate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    lodge_id = current_user_payload.get("lodge_id")
    return committee_service.update_committee(db, committee_id, committee, lodge_id)

@router.delete("/{committee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_committee(
    committee_id: int,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    lodge_id = current_user_payload.get("lodge_id")
    committee_service.delete_committee(db, committee_id, lodge_id)
