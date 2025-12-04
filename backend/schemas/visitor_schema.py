from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class VisitorCreate(BaseModel):
    full_name: str
    cim: str
    degree: str
    origin_lodge_id: Optional[int] = None
    manual_lodge_name: Optional[str] = None
    manual_lodge_number: Optional[str] = None
    manual_lodge_obedience: Optional[str] = None

class VisitorResponse(BaseModel):
    id: int
    full_name: str
    cim: str
    degree: str
    origin_lodge_id: Optional[int] = None
    manual_lodge_name: Optional[str] = None
    manual_lodge_number: Optional[str] = None
    manual_lodge_obedience: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
