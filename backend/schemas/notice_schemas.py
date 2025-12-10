from typing import Optional
from datetime import date
from pydantic import BaseModel
from models.models import NoticeTypeEnum

class NoticeBase(BaseModel):
    title: str
    content: str
    type: NoticeTypeEnum = NoticeTypeEnum.AVISO
    expiration_date: Optional[date] = None
    publication_id: Optional[int] = None
    is_active: bool = True

class NoticeCreate(NoticeBase):
    lodge_id: int

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[NoticeTypeEnum] = None
    expiration_date: Optional[date] = None
    publication_id: Optional[int] = None
    is_active: Optional[bool] = None

class NoticeResponse(NoticeBase):
    id: int
    lodge_id: int
    
    class Config:
        from_attributes = True
