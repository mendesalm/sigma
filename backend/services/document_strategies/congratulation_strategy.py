from .base_strategy import DocumentStrategy
from sqlalchemy.orm import Session
from models import models
from fastapi import HTTPException
from datetime import date

class CongratulationStrategy(DocumentStrategy):
    
    def get_template_name(self) -> str:
        return "congratulation_template.html"

    def get_document_type_key(self) -> str:
        return "congratulation" # Need schema update eventually, will fallback to balaustre settings for now

    async def collect_data(self, db: Session, main_entity_id: int, **kwargs) -> dict:
        # main_entity_id could be member_id used for the card
        member_id = main_entity_id
        member = db.query(models.Member).filter(models.Member.id == member_id).first()
        
        # We need a lodge context. If member has a lodge, use it.
        # If external person, we might need lodge_id passed in kwargs.
        lodge_id = kwargs.get('lodge_id')
        if not lodge_id and member:
             lodge_id = member.lodge_id
             
        if not lodge_id:
             raise ValueError("Lodge ID required for Congratulation Card if Member has no Lodge or is external")

        lodge = db.query(models.Lodge).filter(models.Lodge.id == lodge_id).first()
        if not lodge:
             raise HTTPException(status_code=404, detail="Loja não encontrada.")
             
        obedience = db.query(models.Obedience).filter(models.Obedience.id == lodge.obedience_id).first()
        
        # Parse Settings
        from schemas.document_settings_schema import DocumentSettings
        doc_settings_raw = lodge.document_settings or {}
        try:
             validated_settings = DocumentSettings(**doc_settings_raw)
        except:
             validated_settings = DocumentSettings()
        
        context = self._get_common_context(lodge, validated_settings)

        # Custom Message overrides
        message = kwargs.get('custom_message') or "A Loja parabeniza o estimável Irmão por esta data tão significativa."
        title = kwargs.get('title') or "Felicitações"

        context.update({
            "lodge_logo": self.service._get_lodge_logo(lodge.id),
            "obedience_name": obedience.name if obedience else "",
            "recipient_name": member.full_name if member else kwargs.get('recipient_name', 'Prezado(a)'),
            "card_title": title,
            "card_message": message,
            "date_str": date.today().strftime("%d/%m/%Y"),
            "venerable_name": kwargs.get('venerable_name') or "Venerável Mestre",
        })
        
        return context
