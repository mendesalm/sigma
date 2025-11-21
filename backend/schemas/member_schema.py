import enum
from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from .decoration_schema import DecorationResponse
from .family_member_schema import FamilyMemberResponse
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
    cpf: str | None = Field(None, max_length=14)
    identity_document: str | None = Field(None, max_length=50)
    birth_date: date | None = None
    marriage_date: date | None = None
    street_address: str | None = Field(None, max_length=255)
    street_number: str | None = Field(None, max_length=50)
    neighborhood: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)
    zip_code: str | None = Field(None, max_length=9)
    phone: str | None = Field(None, max_length=20)
    place_of_birth: str | None = Field(None, max_length=100)
    nationality: str | None = Field(None, max_length=100)
    religion: str | None = Field(None, max_length=100)
    fathers_name: str | None = Field(None, max_length=255)
    mothers_name: str | None = Field(None, max_length=255)
    education_level: str | None = Field(None, max_length=255)
    occupation: str | None = Field(None, max_length=255)
    workplace: str | None = Field(None, max_length=255)
    profile_picture_path: str | None = Field(None, max_length=255)

    # Masonic Data
    cim: str | None = Field(None, max_length=50)
    status: str | None = Field('Active', max_length=50)
    degree: DegreeEnum | None = None
    initiation_date: date | None = None
    elevation_date: date | None = None
    exaltation_date: date | None = None
    affiliation_date: date | None = None
    regularization_date: date | None = None
    philosophical_degree: str | None = Field(None, max_length=100)

    # System Data
    registration_status: RegistrationStatusEnum = RegistrationStatusEnum.PENDING


class MemberCreate(MemberBase):
    password: str = Field(..., min_length=8, description="Password for the member's first access.")

class MemberCreateWithAssociation(MemberCreate):
    lodge_id: int = Field(..., description="ID of the Lodge to which the member will be associated.")
    role_id: int = Field(..., description="ID of the Role the member will hold in the lodge.")

class MemberUpdate(BaseModel):
    full_name: str | None = Field(None, max_length=255)
    email: EmailStr | None = None
    cpf: str | None = Field(None, max_length=14)
    identity_document: str | None = Field(None, max_length=50)
    birth_date: date | None = None
    marriage_date: date | None = None
    street_address: str | None = Field(None, max_length=255)
    street_number: str | None = Field(None, max_length=50)
    neighborhood: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)
    zip_code: str | None = Field(None, max_length=9)
    phone: str | None = Field(None, max_length=20)
    place_of_birth: str | None = Field(None, max_length=100)
    nationality: str | None = Field(None, max_length=100)
    religion: str | None = Field(None, max_length=100)
    fathers_name: str | None = Field(None, max_length=255)
    mothers_name: str | None = Field(None, max_length=255)
    education_level: str | None = Field(None, max_length=255)
    occupation: str | None = Field(None, max_length=255)
    workplace: str | None = Field(None, max_length=255)
    profile_picture_path: str | None = Field(None, max_length=255)
    cim: str | None = Field(None, max_length=50)
    status: str | None = Field(None, max_length=50)
    degree: DegreeEnum | None = None
    initiation_date: date | None = None
    elevation_date: date | None = None
    exaltation_date: date | None = None
    affiliation_date: date | None = None
    regularization_date: date | None = None
    philosophical_degree: str | None = Field(None, max_length=100)
    registration_status: RegistrationStatusEnum | None = None
    password: str | None = Field(None, min_length=8)

class MemberResponse(MemberBase):
    id: int
    created_at: datetime
    updated_at: datetime | None = None
    last_login: datetime | None = None
    family_members: list[FamilyMemberResponse] = []
    decorations: list[DecorationResponse] = []
    role_history: list[RoleHistoryResponse] = []

    class Config:
        from_attributes = True
