from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class DocumentBase(BaseModel):
    title: str
    file_path: str
    file_name: str
    file_type: Optional[str] = None
    document_type: Optional[str] = None # e.g. BALAUSTRE, EDITAL
    session_id: Optional[int] = None # Link to a session
    uploaded_by_member_id: Optional[int] = None # Member who uploaded the document

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    document_type: Optional[str] = None

class DocumentInDB(DocumentBase):
    id: int
    lodge_id: int
    upload_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
