from .prancha_strategy import PranchaStrategy

class EditalStrategy(PranchaStrategy):
    
    def get_document_type_key(self) -> str:
        return "edital"

    # Reuse get_structure from Prancha unless specified otherwise.
    # Usually Edital follows Prancha structure but with different Title content.
    pass
