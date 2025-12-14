from pydantic import BaseModel, Field
from typing import Optional, Literal

class SectionStyles(BaseModel):
    font_family: Optional[str] = None
    font_size: str = Field(default="12pt", description="Tamanho da fonte")
    color: Optional[str] = None
    background_color: Optional[str] = None
    background_image: Optional[str] = None
    bold: bool = False
    italic: bool = False
    alignment: Literal["left", "center", "right", "justify"] = "left"
    line_height: float = 1.5
    spacing: str = Field(default="10px", description="Espaçamento padrão (margin/padding)")

class HeaderConfig(BaseModel):
    logo_size: str = Field(default="80px", description="Altura do logo (ex: 80px, 2cm, 12pt)")
    logo_url: Optional[str] = Field(default=None, description="URL do logo personalizado (substitui o da loja)")
    logo_obedience: Optional[str] = Field(default=None, description="URL do logo da obediência")
    font_family: Optional[str] = None
    font_size_title: str = Field(default="16pt", description="Tamanho da fonte do Título")
    font_size_subtitle: str = Field(default="12pt", description="Tamanho da fonte do Subtítulo")
    alignment_title: Literal["left", "center", "right"] = "center"
    alignment_subtitle: Literal["left", "center", "right"] = "center"
    line_height: float = 1.2
    color: Optional[str] = None
    background_color: Optional[str] = None
    background_image: Optional[str] = None
    background_opacity: float = Field(default=1.0, description="Opacidade do fundo do cabeçalho")
    padding: str = Field(default="0.3cm", description="Padding interno do cabeçalho")
    spacing_bottom: str = Field(default="20px", description="Espaço abaixo do cabeçalho")
    border_bottom_show: bool = Field(default=False, description="Exibir borda inferior")
    border_bottom_style: Literal["solid", "dashed", "dotted", "double"] = "solid"
    border_bottom_width: str = Field(default="1px", description="Espessura da borda inferior")
    border_bottom_color: Optional[str] = Field(default=None, description="Cor da borda inferior")

class TitlesConfig(BaseModel):
    font_family: Optional[str] = None
    font_size: str = Field(default="14pt", description="Tamanho da fonte dos Títulos")
    color: Optional[str] = None
    bold: bool = Field(default=True, description="Negrito")
    uppercase: bool = Field(default=True, description="Texto em caixa alta")
    alignment: Literal["left", "center", "right"] = "center"
    line_height: float = 1.2
    margin_top: str = Field(default="10px", description="Espaço acima dos Títulos")
    margin_bottom: str = Field(default="20px", description="Espaço abaixo dos Títulos")
    show: bool = Field(default=True, description="Exibir seção de títulos")

class SignaturesConfig(BaseModel):
    font_family: Optional[str] = None
    font_size: str = Field(default="11pt", description="Tamanho da fonte das Assinaturas")
    color: Optional[str] = None
    line_color: str = Field(default="#000000", description="Cor da linha de assinatura")
    spacing_top: str = Field(default="50px", description="Espaço acima das assinaturas")
    show_date: bool = Field(default=True, description="Mostrar cidade/data acima")

class FooterConfig(BaseModel):
    font_size: str = Field(default="10pt", description="Tamanho da fonte do rodapé")
    color: Optional[str] = None
    background_color: Optional[str] = None
    background_image: Optional[str] = None
    spacing_top: str = Field(default="40px", description="Espaço acima do rodapé")

class DocumentStyles(BaseModel):
    page_size: str = Field(default="A4", description="Tamanho da página (A4, Letter, etc)")
    orientation: Literal["portrait", "landscape"] = Field(default="portrait", description="Orientação da página")
    page_margin: str = Field(default="1cm", description="Margem da página em CSS units")
    font_family: str = Field(default="Arial, sans-serif", description="Família da fonte Global")
    line_height: float = Field(default=1.5, description="Altura da linha Global")
    primary_color: str = Field(default="#000000", description="Cor primária Global")
    show_border: bool = Field(default=True, description="Mostrar borda da página")
    border_style: str = Field(default="solid", description="Estilo da borda CSS (solid, double, etc)")
    content_layout: Literal["standard", "condensed"] = Field(default="standard", description="Layout do conteúdo")
    show_page_numbers: bool = Field(default=True, description="Mostrar números de página")
    background_color: str = Field(default="#ffffff", description="Cor de fundo da página")
    background_image: str = Field(default="none", description="URL da imagem de fundo ou 'none'")
    
    # Advanced Page Styling
    page_padding: str = Field(default="0cm", description="Espaçamento interno (padding) da borda ao conteúdo")
    border_width: str = Field(default="3px", description="Espessura da borda")
    border_color: str = Field(default="#000000", description="Cor da borda")
    watermark_image: str = Field(default="", description="URL da marca d'água")
    watermark_opacity: float = Field(default=0.1, description="Opacidade da marca d'água (0.0 a 1.0)")
    
    # Granular Controls
    header_config: HeaderConfig = Field(default_factory=HeaderConfig)
    titles_config: TitlesConfig = Field(default_factory=TitlesConfig)
    content_config: SectionStyles = Field(default_factory=SectionStyles)
    signatures_config: SignaturesConfig = Field(default_factory=SignaturesConfig)
    footer_config: FooterConfig = Field(default_factory=FooterConfig)

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
