from datetime import datetime
from pydantic import BaseModel, Field

class DocumentTemplateBase(BaseModel):
    type: str = Field(..., description="Tipo do template (BALAUSTRE ou EDITAL)")
    content: str = Field(..., description="Conteúdo HTML do template")

class DocumentTemplateCreate(DocumentTemplateBase):
    pass

class DocumentTemplateUpdate(BaseModel):
    content: str = Field(..., description="Conteúdo HTML do template")

from typing import Optional

class DocumentTemplateResponse(DocumentTemplateBase):
    id: int
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
