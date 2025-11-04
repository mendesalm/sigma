from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from models.models import RoleTypeEnum, RiteEnum # Import new enums

class RoleBase(BaseModel):
    name: str = Field(..., max_length=255, description="Name of the role.")
    role_type: RoleTypeEnum = Field(..., description="Type of the role (Ritualistic or Obedience).")
    applicable_rites: Optional[List[RiteEnum]] = Field(None, description="List of rites to which the ritualistic role applies.")
    obedience_ids: Optional[List[int]] = Field(None, description="List of Obedience IDs to which the Obedience role applies.")

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255, description="New name of the role.")
    role_type: Optional[RoleTypeEnum] = Field(None, description="New type of the role.")
    applicable_rites: Optional[List[RiteEnum]] = Field(None, description="New list of rites to which the ritualistic role applies.")
    obedience_ids: Optional[List[int]] = Field(None, description="New list of Obedience IDs to which the Obedience role applies.")

class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
