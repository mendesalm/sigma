from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class ClassifiedPhotoBase(BaseModel):
    image_path: str

class ClassifiedPhotoOut(ClassifiedPhotoBase):
    id: int
    
    class Config:
        from_attributes = True

class ClassifiedBase(BaseModel):
    title: str
    description: str
    price: Optional[float] = None
    contact_info: Optional[str] = None
    contact_email: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

class ClassifiedCreate(ClassifiedBase):
    pass

class ClassifiedUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    contact_info: Optional[str] = None
    contact_email: Optional[str] = None
    street: Optional[str] = None
    number: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    status: Optional[str] = None

class ClassifiedOut(ClassifiedBase):
    id: int
    status: str
    expires_at: datetime
    created_at: datetime
    lodge_id: int
    member_id: int
    photos: List[ClassifiedPhotoOut] = []
    
    # Optional: include lodge name for display
    lodge_name: Optional[str] = None

    class Config:
        from_attributes = True
