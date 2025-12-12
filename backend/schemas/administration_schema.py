from typing import List, Optional
from datetime import date
from pydantic import BaseModel, ConfigDict

# --- RoleHistory Schema ---

class RoleHistoryBase(BaseModel):
    member_id: int
    role_id: int
    start_date: date
    end_date: Optional[date] = None

class RoleHistoryCreate(RoleHistoryBase):
    pass

class RoleHistoryUpdate(BaseModel):
    member_id: Optional[int] = None
    role_id: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class SimpleRoleResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class SimpleMemberResponse(BaseModel):
    id: int
    full_name: str
    model_config = ConfigDict(from_attributes=True)

class RoleHistoryResponse(RoleHistoryBase):
    id: int
    administration_id: Optional[int] = None
    role: Optional[SimpleRoleResponse] = None
    member: Optional[SimpleMemberResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

# --- Administration Schema ---

class AdministrationOfficer(BaseModel):
    role_id: int
    member_id: int

class AdministrationBase(BaseModel):
    identifier: str
    start_date: date
    end_date: date
    is_current: bool = False

class AdministrationCreate(AdministrationBase):
    # Optional: Initial board composition
    officers: Optional[List[AdministrationOfficer]] = None

class AdministrationUpdate(BaseModel):
    identifier: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None
    officers: Optional[List[AdministrationOfficer]] = None # Full replacement of board

class AdministrationResponse(AdministrationBase):
    id: int
    lodge_id: int
    role_histories: List[RoleHistoryResponse] = [] # Officers linked to this admin
    
    model_config = ConfigDict(from_attributes=True)
