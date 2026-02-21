from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from models.models import BookConditionEnum, ItemStatusEnum
from schemas.book_schema import BookResponse

class LibraryItemBase(BaseModel):
    inventory_code: Optional[str] = Field(None, max_length=100)
    condition: BookConditionEnum = BookConditionEnum.GOOD
    status: ItemStatusEnum = ItemStatusEnum.AVAILABLE
    book_id: int
    lodge_id: int

class LibraryItemCreate(BaseModel):
    inventory_code: Optional[str] = Field(None, max_length=100)
    condition: BookConditionEnum = BookConditionEnum.GOOD
    book_id: int

class LibraryItemUpdate(BaseModel):
    inventory_code: Optional[str] = Field(None, max_length=100)
    condition: Optional[BookConditionEnum] = None
    status: Optional[ItemStatusEnum] = None

class LibraryItemResponse(LibraryItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    book: Optional[BookResponse] = None

    model_config = ConfigDict(from_attributes=True)
