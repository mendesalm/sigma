from datetime import date

from pydantic import BaseModel, ConfigDict

# --- RoleHistory Schema ---


class RoleHistoryBase(BaseModel):
    member_id: int
    role_id: int
    start_date: date
    end_date: date | None = None


class RoleHistoryCreate(RoleHistoryBase):
    pass


class RoleHistoryUpdate(BaseModel):
    member_id: int | None = None
    role_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None


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
    administration_id: int | None = None
    role: SimpleRoleResponse | None = None
    member: SimpleMemberResponse | None = None

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
    officers: list[AdministrationOfficer] | None = None


class AdministrationUpdate(BaseModel):
    identifier: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None
    officers: list[AdministrationOfficer] | None = None  # Full replacement of board


class AdministrationResponse(AdministrationBase):
    id: int
    lodge_id: int
    role_histories: list[RoleHistoryResponse] = []  # Officers linked to this admin

    model_config = ConfigDict(from_attributes=True)
