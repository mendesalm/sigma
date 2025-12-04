from pydantic import BaseModel, EmailStr


class ManualAttendanceUpdate(BaseModel):
    member_id: int
    attendance_status: str  # Ex: "Presente", "Justificado", "Ausente"


class VisitorCreate(BaseModel):
    full_name: str
    cim: str
    degree: str
    
    # Loja de Origem
    origin_lodge_id: int | None = None
    manual_lodge_name: str | None = None
    manual_lodge_number: str | None = None
    manual_lodge_obedience: str | None = None
    
    remarks: str | None = None


class QrCheckInRequest(BaseModel):
    user_id: int
    lodge_id: int
    latitude: float
    longitude: float
