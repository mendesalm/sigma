import os
import shutil
from datetime import datetime, timedelta
from typing import List
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from models import models
from schemas import classified_schema

UPLOAD_DIR = "uploads/classifieds"
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB
MAX_FILES = 5

def create_classified(
    db: Session,
    classified_data: classified_schema.ClassifiedCreate,
    files: List[UploadFile],
    current_user_payload: dict
):
    # Validate files
    if files:
        if len(files) > MAX_FILES:
            raise HTTPException(status_code=400, detail=f"Maximum of {MAX_FILES} photos allowed.")
        for file in files:
            file.file.seek(0, 2)
            size = file.file.tell()
            file.file.seek(0)
            if size > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 2MB limit.")

    member_id = current_user_payload.get("sub")
    lodge_id = current_user_payload.get("lodge_id")
    
    if not lodge_id:
        assoc = db.query(models.MemberLodgeAssociation).filter(
            models.MemberLodgeAssociation.member_id == member_id,
            models.MemberLodgeAssociation.status == 'ACTIVE'
        ).first()
        if assoc:
            lodge_id = assoc.lodge_id
        else:
             raise HTTPException(status_code=400, detail="Member not associated with any active lodge")

    expires_at = datetime.now() + timedelta(days=21)
    
    new_classified = models.Classified(
        title=classified_data.title,
        description=classified_data.description,
        price=classified_data.price,
        contact_info=classified_data.contact_info,
        contact_email=classified_data.contact_email,
        street=classified_data.street,
        number=classified_data.number,
        neighborhood=classified_data.neighborhood,
        city=classified_data.city,
        state=classified_data.state,
        zip_code=classified_data.zip_code,
        status="ACTIVE",
        expires_at=expires_at,
        lodge_id=lodge_id,
        member_id=member_id
    )
    db.add(new_classified)
    db.commit()
    db.refresh(new_classified)
    
    # Handle files
    if files:
        classified_dir = os.path.join(UPLOAD_DIR, str(new_classified.id))
        os.makedirs(classified_dir, exist_ok=True)
        
        for file in files:
            file_path = os.path.join(classified_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            relative_path = f"classifieds/{new_classified.id}/{file.filename}"
            photo = models.ClassifiedPhoto(
                classified_id=new_classified.id,
                image_path=relative_path
            )
            db.add(photo)
        db.commit()
        db.refresh(new_classified)
        
    return new_classified

def get_all_active_classifieds(db: Session):
    classifieds = db.query(models.Classified).filter(models.Classified.status == "ACTIVE").all()
    for c in classifieds:
        if c.lodge:
            c.lodge_name = c.lodge.lodge_name
    return classifieds

def get_member_classifieds(db: Session, member_id: int):
    classifieds = db.query(models.Classified).filter(models.Classified.member_id == member_id).all()
    for c in classifieds:
        if c.lodge:
            c.lodge_name = c.lodge.lodge_name
    return classifieds

def get_classified_by_id(db: Session, classified_id: int):
    classified = db.query(models.Classified).filter(models.Classified.id == classified_id).first()
    if classified and classified.lodge:
        classified.lodge_name = classified.lodge.lodge_name
    return classified

def delete_classified(db: Session, classified_id: int, member_id: int):
    classified = db.query(models.Classified).filter(models.Classified.id == classified_id).first()
    if not classified:
        raise HTTPException(status_code=404, detail="Classified not found")
        
    if classified.member_id != member_id:
         raise HTTPException(status_code=403, detail="Not authorized to delete this classified")
         
    classified_dir = os.path.join(UPLOAD_DIR, str(classified.id))
    if os.path.exists(classified_dir):
        shutil.rmtree(classified_dir)
        
    db.delete(classified)
    db.commit()

def reactivate_classified(db: Session, classified_id: int, member_id: int):
    classified = db.query(models.Classified).filter(models.Classified.id == classified_id).first()
    if not classified:
        raise HTTPException(status_code=404, detail="Classified not found")
        
    if classified.member_id != member_id:
         raise HTTPException(status_code=403, detail="Not authorized to reactivate this classified")
    
    # Check if within grace period (14 days after expiration)
    # If status is EXPIRED, we check the date. If ACTIVE, we just extend? 
    # Requirement says: "can be reactivated within the grace period of 14 days"
    # This implies it must be EXPIRED first.
    
    if classified.status != "EXPIRED":
        raise HTTPException(status_code=400, detail="Only expired classifieds can be reactivated")

    now = datetime.now()
    grace_period_end = classified.expires_at + timedelta(days=14)
    
    if now > grace_period_end:
        raise HTTPException(status_code=400, detail="Grace period for reactivation has passed")
        
    classified.status = "ACTIVE"
    classified.expires_at = now + timedelta(days=21)
    db.commit()
    db.refresh(classified)
    return classified

def cleanup_classifieds(db: Session):
    now = datetime.now()
    
    # 1. Deactivate expired ads
    expired_ads = db.query(models.Classified).filter(
        models.Classified.status == "ACTIVE",
        models.Classified.expires_at < now
    ).all()
    
    if expired_ads:
        print(f"[{now}] Deactivating {len(expired_ads)} expired classifieds...")
        for ad in expired_ads:
            ad.status = "EXPIRED"
        db.commit()
    
    # 2. Delete ads expired for more than 14 days
    # We need to check based on expires_at. If expires_at was 15 days ago, it's gone.
    cutoff_date = now - timedelta(days=14)
    
    ads_to_delete = db.query(models.Classified).filter(
        models.Classified.status == "EXPIRED",
        models.Classified.expires_at < cutoff_date
    ).all()
    
    if ads_to_delete:
        print(f"[{now}] Deleting {len(ads_to_delete)} old classifieds...")
        for ad in ads_to_delete:
            classified_dir = os.path.join(UPLOAD_DIR, str(ad.id))
            if os.path.exists(classified_dir):
                shutil.rmtree(classified_dir)
            db.delete(ad)
        db.commit()
