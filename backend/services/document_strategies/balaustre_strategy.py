from .base_strategy import DocumentStrategy
from sqlalchemy.orm import Session
from models import models
from fastapi import HTTPException, status
from datetime import date

class BalaustreStrategy(DocumentStrategy):
    
    def get_template_name(self) -> str:
        return "balaustre_template.html"

    def get_document_type_key(self) -> str:
        return "balaustre"

    async def collect_data(self, db: Session, session_id: int, **kwargs) -> dict:
        session = db.query(models.MasonicSession).filter(models.MasonicSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Sessão não encontrada.")
            
        lodge = db.query(models.Lodge).filter(models.Lodge.id == session.lodge_id).first()
        obedience = db.query(models.Obedience).filter(models.Obedience.id == lodge.obedience_id).first()

        # Parse Settings
        doc_settings_raw = lodge.document_settings or {}
        # We handle validation in the Base or Service invocation, but let's assume valid object passed or parse here
        # Ideally, we pass the parsed settings object to collect_data or parse it here
        from schemas.document_settings_schema import DocumentSettings
        try:
             validated_settings = DocumentSettings(**doc_settings_raw)
        except:
             validated_settings = DocumentSettings()
             
        context = self._get_common_context(lodge, validated_settings)

        # Logic specific to Balaustre (Attendance, Officers, etc.)
        # Reusing the logic from original service but cleaner
        officers = self.service.get_lodge_officers_at_date(db, lodge.id, session.session_date)
        
        # ... (Huge block of logic for 'balaustre' specifics like Tronco, Palavra, etc.)
        # adapting the logic from original _collect_session_data
        
        months_pt = {1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril", 5: "maio", 6: "junho", 7: "julho", 8: "agosto", 9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"}
        day = session.session_date.day
        month = months_pt[session.session_date.month]
        year = session.session_date.year
        session_date_full = f"{day} de {month} de {year}"

        # Populate context
        context.update({
            "DiaSessao": session_date_full,
            "HoraInicioSessao": session.start_time.strftime("%H:%M") if session.start_time else "--:--",
            "session_number": session.session_number or "_______",
            "exercicio_maconico": "2024/2025", # TODO: Dynamic
            "session_title_formatted": session.title.upper(),
            "Veneravel": officers.get("Venerável Mestre") or "___________________",
            "SecretarioNome": officers.get("Secretário") or "___________________",
            "Orador": officers.get("Orador") or "___________________",
            # ... Add other necessary fields
            "lodge_address": self.service._format_full_address(lodge),
            "obedience_name": obedience.name if obedience else "",
            "cidade_loja": lodge.city,
            "data_assinatura": session_date_full,
            "header_image": self.service._get_lodge_logo(lodge.id),
        })

        # Add custom text if passed in kwargs (for preview/regeneration)
        if kwargs.get('custom_text'):
             context['custom_text'] = kwargs['custom_text']

        return context
