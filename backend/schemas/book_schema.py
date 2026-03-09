from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BookBase(BaseModel):
    isbn: str | None = Field(None, max_length=50)
    title: str = Field(..., max_length=255)
    author: str = Field(..., max_length=255)
    publisher: str | None = Field(None, max_length=255)
    publish_year: int | None = None
    pages: int | None = None
    cover_url: str | None = Field(None, max_length=512)
    synopsis: str | None = None
    required_degree: int = Field(1, ge=1, le=3)


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    isbn: str | None = Field(None, max_length=50)
    title: str | None = Field(None, max_length=255)
    author: str | None = Field(None, max_length=255)
    publisher: str | None = Field(None, max_length=255)
    publish_year: int | None = None
    pages: int | None = None
    cover_url: str | None = Field(None, max_length=512)
    synopsis: str | None = None
    required_degree: int | None = Field(None, ge=1, le=3)


class BookResponse(BookBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
