from typing import List
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user_payload
from schemas import classified_schema
from services import classified_service

router = APIRouter(prefix="/classifieds", tags=["Classificados"])

@router.post("/", response_model=classified_schema.ClassifiedOut, status_code=status.HTTP_201_CREATED)
def create_classified(
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(None),
    contact_info: str = Form(None),
    contact_email: str = Form(None),
    street: str = Form(None),
    number: str = Form(None),
    neighborhood: str = Form(None),
    city: str = Form(None),
    state: str = Form(None),
    zip_code: str = Form(None),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    classified_data = classified_schema.ClassifiedCreate(
        title=title,
        description=description,
        price=price,
        contact_info=contact_info,
        contact_email=contact_email,
        street=street,
        number=number,
        neighborhood=neighborhood,
        city=city,
        state=state,
        zip_code=zip_code
    )
    return classified_service.create_classified(db, classified_data, files, current_user_payload)

@router.get("/", response_model=List[classified_schema.ClassifiedOut])
def list_classifieds(
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return classified_service.get_all_active_classifieds(db)

@router.get("/my", response_model=List[classified_schema.ClassifiedOut])
def list_my_classifieds(
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    member_id = current_user_payload.get("sub")
    return classified_service.get_member_classifieds(db, member_id)

@router.post("/{classified_id}/reactivate", response_model=classified_schema.ClassifiedOut)
def reactivate_classified(
    classified_id: int,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return classified_service.reactivate_classified(db, classified_id, current_user_payload)

@router.put("/{classified_id}", response_model=classified_schema.ClassifiedOut)
def update_classified(
    classified_id: int,
    classified_update: classified_schema.ClassifiedUpdate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    return classified_service.update_classified(db, classified_id, classified_update, current_user_payload)

@router.delete("/{classified_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_classified(
    classified_id: int,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload)
):
    classified_service.delete_classified(db, classified_id, current_user_payload)
    return None
