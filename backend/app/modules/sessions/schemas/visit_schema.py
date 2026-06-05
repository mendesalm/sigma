from datetime import date

from pydantic import BaseModel


class VisitBase(BaseModel):
    visit_date: date
    member_id: int
    home_lodge_id: int
    visited_lodge_id: int
    session_id: int


class VisitCreate(VisitBase):
    pass


class VisitInDB(VisitBase):
    id: int

    class Config:
        from_attributes = True
