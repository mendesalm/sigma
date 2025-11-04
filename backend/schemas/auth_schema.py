from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class EmailSchema(BaseModel):
    email: EmailStr

class LodgeMemberLogin(BaseModel):
    email: EmailStr
    password: str

class LodgeMemberSelectLodge(BaseModel):
    lodge_id: int

class LodgeMemberForgotPassword(BaseModel):
    email: EmailStr

class LodgeMemberResetPassword(BaseModel):
    token: str
    new_password: str

class LodgeMemberAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str
    user_id: int
    email: EmailStr
    full_name: Optional[str] = None
    lodge_id: Optional[int] = None
    lodge_name: Optional[str] = None
    role_id: Optional[int] = None
    role_name: Optional[str] = None


class WebmasterLogin(BaseModel):
    email: EmailStr
    password: str


class WebmasterAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class WebmasterForgotPassword(BaseModel):
    email: EmailStr

class WebmasterResetPassword(BaseModel):
    token: str
    new_password: str
