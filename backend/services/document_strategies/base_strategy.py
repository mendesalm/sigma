from abc import ABC, abstractmethod
from typing import Dict, Any
from sqlalchemy.orm import Session
from models import models
from schemas.document_settings_schema import DocumentSettings


class DocumentStrategy(ABC):
    """
    Abstract Base Class for Document Generation Strategies.
    Defines the contract for collecting data, selecting templates, and rendering content.
    """

    def __init__(self, service):
        self.service = service # Reference to the main service for helper methods (utils)

    @abstractmethod
    async def collect_data(self, db: Session, main_entity_id: int, **kwargs) -> Dict[str, Any]:
        """
        Collects all necessary data for the document type from the database.
        :param db: Database session
        :param main_entity_id: ID of the primary entity (Session ID, Member ID, etc.)
        :return: Dictionary with context data for Jinja2
        """
        pass

    @abstractmethod
    def get_template_name(self) -> str:
        """Returns the Jinja2 template filename."""
        pass

    @abstractmethod
    def get_document_type_key(self) -> str:
        """Returns the key used in DocumentSettings (e.g., 'balaustre', 'prancha')."""
        pass

    def _get_common_context(self, lodge: models.Lodge, doc_settings: DocumentSettings) -> Dict[str, Any]:
        """
        Helper to extract common style/header data derived from DocumentSettings.
        """
        key = self.get_document_type_key()
        type_settings = getattr(doc_settings, key, doc_settings.balaustre) # Default fallback

        # Styles
        styles = type_settings.styles.model_dump()
        
        # Header
        header_map = {
            'header_classico.html': 'partials/header_classico.html',
            'header_moderno.html': 'partials/header_moderno.html',
            'header_duplo.html': 'partials/header_duplo.html',
            'header_grid.html': 'partials/header_grid.html',
        }
        
        header_template = None
        if type_settings.header and type_settings.header != 'no_header':
             header_template = header_map.get(type_settings.header, 'partials/header_classico.html')

        return {
            "styles": styles,
            "header_template": header_template,
            "lodge_name": lodge.lodge_name,
            "lodge_number": lodge.lodge_number,
            "lodge_title_formatted": lodge.lodge_title or "A∴R∴B∴L∴S∴",
            # Common footer assets could go here
        }
