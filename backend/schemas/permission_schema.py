from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PermissionBase(BaseModel):
    action: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=255)

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(PermissionBase):
    action: Optional[str] = Field(None, min_length=3, max_length=255)

class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Allows the model to be created from object attributes (ORM)
