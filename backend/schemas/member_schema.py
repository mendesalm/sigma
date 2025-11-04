import enum
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime

from .family_member_schema import FamilyMemberResponse
from .decoration_schema import DecorationResponse
from .role_history_schema import RoleHistoryResponse

# --- Enums ---
class DegreeEnum(str, enum.Enum):
    APPRENTICE = "Apprentice"
    FELLOW = "Fellow"
    MASTER = "Master"
    INSTALLED_MASTER = "Installed Master"

class RegistrationStatusEnum(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

# --- Schemas ---

class MemberBase(BaseModel):
    # Personal Data
    full_name: str = Field(..., max_length=255)
    email: EmailStr = Field(..., description="Member's email, used for login.")
    cpf: Optional[str] = Field(None, max_length=14)
    identity_document: Optional[str] = Field(None, max_length=50)
    birth_date: Optional[date] = None
    marriage_date: Optional[date] = None
    street_address: Optional[str] = Field(None, max_length=255)
    street_number: Optional[str] = Field(None, max_length=50)
    neighborhood: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=9)
    phone: Optional[str] = Field(None, max_length=20)
    place_of_birth: Optional[str] = Field(None, max_length=100)
    nationality: Optional[str] = Field(None, max_length=100)
    religion: Optional[str] = Field(None, max_length=100)
    fathers_name: Optional[str] = Field(None, max_length=255)
    mothers_name: Optional[str] = Field(None, max_length=255)
    education_level: Optional[str] = Field(None, max_length=255)
    occupation: Optional[str] = Field(None, max_length=255)
    workplace: Optional[str] = Field(None, max_length=255)
    profile_picture_path: Optional[str] = Field(None, max_length=255)

    # Masonic Data
    cim: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field('Active', max_length=50)
    degree: Optional[DegreeEnum] = None
    initiation_date: Optional[date] = None
    elevation_date: Optional[date] = None
    exaltation_date: Optional[date] = None
    affiliation_date: Optional[date] = None
    regularization_date: Optional[date] = None
    philosophical_degree: Optional[str] = Field(None, max_length=100)

    # System Data
    registration_status: RegistrationStatusEnum = RegistrationStatusEnum.PENDING


class MemberCreate(MemberBase):
    password: str = Field(..., min_length=8, description="Password for the member's first access.")

class MemberCreateWithAssociation(MemberCreate):
    lodge_id: int = Field(..., description="ID of the Lodge to which the member will be associated.")
    role_id: int = Field(..., description="ID of the Role the member will hold in the lodge.")

class MemberUpdate(BaseModel):
    full_name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    cpf: Optional[str] = Field(None, max_length=14)
    identity_document: Optional[str] = Field(None, max_length=50)
    birth_date: Optional[date] = None
    marriage_date: Optional[date] = None
    street_address: Optional[str] = Field(None, max_length=255)
    street_number: Optional[str] = Field(None, max_length=50)
    neighborhood: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    zip_code: Optional[str] = Field(None, max_length=9)
    phone: Optional[str] = Field(None, max_length=20)
    place_of_birth: Optional[str] = Field(None, max_length=100)
    nationality: Optional[str] = Field(None, max_length=100)
    religion: Optional[str] = Field(None, max_length=100)
    fathers_name: Optional[str] = Field(None, max_length=255)
    mothers_name: Optional[str] = Field(None, max_length=255)
    education_level: Optional[str] = Field(None, max_length=255)
    occupation: Optional[str] = Field(None, max_length=255)
    workplace: Optional[str] = Field(None, max_length=255)
    profile_picture_path: Optional[str] = Field(None, max_length=255)
    cim: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    degree: Optional[DegreeEnum] = None
    initiation_date: Optional[date] = None
    elevation_date: Optional[date] = None
    exaltation_date: Optional[date] = None
    affiliation_date: Optional[date] = None
    regularization_date: Optional[date] = None
    philosophical_degree: Optional[str] = Field(None, max_length=100)
    registration_status: Optional[RegistrationStatusEnum] = None
    password: Optional[str] = Field(None, min_length=8)

class MemberResponse(MemberBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    family_members: List[FamilyMemberResponse] = []
    decorations: List[DecorationResponse] = []
    role_history: List[RoleHistoryResponse] = []

    class Config:
        from_attributes = True
