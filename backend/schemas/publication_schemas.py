from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional
from enum import Enum
from models.models import PublicationTypeEnum, PublicationStatusEnum

class PublicationBase(BaseModel):
    title: str
    content: Optional[str] = None
    type: PublicationTypeEnum
    valid_until: Optional[date] = None

class PublicationCreate(PublicationBase):
    pass # file is handled separately in upload

class PublicationUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[PublicationTypeEnum] = None
    valid_until: Optional[date] = None
    status: Optional[PublicationStatusEnum] = None

class PublicationResponse(PublicationBase):
    id: int
    file_path: str
    file_size: Optional[int] = None
    status: PublicationStatusEnum
    author_id: int
    lodge_id: int
    published_at: Optional[datetime] = None
    
    # We might want to include author name specially
    author_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
