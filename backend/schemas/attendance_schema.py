from pydantic import BaseModel, EmailStr
from typing import Optional

class ManualAttendanceUpdate(BaseModel):
    member_id: int
    attendance_status: str # Ex: "Presente", "Justificado", "Ausente"

class VisitorCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    origin_lodge: Optional[str] = None
    cpf: Optional[str] = None

class QrCheckInRequest(BaseModel):
    user_id: int
    lodge_id: int
    latitude: float
    longitude: float
