from datetime import datetime

from pydantic import BaseModel


class DocumentBase(BaseModel):
    title: str
    file_path: str
    file_name: str
    file_type: str | None = None
    document_type: str | None = None # e.g. BALAUSTRE, EDITAL
    session_id: int | None = None # Link to a session
    uploaded_by_member_id: int | None = None # Member who uploaded the document

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: str | None = None
    document_type: str | None = None

class DocumentInDB(DocumentBase):
    id: int
    lodge_id: int
    upload_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
