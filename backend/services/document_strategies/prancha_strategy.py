from .base_strategy import DocumentStrategy
from sqlalchemy.orm import Session
from models import models
from fastapi import HTTPException
from datetime import date

class PranchaStrategy(DocumentStrategy):
    
    def get_template_name(self) -> str:
        return "edital_template.html"

    def get_document_type_key(self) -> str:
        return "prancha"

    async def collect_data(self, db: Session, session_id: int, **kwargs) -> dict:
        session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
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
        
        # Specific Prancha Data
        months_pt = {1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril", 5: "maio", 6: "junho", 7: "julho", 8: "agosto", 9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"}
        day = session.session_date.day
        month = months_pt[session.session_date.month]
        year = session.session_date.year
        session_date_full = f"{day} de {month} de {year}"
        
        officers = self.service.get_lodge_officers_at_date(db, lodge.id, session.session_date)

        context.update({
            "DiaSessao": session_date_full,
            "HibernateData": session_date_full,
            "session_type": session.type.value if session.type else "SESSÃO",
            "session_title": session.title,
            "lodge_address": self.service._format_full_address(lodge),
            "OrdemDia": session.agenda or "Não informada.",
            "HoraInicioSessao": session.start_time.strftime("%H:%M") if session.start_time else "--:--",
            "DataAssinatura": date.today().strftime("%d of %B of %Y"), # Can be formatted better
            "CidadeLoja": lodge.city,
            "Veneravel": officers.get("Venerável Mestre") or "___________________",
            "SecretarioNome": officers.get("Secretário") or "___________________",
            "ObrigatoriedadeTraje": "Passeio Completo (ou conforme Rito)", # Can be in kwargs or session
            "DataSessaoExtenso": session_date_full,
        })
        
        if kwargs.get('custom_text'):
             context['custom_text'] = kwargs['custom_text']
             
        return context
