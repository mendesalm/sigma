from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class BookBase(BaseModel):
    isbn: Optional[str] = Field(None, max_length=50)
    title: str = Field(..., max_length=255)
    author: str = Field(..., max_length=255)
    publisher: Optional[str] = Field(None, max_length=255)
    publish_year: Optional[int] = None
    pages: Optional[int] = None
    cover_url: Optional[str] = Field(None, max_length=512)
    synopsis: Optional[str] = None
    required_degree: int = Field(1, ge=1, le=3)

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    isbn: Optional[str] = Field(None, max_length=50)
    title: Optional[str] = Field(None, max_length=255)
    author: Optional[str] = Field(None, max_length=255)
    publisher: Optional[str] = Field(None, max_length=255)
    publish_year: Optional[int] = None
    pages: Optional[int] = None
    cover_url: Optional[str] = Field(None, max_length=512)
    synopsis: Optional[str] = None
    required_degree: Optional[int] = Field(None, ge=1, le=3)

class BookResponse(BookBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
