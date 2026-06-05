from datetime import date

from pydantic import BaseModel, model_validator

from models.models import ExceptionTypeEnum


class MemberRoleAssign(BaseModel):
    role_id: int
    lodge_id: int | None = None
    obedience_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def check_context(self):
        if not self.lodge_id and not self.obedience_id:
            raise ValueError("Either lodge_id or obedience_id must be provided")
        if self.lodge_id and self.obedience_id:
            raise ValueError("Cannot provide both lodge_id and obedience_id")
        return self


class MemberPermissionExceptionCreate(BaseModel):
    permission_id: int
    exception_type: ExceptionTypeEnum
    lodge_id: int | None = None
    obedience_id: int | None = None

    @model_validator(mode="after")
    def check_context(self):
        if not self.lodge_id and not self.obedience_id:
            raise ValueError("Either lodge_id or obedience_id must be provided")
        if self.lodge_id and self.obedience_id:
            raise ValueError("Cannot provide both lodge_id and obedience_id")
        return self
