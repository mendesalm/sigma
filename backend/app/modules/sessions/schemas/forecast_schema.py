from pydantic import BaseModel

class PresenceForecastResponse(BaseModel):
    session_id: int
    confirmed_members: int
    confirmed_guests: int
    confirmed_visitors: int
    total_expected: int
