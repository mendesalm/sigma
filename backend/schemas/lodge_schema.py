from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import date, time

# Assuming RiteEnum is defined in a shared location if it's not already.
# For now, we define it here if it's specific to lodges.
# from ..models.models import RiteEnum # This would be ideal

class LodgeBase(BaseModel):
    lodge_name: str = Field(..., max_length=255)
    lodge_number: Optional[str] = Field(None, max_length=255)
    foundation_date: Optional[date] = None
    rite: Optional[str] = Field(None, max_length=50) # Or RiteEnum if defined
    obedience_id: int
    cnpj: Optional[str] = Field(None, max_length=18)
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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    technical_contact_name: str = Field(..., max_length=255)
    technical_contact_email: EmailStr
    session_day: Optional[str] = None # Consider Enum: 'Sunday', 'Monday', ...
    periodicity: Optional[str] = None # Consider Enum: 'Weekly', 'Biweekly', 'Monthly'
    session_time: Optional[time] = None

class LodgeCreate(LodgeBase):
    # The lodge_code should be generated automatically or follow a specific rule
    # For now, we might not require it from the user on creation, or we might.
    # Let's assume it's not required on creation and generated in the service.
    pass

class LodgeUpdate(BaseModel):
    lodge_name: Optional[str] = Field(None, max_length=255)
    lodge_number: Optional[str] = Field(None, max_length=255)
    foundation_date: Optional[date] = None
    rite: Optional[str] = Field(None, max_length=50)
    obedience_id: Optional[int] = None
    cnpj: Optional[str] = Field(None, max_length=18)
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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    technical_contact_name: Optional[str] = Field(None, max_length=255)
    technical_contact_email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    session_day: Optional[str] = None
    periodicity: Optional[str] = None
    session_time: Optional[time] = None

class LodgeResponse(LodgeBase):
    id: int
    lodge_code: str
    is_active: bool

    class Config:
        from_attributes = True