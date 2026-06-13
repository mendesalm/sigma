from datetime import datetime
from pydantic import BaseModel, Field

class MessageAttachmentBase(BaseModel):
    file_name: str
    file_url: str

class MessageAttachmentResponse(MessageAttachmentBase):
    id: int

    model_config = {
        "from_attributes": True
    }

class EntityMessageBase(BaseModel):
    subject: str = Field(..., max_length=255)
    body: str

class EntityMessageCreate(EntityMessageBase):
    recipient_obedience_id: int | None = None
    recipient_lodge_id: int | None = None
    
    # We don't accept attachments in the base JSON payload usually, 
    # but let's allow URLs if they upload beforehand
    attachment_urls: list[str] | None = None

class EntityMessageResponse(EntityMessageBase):
    id: int
    sender_obedience_id: int | None
    sender_lodge_id: int | None
    recipient_obedience_id: int | None
    recipient_lodge_id: int | None
    status: str
    created_at: datetime
    attachments: list[MessageAttachmentResponse] = []

    model_config = {
        "from_attributes": True
    }
