import enum
from datetime import date

from pydantic import BaseModel, EmailStr, Field


class RelationshipTypeEnum(str, enum.Enum):
    SPOUSE = "Spouse"
    SON = "Son"
    DAUGHTER = "Daughter"


# Base schema with common fields
class FamilyMemberBase(BaseModel):
    full_name: str = Field(..., max_length=255, description="Full name of the family member.")
    relationship_type: RelationshipTypeEnum = Field(..., description="Relationship type.")
    birth_date: date | None = Field(None, description="Date of birth of the family member.")
    email: EmailStr | None = None
    phone: str | None = Field(None, max_length=20)
    is_deceased: bool = Field(False, description="Indicates if the family member is deceased.")


# Schema for creating a new family member (requires member ID)
class FamilyMemberCreate(FamilyMemberBase):
    pass


# Schema for update (all fields are optional)
class FamilyMemberUpdate(FamilyMemberBase):
    full_name: str | None = None
    relationship_type: RelationshipTypeEnum | None = None
    email: EmailStr | None = None
    phone: str | None = None
    is_deceased: bool | None = None


# Schema for API response (includes database-generated fields)
class FamilyMemberResponse(FamilyMemberBase):
    id: int

    class Config:
        from_attributes = True
