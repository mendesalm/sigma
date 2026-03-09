from datetime import datetime

from pydantic import BaseModel


class VisitorCreate(BaseModel):
    full_name: str
    cim: str
    degree: str
    origin_lodge_id: int | None = None
    manual_lodge_name: str | None = None
    manual_lodge_number: str | None = None
    manual_lodge_obedience: str | None = None


class VisitorResponse(BaseModel):
    id: int
    full_name: str
    cim: str
    degree: str
    origin_lodge_id: int | None = None
    manual_lodge_name: str | None = None
    manual_lodge_number: str | None = None
    manual_lodge_obedience: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
