"""
Schema de Configurações de Documentos — Motor de Documentos v3

Concepção:
  Nível Global (Super Admin)  → Padronização
  Nível Instancial (Webmaster) → Personalização
  Nível Operacional (Secretário) → Adequação

Elementos estruturais do documento:
  cabecalho_pagina, titulos, identificacao, enderecamento, assunto,
  texto, local_data, assinatura, rodape_pagina
"""

from typing import Literal

from pydantic import BaseModel, Field


# =============================================================================
# CONFIGURAÇÃO DA PÁGINA (Nível de Padronização/Personalização)
# =============================================================================

class PageSettings(BaseModel):
    """Configuração exclusiva da folha de papel: tamanho, margens, bordas, fundo, padding."""

    format: str = Field(default="A4", description="Tamanho do papel (A4, A5, Letter)")
    orientation: Literal["portrait", "landscape"] = Field(default="portrait", description="Orientação da página")

    # Margens individuais
    margin_top: str = Field(default="1cm")
    margin_bottom: str = Field(default="1cm")
    margin_left: str = Field(default="1cm")
    margin_right: str = Field(default="1cm")

    # Padding relativo às bordas da página
    page_padding: str = Field(default="0cm", description="Padding interno (da borda ao conteúdo)")

    # Fundo
    background_color: str = Field(default="#ffffff", description="Cor de fundo da página")
    background_image: str | None = Field(default=None, description="URL da imagem de fundo")

    # Bordas
    show_border: bool = Field(default=False)
    border_style: str = Field(default="solid")
    border_color: str = Field(default="#000000")
    border_width: str = Field(default="1px")

    # Marca d'água
    watermark_image: str | None = Field(default=None)
    watermark_opacity: float = Field(default=0.1)

    # Numeração de página
    show_page_numbers: bool = Field(default=True, description="Exibir numeração 'página X de Y'")


# =============================================================================
# CONFIGURAÇÕES DOS ELEMENTOS ESTRUTURAIS
# Cada elemento que compõe o documento pode ser configurado isoladamente.
# =============================================================================

class HeaderConfig(BaseModel):
    """Cabeçalho da página: timbre, logo, nome da loja, afiliações."""

    logo_size: str = Field(default="80px", description="Altura do logo")
    logo_url: str | None = Field(default=None, description="URL do logo personalizado")
    logo_obedience: str | None = Field(default=None, description="URL do logo da obediência")
    font_family: str | None = None

    # Tipografia do Título / Subtítulo
    font_size_title: str = Field(default="16pt", description="Tamanho da fonte do Título")
    font_size_subtitle: str = Field(default="12pt", description="Tamanho da fonte do Subtítulo")
    color: str | None = None
    color_title: str | None = None
    color_subtitle: str | None = None
    margin_title: str = Field(default="0", description="Margem do Título")
    margin_subtitle: str = Field(default="5px 0 0 0", description="Margem do Subtítulo")

    # Layout
    layout_mode: Literal["timbre", "classic", "inverted", "centered_stack", "double", "custom"] = Field(
        default="classic", description="Modo de layout do cabeçalho da página"
    )

    # Textos fixos opcionais (sobrescrevem variáveis dinâmicas)
    custom_title_text: str | None = Field(default=None, description="Texto fixo do título")
    custom_subtitle_text: str | None = Field(default=None, description="Texto fixo do subtítulo")

    # Slots (Legacy/Fallback)
    slot_left: str | None = Field(default="logo_url")
    slot_center: str | None = Field(default="text")
    slot_right: str | None = Field(default="empty")
    show_affiliations: bool = Field(default=True, description="Mostrar afiliações")

    alignment_title: Literal["left", "center", "right"] = "center"
    alignment_subtitle: Literal["left", "center", "right"] = "center"
    line_height: float = 1.2

    # Background
    background_color: str | None = None
    background_image: str | None = None
    background_opacity: float = Field(default=1.0)
    image_opacity: float = Field(default=1.0)

    padding: str = Field(default="0.3cm", description="Padding interno do cabeçalho")
    spacing_bottom: str = Field(default="20px", description="Espaço abaixo do cabeçalho")
    border_bottom_show: bool = Field(default=False)
    border_bottom_style: Literal["solid", "dashed", "dotted", "double"] = "solid"
    border_bottom_width: str = Field(default="1px")
    border_bottom_color: str | None = Field(default=None)


