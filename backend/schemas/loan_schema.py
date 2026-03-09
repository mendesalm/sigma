from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.models import LoanStatusEnum
from schemas.library_item_schema import LibraryItemResponse
from schemas.member_schema import MemberListResponse


class LoanBase(BaseModel):
    item_id: int
    member_id: int
    due_date: datetime


class LoanCreate(BaseModel):
    item_id: int
    member_id: int


class LoanUpdate(BaseModel):
    status: LoanStatusEnum | None = None
    return_date: datetime | None = None


class LoanResponse(LoanBase):
    id: int
    loan_date: datetime
    return_date: datetime | None = None
    status: LoanStatusEnum
    created_at: datetime
    updated_at: datetime | None = None
    item: LibraryItemResponse | None = None
    member: MemberListResponse | None = None

    model_config = ConfigDict(from_attributes=True)
