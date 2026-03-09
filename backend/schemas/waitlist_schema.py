from datetime import datetime

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
    status: WaitlistStatusEnum | None = None
    notification_date: datetime | None = None
    expiration_date: datetime | None = None


class WaitlistResponse(WaitlistBase):
    id: int
    request_date: datetime
    status: WaitlistStatusEnum
    notification_date: datetime | None = None
    expiration_date: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None
    book: BookResponse | None = None
    member: MemberListResponse | None = None

    model_config = ConfigDict(from_attributes=True)