class TitlesConfig(BaseModel):
    """Títulos do documento (Ex: 'A∴R∴L∴S∴ Aurora nº 1234')."""

    font_family: str | None = None
    font_size: str = Field(default="14pt")
    color: str | None = None
    bold: bool = Field(default=True)
    uppercase: bool = Field(default=True, description="Texto em caixa alta")
    alignment: Literal["left", "center", "right"] = "center"
    line_height: float = 1.2
    margin_top: str = Field(default="10px")
    margin_bottom: str = Field(default="20px")
    show: bool = Field(default=True)
    background_color: str | None = None
    background_image: str | None = None
    background_opacity: float = Field(default=1.0)
    padding: str = Field(default="0")

    # Template de texto (HTML/Jinja2) para padronização/personalização
    text_template: str | None = Field(default=None, description="Template do conteúdo dos títulos")


class IdentificacaoConfig(BaseModel):
    """Identificação do tipo de documento (Ex: 'PRANCHA Nº 045/2026')."""

    font_family: str | None = None
    font_size: str = Field(default="12pt")
    color: str | None = None
    bold: bool = True
    uppercase: bool = True
    alignment: Literal["left", "center", "right"] = "center"
    line_height: float = 1.2
    padding: str = Field(default="5px 0")
    show: bool = True
    background_color: str | None = None

    # Template de texto (HTML/Jinja2)
    text_template: str | None = Field(
        default=None,
        description="Template do identificador. Ex: 'PRANCHA Nº {{ numero_documento }}'"
    )


class EnderecamentoConfig(BaseModel):
    """Endereçamento do documento (Ex: 'Ao Ill∴ Ir∴ Fulano de Tal')."""

    font_family: str | None = None
    font_size: str = Field(default="12pt")
    color: str | None = None
    bold: bool = False
    alignment: Literal["left", "center", "right"] = "left"
    line_height: float = 1.5
    padding: str = Field(default="10px 0")
    show: bool = True
    background_color: str | None = None

    # Template de texto (HTML/Jinja2)
    text_template: str | None = Field(
        default=None,
        description="Template do endereçamento. Ex: 'Ao Ill∴ Ir∴ {{ destinatario }}'"
    )


class AssuntoConfig(BaseModel):
    """Assunto do documento (Ex: 'Assunto: Convocação para Sessão Magna')."""

    font_family: str | None = None
    font_size: str = Field(default="12pt")
    color: str | None = None
    bold: bool = True
    alignment: Literal["left", "center", "right"] = "left"
    line_height: float = 1.5
    padding: str = Field(default="5px 0")
    show: bool = True
    prefix: str = Field(default="Assunto: ", description="Prefixo antes do texto do assunto")
    background_color: str | None = None

    # Template de texto (HTML/Jinja2)
    text_template: str | None = Field(
        default=None,
        description="Template do assunto. Ex: '{{ assunto_texto }}'"
    )


class TextoConfig(BaseModel):
    """Corpo do texto do documento — estilo e template."""

    font_family: str | None = None
    font_size: str = Field(default="12pt")
    color: str | None = None
    background_color: str | None = None
    background_image: str | None = None
    bold: bool = False
    italic: bool = False
    alignment: Literal["left", "center", "right", "justify"] = "justify"
    line_height: float = 1.5
    spacing: str = Field(default="10px", description="Espaçamento entre parágrafos")
    padding_top: str = Field(default="0px")

    # Template de texto (HTML/Jinja2)
    text_template: str | None = Field(
        default=None,
        description="Template do corpo do texto com variáveis Jinja2"
    )


class LocalDataConfig(BaseModel):
    """Local e Data (Ex: 'Oriente de Brasília, 13 de março de 2026 da E∴V∴')."""

    font_family: str | None = None
    font_size: str = Field(default="12pt")
    color: str | None = None
    bold: bool = False
    alignment: Literal["left", "center", "right"] = "right"
    line_height: float = 1.5
    padding: str = Field(default="20px 0 10px 0")
    show: bool = True
    background_color: str | None = None

    # Template de texto (HTML/Jinja2)
    text_template: str | None = Field(
        default=None,
        description="Template da linha de local e data"
    )


class SignaturesConfig(BaseModel):
    """Assinaturas do documento."""

    font_family: str | None = None
    font_size: str = Field(default="11pt")
    color: str | None = None
    line_color: str = Field(default="#000000", description="Cor da linha de assinatura")
    spacing_top: str = Field(default="50px", description="Espaço acima das assinaturas")
    show_date: bool = Field(default=True, description="Mostrar cidade/data acima das assinaturas")
    alignment: Literal["left", "center", "right"] = "center"
    background_color: str | None = None

    # Template de texto (HTML/Jinja2)
    text_template: str | None = Field(
        default=None,
        description="Template HTML das assinaturas"
    )


