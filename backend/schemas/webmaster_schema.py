from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class WebmasterBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=255, description="Unique username for the webmaster.")
    email: EmailStr = Field(..., description="Email of the webmaster.")
    is_active: bool = True
    lodge_id: Optional[int] = None
    obedience_id: Optional[int] = None

class WebmasterCreate(WebmasterBase):
    password: str = Field(..., min_length=8, description="Password for the webmaster.")

class WebmasterUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=255, description="New username for the webmaster.")
    email: Optional[EmailStr] = Field(None, description="New email for the webmaster.")
    password: Optional[str] = Field(None, min_length=8, description="New password for the webmaster.")
    is_active: Optional[bool] = None
    lodge_id: Optional[int] = None
    obedience_id: Optional[int] = None

class WebmasterResponse(WebmasterBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WebmasterUpdateEmail(BaseModel):
    email: EmailStr = Field(..., description="New email for the webmaster.")

class WebmasterResetPasswordMessage(BaseModel):
    message: str
