from .base_strategy import DocumentStrategy
from sqlalchemy.orm import Session
from models import models
from fastapi import HTTPException
from datetime import date

class CertificateStrategy(DocumentStrategy):
    
    def get_template_name(self) -> str:
        return "certificate_template.html"

    def get_document_type_key(self) -> str:
        return "convite" # Using 'convite' slot for certificates as requested previously

    async def collect_data(self, db: Session, main_entity_id: int, **kwargs) -> dict:
        # main_entity_id here acts as Session ID, but we need Member ID too
        # kwargs MUST contain 'member_id'
        member_id = kwargs.get('member_id')
        if not member_id:
             raise ValueError("member_id required for CertificateStrategy")

        session = db.query(models.MasonicSession).filter(models.MasonicSession.id == main_entity_id).first()
        member = db.query(models.Member).filter(models.Member.id == member_id).first()
        
        if not session or not member:
            raise HTTPException(status_code=404, detail="Sessão ou Membro não encontrados.")
            
        lodge = db.query(models.Lodge).filter(models.Lodge.id == session.lodge_id).first()
        obedience = db.query(models.Obedience).filter(models.Obedience.id == lodge.obedience_id).first()
        
        # Parse Settings
        from schemas.document_settings_schema import DocumentSettings
        doc_settings_raw = lodge.document_settings or {}
        try:
             validated_settings = DocumentSettings(**doc_settings_raw)
        except:
             validated_settings = DocumentSettings()

        # Custom logic for Certificate Orientation override check could go here
        
        context = self._get_common_context(lodge, validated_settings)

        # Date formatting
        months_pt = {1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril", 5: "maio", 6: "junho", 7: "julho", 8: "agosto", 9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"}
        day = session.session_date.day
        month = months_pt[session.session_date.month]
        year = session.session_date.year
        session_date_full = f"{day} de {month} de {year}"

        context.update({
            "lodge_logo": self.service._get_lodge_logo(lodge.id),
            "obedience_name": obedience.name if obedience else "",
            "member_name": member.full_name,
            "session_type": session.type.value if session.type else "Sessão",
            "session_subtype": session.subtype.value if session.subtype else "",
            "session_date": session_date_full,
            "generation_date": date.today().strftime("%d/%m/%Y"),
            "lodge_id": lodge.id,
        })
        
        # Validation codes injected later by the service logic (signature/qr)
        
        return context
