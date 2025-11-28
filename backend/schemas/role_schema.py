from pydantic import BaseModel, Field

from models.models import RoleTypeEnum
from schemas.permission_schema import PermissionResponse


class RoleBase(BaseModel):
    name: str = Field(..., max_length=255)
    role_type: RoleTypeEnum
    level: int = Field(1, ge=1, le=9, description="Hierarchy level within the scope (1-9).")
    base_credential: int = Field(10, description="Base credential value for calculation.")
    applicable_rites: str | None = Field(
        None, max_length=255, description="Comma-separated list of applicable rites, e.g., 'REAA,YORK'"
    )


class RoleCreate(RoleBase):
    permission_ids: list[int] = Field([], description="A list of permission IDs to associate with this role.")


class RoleUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    role_type: RoleTypeEnum | None = None
    level: int | None = Field(None, ge=1, le=9)
    base_credential: int | None = None
    applicable_rites: str | None = Field(None, max_length=255)
    permission_ids: list[int] | None = Field(
        None, description="A new list of permission IDs to associate with this role."
    )


class RoleResponse(RoleBase):
    id: int
    permissions: list[PermissionResponse] = []

    class Config:
        from_attributes = True
