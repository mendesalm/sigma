
from pydantic import BaseModel, EmailStr, Field

from ..models.models import ObedienceTypeEnum


class ObedienceBase(BaseModel):
    name: str = Field(..., max_length=255)
    acronym: str | None = Field(None, max_length=50)
    type: ObedienceTypeEnum
    parent_obedience_id: int | None = None
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
    technical_contact_name: str = Field(..., max_length=255)
    technical_contact_email: EmailStr

class ObedienceCreate(ObedienceBase):
    pass

class ObedienceUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    acronym: str | None = Field(None, max_length=50)
    type: ObedienceTypeEnum | None = None
    parent_obedience_id: int | None = None
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
    technical_contact_name: str | None = Field(None, max_length=255)
    technical_contact_email: EmailStr | None = None

class ObedienceResponse(ObedienceBase):
    id: int

    class Config:
        from_attributes = True
