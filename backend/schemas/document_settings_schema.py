from pydantic import BaseModel, Field
from typing import Optional, Literal

class DocumentStyles(BaseModel):
    page_size: str = Field(default="A4", description="Tamanho da página (A4, Letter, etc)")
    orientation: Literal["portrait", "landscape"] = Field(default="portrait", description="Orientação da página")
    page_margin: str = Field(default="1cm", description="Margem da página em CSS units")
    font_family: str = Field(default="Arial, sans-serif", description="Família da fonte")
    line_height: float = Field(default=1.5, description="Altura da linha")
    primary_color: str = Field(default="#000000", description="Cor primária em hex ou nome")
    show_border: bool = Field(default=True, description="Mostrar borda da página")
    border_style: str = Field(default="solid", description="Estilo da borda CSS (solid, double, etc)")
    content_layout: Literal["standard", "condensed"] = Field(default="standard", description="Layout do conteúdo")
    show_page_numbers: bool = Field(default=True, description="Mostrar números de página")
    background_color: str = Field(default="#ffffff", description="Cor de fundo da página")
    background_image: str = Field(default="none", description="URL da imagem de fundo ou 'none'")

class DocumentTypeSettings(BaseModel):
    header: str = Field(default="header_classico.html", description="Template parcial do cabeçalho")
    body: str = Field(default="template_padrao.html", description="Template do corpo")
    footer: str = Field(default="footer_padrao.html", description="Template do rodapé")
    styles: DocumentStyles = Field(default_factory=DocumentStyles)

class DocumentSettings(BaseModel):
    balaustre: DocumentTypeSettings = Field(default_factory=DocumentTypeSettings)
    prancha: DocumentTypeSettings = Field(default_factory=DocumentTypeSettings)
    convite: DocumentTypeSettings = Field(default_factory=DocumentTypeSettings)

    class Config:
         extra = "ignore" # Permite chaves extras no JSON sem quebrar, mas valida as conhecidas
