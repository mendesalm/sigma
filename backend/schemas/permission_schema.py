
from pydantic import BaseModel, Field


class PermissionBase(BaseModel):
    action: str = Field(..., max_length=255, description="The specific action allowed, e.g., 'create_member'")
    description: str | None = Field(None, max_length=255, description="A user-friendly description of the permission.")

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    action: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=255)

class PermissionResponse(PermissionBase):
    id: int

    class Config:
        from_attributes = True
