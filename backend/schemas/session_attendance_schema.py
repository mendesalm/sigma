from datetime import datetime

from pydantic import BaseModel
from pydantic_settings import SettingsConfigDict


# Schema for basic member info to be nested in the response
class MemberInfo(BaseModel):
    id: int
    full_name: str

    model_config = SettingsConfigDict(from_attributes=True)


# Schema for basic visitor info to be nested in the response
class VisitorInfo(BaseModel):
    id: int
    full_name: str
    origin_lodge: str | None = None

    model_config = SettingsConfigDict(from_attributes=True)


class SessionAttendanceBase(BaseModel):
    member_id: int | None = None
    visitor_id: int | None = None
    attendance_status: str
    check_in_datetime: datetime | None = None
    check_in_method: str | None = None
    check_in_latitude: float | None = None
    check_in_longitude: float | None = None


class SessionAttendanceCreate(SessionAttendanceBase):
    session_id: int


class SessionAttendanceResponse(SessionAttendanceBase):
    id: int
    session_id: int

    model_config = SettingsConfigDict(from_attributes=True)


class SessionAttendanceWithMemberResponse(SessionAttendanceResponse):
    member: MemberInfo | None = None
    visitor: VisitorInfo | None = None


class CheckInRequest(BaseModel):
    qr_code_token: str
    latitude: float
    longitude: float

