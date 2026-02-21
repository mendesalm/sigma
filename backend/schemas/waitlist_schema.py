from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from models.models import WaitlistStatusEnum
from schemas.book_schema import BookResponse
from schemas.member_schema import MemberListResponse

class WaitlistBase(BaseModel):
    book_id: int
    lodge_id: int
    member_id: int

class WaitlistCreate(BaseModel):
    book_id: int

class WaitlistUpdate(BaseModel):
    status: Optional[WaitlistStatusEnum] = None
    notification_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None

class WaitlistResponse(WaitlistBase):
    id: int
    request_date: datetime
    status: WaitlistStatusEnum
    notification_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    book: Optional[BookResponse] = None
    member: Optional[MemberListResponse] = None

    model_config = ConfigDict(from_attributes=True)
