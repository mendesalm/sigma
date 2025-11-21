from datetime import datetime

from pydantic import BaseModel


class CalendarBase(BaseModel):
    title: str
    description: str | None = None

class CalendarCreate(CalendarBase):
    pass

class CalendarUpdate(CalendarBase):
    pass

class CalendarInDB(CalendarBase):
    id: int
    lodge_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
