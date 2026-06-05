from datetime import date

from pydantic import BaseModel

from models.models import NoticeTypeEnum


class NoticeBase(BaseModel):
    title: str
    content: str
    type: NoticeTypeEnum = NoticeTypeEnum.AVISO
    expiration_date: date | None = None
    publication_id: int | None = None
    is_active: bool = True


class NoticeCreate(NoticeBase):
    lodge_id: int


class NoticeUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    type: NoticeTypeEnum | None = None
    expiration_date: date | None = None
    publication_id: int | None = None
    is_active: bool | None = None


class NoticeResponse(NoticeBase):
    id: int
    lodge_id: int

    class Config:
        from_attributes = True
