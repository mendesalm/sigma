from pydantic import BaseModel, Field
from typing import Optional

class PermissionBase(BaseModel):
    action: str = Field(..., max_length=255, description="The specific action allowed, e.g., 'create_member'")
    description: Optional[str] = Field(None, max_length=255, description="A user-friendly description of the permission.")

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    action: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=255)

class PermissionResponse(PermissionBase):
    id: int

    class Config:
        from_attributes = True