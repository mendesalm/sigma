from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from .session_attendance_schema import SessionAttendanceResponse # Updated import
from pydantic_settings import SettingsConfigDict

class MasonicSessionBase(BaseModel):
    session_date: datetime
    session_type: str
    session_subtype: Optional[str] = None
    status: str

class MasonicSessionCreate(MasonicSessionBase):
    pass

class MasonicSessionUpdate(MasonicSessionBase):
    pass

class MasonicSessionResponse(MasonicSessionBase):
    id: int
    lodge_id: int
    attendances: List[SessionAttendanceResponse] = []

    model_config = SettingsConfigDict(from_attributes=True)
