from datetime import datetime

from pydantic import BaseModel, Field


class DocumentBase(BaseModel):
    title: str
    file_path: str
    file_name: str
    file_type: str | None = None
    document_type: str | None = None  # e.g. BALAUSTRE, EDITAL
    session_id: int | None = None  # Link to a session
    uploaded_by_member_id: int | None = None  # Member who uploaded the document


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


# --- Document Instances (Gerados via Engine) ---


class DocumentInstanceBase(BaseModel):
    document_type: str
    status: str = Field(default="DRAFT", description="DRAFT, PENDING_SIGNATURES, FINALIZED")
    draft_html_content: str | None = None
    final_html_content: str | None = None
    element_text_overrides: dict[str, str] | None = None


class DocumentInstanceCreate(DocumentInstanceBase):
    lodge_id: int
    session_id: int | None = None
    created_by_id: int | None = None


class DocumentInstanceUpdate(BaseModel):
    status: str | None = None
    draft_html_content: str | None = None
    final_html_content: str | None = None


class DocumentInstanceResponse(DocumentInstanceBase):
    id: int
    lodge_id: int
    session_id: int | None
    created_by_id: int | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


# --- Document Signatures ---


class DocumentSignatureBase(BaseModel):
    role: str = Field(..., description="Cargo de quem está assinando")


class DocumentSignatureCreate(DocumentSignatureBase):
    document_instance_id: int
    member_id: int
    digital_hash: str


class DocumentSignatureResponse(DocumentSignatureBase):
    id: int
    document_instance_id: int
    member_id: int
    signed_at: datetime
    digital_hash: str

    class Config:
        from_attributes = True
