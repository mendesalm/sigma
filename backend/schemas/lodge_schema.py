from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import date, time
from .obedience_schema import ObedienceResponse # Updated import

class LodgeBase(BaseModel):
    lodge_name: str = Field(..., description="Name of the Lodge.")
    lodge_code: str = Field(..., description="Unique code of the Lodge.")
    obedience_id: int = Field(..., description="ID of the Obedience to which the lodge belongs.")
    lodge_number: Optional[str] = None
    foundation_date: Optional[date] = None
    rite: Optional[str] = None
    obedience_name: Optional[str] = None
    tax_id: Optional[str] = Field(None, max_length=18)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    street_address: Optional[str] = Field(None, max_length=255)
    street_number: Optional[str] = Field(None, max_length=20)
    address_complement: Optional[str] = Field(None, max_length=100)
    neighborhood: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=2)
    zip_code: Optional[str] = Field(None, max_length=9)
    technical_contact_name: str = Field(..., description="Name of the technical contact for the Lodge.")
    technical_contact_email: EmailStr = Field(..., description="Email of the technical contact for the Lodge.")
    custom_domain: Optional[str] = None
    plan: Optional[str] = None
    user_limit: Optional[int] = None
    is_active: bool = True
    status: Optional[str] = None
    session_day: Optional[str] = None
    periodicity: Optional[str] = None
    session_time: Optional[time] = None

class LodgeCreate(LodgeBase):
    pass

class LodgeUpdate(BaseModel):
    lodge_name: Optional[str] = None
    obedience_id: Optional[int] = None
    foundation_date: Optional[date] = None
    rite: Optional[str] = None
    tax_id: Optional[str] = Field(None, max_length=18)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    street_address: Optional[str] = None
    street_number: Optional[str] = None
    address_complement: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    technical_contact_name: Optional[str] = None
    technical_contact_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    lodge_number: Optional[str] = None
    obedience_name: Optional[str] = None
    custom_domain: Optional[str] = None
    plan: Optional[str] = None
    user_limit: Optional[int] = None
    status: Optional[str] = None
    session_day: Optional[str] = None
    periodicity: Optional[str] = None
    session_time: Optional[time] = None

class LodgeResponse(LodgeBase):
    id: int
    obedience: Optional[ObedienceResponse] = None
    class Config:
        from_attributes = True
