from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from pydantic_settings import SettingsConfigDict

class SessionAttendanceBase(BaseModel):
    member_id: Optional[int] = None
    visitor_id: Optional[int] = None
    attendance_status: str
    check_in_datetime: Optional[datetime] = None

class SessionAttendanceCreate(SessionAttendanceBase):
    session_id: int

class SessionAttendanceResponse(SessionAttendanceBase):
    id: int
    session_id: int

    model_config = SettingsConfigDict(from_attributes=True)
