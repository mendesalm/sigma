from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from ..models.models import ObedienceTypeEnum

class ObedienceBase(BaseModel):
    name: str = Field(..., max_length=255)
    acronym: Optional[str] = Field(None, max_length=50)
    type: ObedienceTypeEnum
    parent_obedience_id: Optional[int] = None
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
    technical_contact_name: str = Field(..., max_length=255)
    technical_contact_email: EmailStr

class ObedienceCreate(ObedienceBase):
    pass

class ObedienceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    acronym: Optional[str] = Field(None, max_length=50)
    type: Optional[ObedienceTypeEnum] = None
    parent_obedience_id: Optional[int] = None
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
    technical_contact_name: Optional[str] = Field(None, max_length=255)
    technical_contact_email: Optional[EmailStr] = None

class ObedienceResponse(ObedienceBase):
    id: int

    class Config:
        from_attributes = True