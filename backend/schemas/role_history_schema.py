from datetime import date

from pydantic import BaseModel, Field


# Nested schema to represent the Role in the response
class SimpleRoleResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# Base schema with common fields
class RoleHistoryBase(BaseModel):
    role_id: int = Field(..., description="ID of the role held.")
    start_date: date = Field(..., description="Start date in the role.")
    end_date: date | None = Field(None, description="End date in the role (if applicable).")


# Schema for creation (requires member ID)
class RoleHistoryCreate(RoleHistoryBase):
    pass


# Schema for update (only dates are updatable)
class RoleHistoryUpdate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None


# Schema for API response (includes the role object)
class RoleHistoryResponse(RoleHistoryBase):
    id: int
    role: SimpleRoleResponse  # Nested response with the role name

    class Config:
        from_attributes = True
