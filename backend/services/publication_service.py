import shutil
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from models.models import Publication, PublicationStatusEnum, Member, RoleTypeEnum, Webmaster
from schemas.publication_schemas import PublicationCreate, PublicationUpdate

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
STORAGE_ROOT = PROJECT_ROOT / "storage"

class PublicationService:
    @staticmethod
    def _get_storage_path(lodge_number: str) -> Path:
        return STORAGE_ROOT / "lodges" / f"loja_{lodge_number}" / "publications"

    @staticmethod
    def create_publication(
        db: Session,
        publication_data: PublicationCreate,
        file: UploadFile,
        author_id: int,
        lodge_id: int
    ) -> Publication:
        # Validate File
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
        
        # Check size (approximate using seek if needed, but SpooledFile content-length might be unreliable, 
        # usually FastAPI handles limits, but here manual check if read)
        # We will check after saving or assume Nginx/FastAPI limits. 
        # For strict 5MB check we can read chunk.
        
        # Get Lodge Number for storage path
        from models.models import Lodge
        lodge = db.query(Lodge).filter(Lodge.id == lodge_id).first()
        if not lodge:
            raise HTTPException(status_code=404, detail="Lodge not found.")
            
        storage_path = PublicationService._get_storage_path(lodge.lodge_number)
        os.makedirs(storage_path, exist_ok=True)
        
        # Safe filename
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        safe_filename = f"{timestamp}_{file.filename.replace(' ', '_')}"
        file_dest = storage_path / safe_filename
        
        try:
            with open(file_dest, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            file_size = os.path.getsize(file_dest)
            if file_size > 5 * 1024 * 1024: # 5MB
                os.remove(file_dest)
                raise HTTPException(status_code=400, detail="File too large. Max 5MB.")
                
            # Relative path for DB
            db_path = f"/storage/lodges/loja_{lodge.lodge_number}/publications/{safe_filename}"
            
            new_pub = Publication(
                **publication_data.model_dump(),
                file_path=db_path,
                file_size=file_size,
                author_id=author_id,
                lodge_id=lodge_id,
                status=PublicationStatusEnum.PUBLISHED # Only secretaries create, so auto-published
            )
            
            db.add(new_pub)
            db.commit()
            db.refresh(new_pub)
            return new_pub
            
        except Exception as e:
            # Cleanup if failed
            if os.path.exists(file_dest):
                os.remove(file_dest)
            raise e

    @staticmethod
    def get_publications(db: Session, lodge_id: int, skip: int = 0, limit: int = 100) -> List[Publication]:
        return db.query(Publication)\
            .filter(Publication.lodge_id == lodge_id)\
            .order_by(desc(Publication.published_at))\
            .offset(skip).limit(limit).all()

    @staticmethod
    def delete_publication(db: Session, pub_id: int, lodge_id: int):
        pub = db.query(Publication).filter(Publication.id == pub_id, Publication.lodge_id == lodge_id).first()
        if not pub:
            raise HTTPException(status_code=404, detail="Publication not found.")
            
        # Delete file
        if pub.file_path:
            # Convert DB path back to absolute system path
            # DB: /storage/lodges/...
            # System: C:\...\sigma\storage\lodges\...
            rel_path = pub.file_path.lstrip("/").lstrip("\\")
            abs_path = PROJECT_ROOT / rel_path
            
            print(f"Deleting file at: {abs_path}") # Debug
            
            if os.path.exists(abs_path):
                os.remove(abs_path)
        
        db.delete(pub)
        db.commit()
