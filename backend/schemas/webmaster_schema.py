
from pydantic import BaseModel, EmailStr


class WebmasterBase(BaseModel):
    username: str
    email: EmailStr
    is_active: bool | None = True
    lodge_id: int | None = None
    obedience_id: int | None = None

class WebmasterCreate(WebmasterBase):
    password: str

class WebmasterUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    is_active: bool | None = None
    lodge_id: int | None = None
    obedience_id: int | None = None
    password: str | None = None

class Webmaster(WebmasterBase):
    id: int

    class Config:
        orm_mode = True
