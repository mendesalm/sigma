
from pydantic import BaseModel, EmailStr, Field


# Schema for login request body
class SuperAdminLogin(BaseModel):
    email: EmailStr
    password: str

# Schema for creating a new SuperAdmin
class SuperAdminCreate(BaseModel):
    username: str = Field(..., min_length=3, description="Unique username for the super administrator.")
    email: EmailStr
    password: str = Field(..., min_length=8, description="Strong password for the super administrator.")

# Schema for updating a SuperAdmin
class SuperAdminUpdate(BaseModel):
    username: str | None = Field(None, min_length=3, description="New username.")
    email: EmailStr | None = None
    password: str | None = Field(None, min_length=8, description="New password (if changing).")
    is_active: bool | None = None

# Schema for response when getting SuperAdmin data (without password)
class SuperAdminResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_active: bool

    class Config:
        from_attributes = True

# Schema for access token response
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
