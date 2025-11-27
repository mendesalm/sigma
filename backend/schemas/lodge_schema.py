from datetime import date, time

from pydantic import BaseModel, EmailStr, Field

# Assuming RiteEnum is defined in a shared location if it's not already.
# For now, we define it here if it's specific to lodges.
# from ..models.models import RiteEnum # This would be ideal


class LodgeBase(BaseModel):
    lodge_name: str = Field(..., max_length=255)
    lodge_number: str | None = Field(None, max_length=255)
    foundation_date: date | None = None
    rite: str | None = Field(None, max_length=50)  # Or RiteEnum if defined
    obedience_id: int
    cnpj: str | None = Field(None, max_length=18)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    website: str | None = Field(None, max_length=255)
    street_address: str | None = Field(None, max_length=255)
    street_number: str | None = Field(None, max_length=20)
    address_complement: str | None = Field(None, max_length=100)
    neighborhood: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=2)
    zip_code: str | None = Field(None, max_length=9)
    latitude: float | None = None
    longitude: float | None = None
    technical_contact_name: str = Field(..., max_length=255)
    technical_contact_email: EmailStr
    session_day: str | None = None  # Consider Enum: 'Sunday', 'Monday', ...
    periodicity: str | None = None  # Consider Enum: 'Weekly', 'Biweekly', 'Monthly'
    session_time: time | None = None


class LodgeCreate(LodgeBase):
    # The lodge_code should be generated automatically or follow a specific rule
    # For now, we might not require it from the user on creation, or we might.
    # Let's assume it's not required on creation and generated in the service.
    pass


class LodgeUpdate(BaseModel):
    lodge_name: str | None = Field(None, max_length=255)
    lodge_number: str | None = Field(None, max_length=255)
    foundation_date: date | None = None
    rite: str | None = Field(None, max_length=50)
    obedience_id: int | None = None
    cnpj: str | None = Field(None, max_length=18)
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    website: str | None = Field(None, max_length=255)
    street_address: str | None = Field(None, max_length=255)
    street_number: str | None = Field(None, max_length=20)
    address_complement: str | None = Field(None, max_length=100)
    neighborhood: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=2)
    zip_code: str | None = Field(None, max_length=9)
    latitude: float | None = None
    longitude: float | None = None
    technical_contact_name: str | None = Field(None, max_length=255)
    technical_contact_email: EmailStr | None = None
    is_active: bool | None = None
    session_day: str | None = None
    periodicity: str | None = None
    session_time: time | None = None


class LodgeResponse(LodgeBase):
    id: int
    lodge_code: str
    is_active: bool

    class Config:
        from_attributes = True
