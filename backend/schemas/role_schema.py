
from pydantic import BaseModel, Field

from ..models.models import RoleTypeEnum
from .permission_schema import PermissionResponse


class RoleBase(BaseModel):
    name: str = Field(..., max_length=255)
    role_type: RoleTypeEnum
    applicable_rites: str | None = Field(None, max_length=255, description="Comma-separated list of applicable rites, e.g., 'REAA,YORK'")

class RoleCreate(RoleBase):
    permission_ids: list[int] = Field([], description="A list of permission IDs to associate with this role.")

class RoleUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    role_type: RoleTypeEnum | None = None
    applicable_rites: str | None = Field(None, max_length=255)
    permission_ids: list[int] | None = Field(None, description="A new list of permission IDs to associate with this role.")

class RoleResponse(RoleBase):
    id: int
    permissions: list[PermissionResponse] = []

    class Config:
        from_attributes = True
