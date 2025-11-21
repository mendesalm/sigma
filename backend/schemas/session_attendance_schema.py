from datetime import datetime

from pydantic import BaseModel
from pydantic_settings import SettingsConfigDict


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
