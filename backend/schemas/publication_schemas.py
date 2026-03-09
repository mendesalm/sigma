from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from models.models import PublicationStatusEnum, PublicationTypeEnum


class PublicationBase(BaseModel):
    title: str
    content: str | None = None
    type: PublicationTypeEnum
    valid_until: date | None = None


class PublicationCreate(PublicationBase):
    pass  # file is handled separately in upload


class PublicationUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    type: PublicationTypeEnum | None = None
    valid_until: date | None = None
    status: PublicationStatusEnum | None = None


class PublicationResponse(PublicationBase):
    id: int
    file_path: str
    file_size: int | None = None
    status: PublicationStatusEnum
    author_id: int
    lodge_id: int
    published_at: datetime | None = None

    # We might want to include author name specially
    author_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
