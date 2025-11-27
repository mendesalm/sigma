from pydantic import BaseModel, EmailStr


class ManualAttendanceUpdate(BaseModel):
    member_id: int
    attendance_status: str  # Ex: "Presente", "Justificado", "Ausente"


class VisitorCreate(BaseModel):
    full_name: str
    email: EmailStr | None = None
    origin_lodge: str | None = None
    cpf: str | None = None


class QrCheckInRequest(BaseModel):
    user_id: int
    lodge_id: int
    latitude: float
    longitude: float
