from pydantic import BaseModel

class ExternalLodgeResponse(BaseModel):
    id: int
    name: str
    number: str | None = None
    obedience: str | None = None
    city: str | None = None
    state: str | None = None

    class Config:
        from_attributes = True
