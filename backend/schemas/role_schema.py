from pydantic import BaseModel, Field
from typing import Optional, List

from ..models.models import RoleTypeEnum
from .permission_schema import PermissionResponse

class RoleBase(BaseModel):
    name: str = Field(..., max_length=255)
    role_type: RoleTypeEnum
    applicable_rites: Optional[str] = Field(None, max_length=255, description="Comma-separated list of applicable rites, e.g., 'REAA,YORK'")

class RoleCreate(RoleBase):
    permission_ids: List[int] = Field([], description="A list of permission IDs to associate with this role.")

class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    role_type: Optional[RoleTypeEnum] = None
    applicable_rites: Optional[str] = Field(None, max_length=255)
    permission_ids: Optional[List[int]] = Field(None, description="A new list of permission IDs to associate with this role.")

class RoleResponse(RoleBase):
    id: int
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True