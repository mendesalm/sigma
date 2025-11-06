from pydantic import BaseModel, EmailStr
from typing import Optional, List

class WebmasterBase(BaseModel):
    username: str
    email: EmailStr
    is_active: Optional[bool] = True
    lodge_id: Optional[int] = None
    obedience_id: Optional[int] = None

class WebmasterCreate(WebmasterBase):
    password: str

class WebmasterUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None
    lodge_id: Optional[int] = None
    obedience_id: Optional[int] = None
    password: Optional[str] = None

class Webmaster(WebmasterBase):
    id: int

    class Config:
        orm_mode = True