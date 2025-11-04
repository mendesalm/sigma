from pydantic import BaseModel, Field
from typing import Optional
from models.models import ObedienceTypeEnum

# Shared basic properties
class ObedienceBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, description="Name of the Obedience")
    acronym: Optional[str] = Field(None, max_length=50, description="Acronym of the Obedience, e.g., GOB, GLEG")
    type: ObedienceTypeEnum
    parent_obedience_id: Optional[int] = None
    tax_id: Optional[str] = Field(None, max_length=18)
    email: Optional[str] = Field(None, max_length=255)
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
    technical_contact_email: Optional[str] = Field(None, max_length=255)

# Schema for creating an Obedience
class ObedienceCreate(ObedienceBase):
    pass

# Schema for updating an Obedience
class ObedienceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    acronym: Optional[str] = Field(None, max_length=50)
    type: Optional[ObedienceTypeEnum] = None
    parent_obedience_id: Optional[int] = None
    tax_id: Optional[str] = Field(None, max_length=18)
    email: Optional[str] = Field(None, max_length=255)
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
    technical_contact_email: Optional[str] = Field(None, max_length=255)

# Schema for API response (view)
class ObedienceResponse(ObedienceBase):
    id: int

    class Config:
        from_attributes = True
