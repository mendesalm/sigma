from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

# --- Global Document Templates ---


class GlobalDocumentTemplateBase(BaseModel):
    title: str = Field(..., description="Título do modelo global")
    document_type: str = Field(..., description="Tipo do template (ex: BALAUSTRE, EDITAL)")
    html_content: str = Field(..., description="Conteúdo HTML base do template")
    header_html: str | None = Field(None, description="HTML do cabeçalho")
    footer_html: str | None = Field(None, description="HTML do rodapé")
    placeholders_schema: dict[str, Any] | None = Field(None, description="Esquema JSON para os Badges da UI")


class GlobalDocumentTemplateCreate(GlobalDocumentTemplateBase):
    pass


class GlobalDocumentTemplateUpdate(BaseModel):
    title: str | None = None
    html_content: str | None = None
    header_html: str | None = None
    footer_html: str | None = None
    placeholders_schema: dict[str, Any] | None = None


class GlobalDocumentTemplateResponse(GlobalDocumentTemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


# --- Local Document Templates ---


class LocalDocumentTemplateBase(BaseModel):
    document_type: str = Field(..., description="Tipo do template derivado")
    custom_html_content: str | None = Field(None, description="Conteúdo HTML customizado pela Loja")
    custom_header: str | None = Field(None, description="HTML customizado do cabeçalho")
    custom_footer: str | None = Field(None, description="HTML customizado do rodapé")
    is_active: bool = Field(True, description="Indica se o template local está sendo usado")


class LocalDocumentTemplateCreate(LocalDocumentTemplateBase):
    lodge_id: int


class LocalDocumentTemplateUpdate(BaseModel):
    custom_html_content: str | None = None
    custom_header: str | None = None
    custom_footer: str | None = None
    is_active: bool | None = None


class LocalDocumentTemplateResponse(LocalDocumentTemplateBase):
    id: int
    lodge_id: int
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True