class FooterConfig(BaseModel):
    """Rodapé da página: endereço da loja, afiliações, contagem de páginas."""

    font_size: str = Field(default="10pt")
    color: str | None = None
    background_color: str | None = None
    background_image: str | None = None
    spacing_top: str = Field(default="40px", description="Espaço acima do rodapé")
    alignment: Literal["left", "center", "right"] = "center"
    show_address: bool = Field(default=True, description="Mostrar endereço da loja")
    show_affiliations: bool = Field(default=False, description="Mostrar afiliações no rodapé")
    show_page_count: bool = Field(default=True, description="Mostrar contagem de páginas")

    # Template de texto (HTML/Jinja2)
    text_template: str | None = Field(
        default=None,
        description="Template HTML do rodapé"
    )


# =============================================================================
# COMPOSIÇÃO ESTRUTURAL DO DOCUMENTO
# Define quais elementos entram e em qual ordem.
# =============================================================================

class StructuralElement(BaseModel):
    """Define um elemento na composição do documento e sua posição."""

    key: str = Field(description="Chave do elemento: cabecalho_pagina, titulos, identificacao, enderecamento, assunto, texto, local_data, assinatura, rodape_pagina")
    enabled: bool = Field(default=True, description="Se o elemento está habilitado neste documento")
    order: int = Field(default=0, description="Posição na composição (menor = primeiro)")


# Composições padrão por tipo de documento
DEFAULT_ELEMENTS_BALAUSTRE: list[dict] = [
    {"key": "cabecalho_pagina", "enabled": True, "order": 0},
    {"key": "titulos", "enabled": True, "order": 1},
    {"key": "identificacao", "enabled": False, "order": 2},
    {"key": "enderecamento", "enabled": False, "order": 3},
    {"key": "assunto", "enabled": False, "order": 4},
    {"key": "texto", "enabled": True, "order": 5},
    {"key": "local_data", "enabled": True, "order": 6},
    {"key": "assinatura", "enabled": True, "order": 7},
    {"key": "rodape_pagina", "enabled": True, "order": 8},
]

DEFAULT_ELEMENTS_PRANCHA: list[dict] = [
    {"key": "cabecalho_pagina", "enabled": True, "order": 0},
    {"key": "titulos", "enabled": True, "order": 1},
    {"key": "identificacao", "enabled": True, "order": 2},
    {"key": "enderecamento", "enabled": True, "order": 3},
    {"key": "assunto", "enabled": True, "order": 4},
    {"key": "texto", "enabled": True, "order": 5},
    {"key": "local_data", "enabled": True, "order": 6},
    {"key": "assinatura", "enabled": True, "order": 7},
    {"key": "rodape_pagina", "enabled": True, "order": 8},
]

DEFAULT_ELEMENTS_CONVITE: list[dict] = [
    {"key": "cabecalho_pagina", "enabled": True, "order": 0},
    {"key": "titulos", "enabled": True, "order": 1},
    {"key": "identificacao", "enabled": False, "order": 2},
    {"key": "enderecamento", "enabled": False, "order": 3},
    {"key": "assunto", "enabled": False, "order": 4},
    {"key": "texto", "enabled": True, "order": 5},
    {"key": "local_data", "enabled": True, "order": 6},
    {"key": "assinatura", "enabled": True, "order": 7},
    {"key": "rodape_pagina", "enabled": True, "order": 8},
]

# Mapeamento tipo → composição padrão
DEFAULT_ELEMENTS_MAP: dict[str, list[dict]] = {
    "balaustre": DEFAULT_ELEMENTS_BALAUSTRE,
    "prancha": DEFAULT_ELEMENTS_PRANCHA,
    "edital": DEFAULT_ELEMENTS_PRANCHA,
    "convite": DEFAULT_ELEMENTS_CONVITE,
    "certificado": DEFAULT_ELEMENTS_CONVITE,
}


# =============================================================================
# CONFIGURAÇÕES CONSOLIDADAS POR TIPO DE DOCUMENTO
# Integra page, elementos ordenados e configs de cada elemento.
# =============================================================================

