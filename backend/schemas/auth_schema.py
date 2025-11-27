from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str


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
    full_name: str | None = None
    lodge_id: int | None = None
    lodge_name: str | None = None
    role_id: int | None = None
    role_name: str | None = None


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
