from datetime import datetime

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
    price: float | None = None
    contact_info: str | None = None
    contact_email: str | None = None
    street: str | None = None
    number: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    category: str | None = None


class ClassifiedCreate(ClassifiedBase):
    pass


class ClassifiedUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = None
    contact_info: str | None = None
    contact_email: str | None = None
    street: str | None = None
    number: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    zip_code: str | None = None
    category: str | None = None
    status: str | None = None


class ClassifiedOut(ClassifiedBase):
    id: int
    status: str
    expires_at: datetime
    created_at: datetime
    lodge_id: int
    member_id: int
    photos: list[ClassifiedPhotoOut] = []

    # Optional: include lodge name for display
    lodge_name: str | None = None

    class Config:
        from_attributes = True
