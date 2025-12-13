from .base_strategy import DocumentStrategy
from sqlalchemy.orm import Session
from models import models
from fastapi import HTTPException
from datetime import date

class InvitationStrategy(DocumentStrategy):
    
    def get_template_name(self) -> str:
        return "invitation_template.html"

    def get_document_type_key(self) -> str:
        return "invitation"

    async def collect_data(self, db: Session, main_entity_id: int, **kwargs) -> dict:
        # main_entity_id is the Session ID (the event)
        session = db.query(models.MasonicSession).filter(models.MasonicSession.id == main_entity_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada.")
            
        lodge = db.query(models.Lodge).filter(models.Lodge.id == session.lodge_id).first()
        obedience = db.query(models.Obedience).filter(models.Obedience.id == lodge.obedience_id).first()
        
        # Parse Settings
        from schemas.document_settings_schema import DocumentSettings
        doc_settings_raw = lodge.document_settings or {}
        try:
             validated_settings = DocumentSettings(**doc_settings_raw)
        except:
             validated_settings = DocumentSettings()
        
        context = self._get_common_context(lodge, validated_settings)

        # Date formatting
        months_pt = {1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril", 5: "maio", 6: "junho", 7: "julho", 8: "agosto", 9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"}
        
        day = session.session_date.day
        month = months_pt[session.session_date.month]
        year = session.session_date.year
        
        session_time = session.start_time.strftime("%H:%M") if session.start_time else "20:00"

        context.update({
            "lodge_logo": self.service._get_lodge_logo(lodge.id),
            "obedience_name": obedience.name if obedience else "",
            "event_title": session.title or "Sessão Magna",
            "event_type": session.type.value if session.type else "Sessão",
            "event_date_full": f"{day} de {month} de {year}",
            "event_time": session_time,
            "event_address": self.service._format_full_address(lodge),
            "invite_message": kwargs.get('custom_message') or "O Venerável Mestre e os Obreiros desta Loja têm a honra de convidar Vossa Senhoria e Família para...",
            "generation_date": date.today().strftime("%d/%m/%Y"),
        })
        
        return context