class DocumentStyles(BaseModel):
    """Configurações visuais consolidadas (compatibilidade com v1/v2 do frontend)."""

    page_size: str = Field(default="A4")
    orientation: Literal["portrait", "landscape"] = Field(default="portrait")
    page_margin: str = Field(default="1cm")
    font_family: str = Field(default="Arial, sans-serif")
    line_height: float = Field(default=1.5)
    primary_color: str = Field(default="#000000")
    show_border: bool = Field(default=True)
    border_style: str = Field(default="solid")
    content_layout: Literal["standard", "condensed"] = Field(default="standard")
    show_page_numbers: bool = Field(default=True)
    background_color: str = Field(default="#ffffff")
    background_image: str = Field(default="none")

    # Advanced
    page_padding: str = Field(default="0cm")
    border_width: str = Field(default="3px")
    border_color: str = Field(default="#000000")
    watermark_image: str = Field(default="")
    watermark_opacity: float = Field(default=0.1)

    # Configs de elementos (compatibilidade v1/v2)
    header_config: HeaderConfig = Field(default_factory=HeaderConfig)
    titles_config: TitlesConfig = Field(default_factory=TitlesConfig)
    content_config: TextoConfig = Field(default_factory=TextoConfig)
    signatures_config: SignaturesConfig = Field(default_factory=SignaturesConfig)
    footer_config: FooterConfig = Field(default_factory=FooterConfig)

    # Novos configs de elementos (v3)
    identificacao_config: IdentificacaoConfig = Field(default_factory=IdentificacaoConfig)
    enderecamento_config: EnderecamentoConfig = Field(default_factory=EnderecamentoConfig)
    assunto_config: AssuntoConfig = Field(default_factory=AssuntoConfig)
    local_data_config: LocalDataConfig = Field(default_factory=LocalDataConfig)


class ContentSettings(BaseModel):
    """Templates de conteúdo HTML/Jinja2 por seção (compatibilidade v2)."""

    header_template: str | None = None
    body_template: str | None = None
    footer_template: str | None = None
    signatures_template: str | None = None
    titles_template: str | None = None
    preamble_template: str | None = None
    date_place_template: str | None = None

    header_config: HeaderConfig = Field(default_factory=HeaderConfig)
    titles_config: TitlesConfig = Field(default_factory=TitlesConfig)
    content_config: TextoConfig = Field(default_factory=TextoConfig)
    signatures_config: SignaturesConfig = Field(default_factory=SignaturesConfig)
    footer_config: FooterConfig = Field(default_factory=FooterConfig)

    class Config:
        extra = "allow"


class DocumentTypeSettings(BaseModel):
    """
    Configuração completa de um tipo de documento.

    Usado nos 3 níveis:
    - Padronização (Global/Super Admin): define defaults para todos
    - Personalização (Instancial/Webmaster): sobrescreve por loja
    - Os templates de texto aqui servem como base para Adequação
    """

    # Templates de referência (legado — nomes de arquivo .html)
    header: str = Field(default="header_classico.html", description="Template parcial do cabeçalho")
    body: str = Field(default="template_padrao.html", description="Template do corpo")
    footer: str = Field(default="footer_padrao.html", description="Template do rodapé")

    # Templates de conteúdo HTML/Jinja2 personalizáveis
    content_template: str | None = Field(default=None)
    titles_template: str | None = Field(default=None)
    preamble_template: str | None = Field(default=None)
    signatures_template: str | None = Field(default=None)
    date_place_template: str | None = Field(default=None)
    header_template: str | None = Field(default=None)
    footer_template: str | None = Field(default=None)

    # Estilos visuais consolidados (v1/v2 compat)
    styles: DocumentStyles | None = Field(default_factory=DocumentStyles)

    # Schema v2
    page_settings: PageSettings | None = None
    content_settings: ContentSettings | None = None

    # ========================
    # Schema v3 — Composição Estrutural
    # ========================

    # Lista ordenada de elementos que compõem o documento
    structural_elements: list[StructuralElement] | None = Field(
        default=None,
        description="Elementos estruturais escolhidos e sua ordem de composição"
    )

    # Configs isoladas por elemento (v3 — novos elementos)
    identificacao_config: IdentificacaoConfig | None = None
    enderecamento_config: EnderecamentoConfig | None = None
    assunto_config: AssuntoConfig | None = None
    local_data_config: LocalDataConfig | None = None

    class Config:
        extra = "allow"


class DocumentSettings(BaseModel):
    """Contêiner de configurações de todos os tipos de documento de uma loja."""

    balaustre: DocumentTypeSettings = Field(default_factory=DocumentTypeSettings)
    prancha: DocumentTypeSettings = Field(default_factory=DocumentTypeSettings)
    edital: DocumentTypeSettings = Field(default_factory=DocumentTypeSettings)
    convite: DocumentTypeSettings = Field(default_factory=DocumentTypeSettings)
    certificado: DocumentTypeSettings = Field(default_factory=DocumentTypeSettings)

    class Config:
        extra = "ignore"
