from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database import get_db
from app.modules.core.models import Lodge
from app.shared.tenant_context import TenantContextManager
from app.modules.communication.services.evolution_client import evolution_client
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/whatsapp", tags=["WhatsApp"])

@router.post("")
async def receive_whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Recebe webhooks da Evolution API.
    Apenas processa mensagens novas em grupos vinculados a uma Loja.
    """
    payload = await request.json()
    logger.debug(f"Webhook WhatsApp Recebido: {payload}")
    
    # Valida formato esperado
    if not isinstance(payload, dict) or "event" not in payload:
        return {"status": "ignored"}
        
    # Processa apenas mensagens novas
    if payload["event"] != "messages.upsert":
        return {"status": "ignored"}
        
    data = payload.get("data", {})
    message = data.get("message", {})
    key = data.get("key", {})
    
    # Processar apenas de grupos
    remote_jid = key.get("remoteJid", "")
    if not remote_jid.endswith("@g.us"):
        return {"status": "ignored", "reason": "Not a group message"}
        
    # Verificar de quem veio
    participant = key.get("participant", "")
    if not participant:
        return {"status": "ignored", "reason": "Unknown sender"}
        
    # Extrair texto da mensagem
    text = ""
    if "conversation" in message:
        text = message["conversation"]
    elif "extendedTextMessage" in message:
        text = message["extendedTextMessage"].get("text", "")
        
    if not text:
        return {"status": "ignored", "reason": "Empty message"}
        
    # Import needed models
    from app.modules.sessions.models import MasonicSession, SessionAttendance
    from app.modules.sessions.services.session_service import get_presence_forecast
    from app.modules.members.models import Member
    from datetime import date
    import re
    
    # Text normalization
    text_upper = text.upper().strip()
    
    # 1. Verifica se é comando de PREVISÃO (#AGENDA JANTAR)
    agenda_match = re.search(r"^#\s*agenda", text_upper)
    
    # 2. Verifica se é comando de PRESENÇA (#VOU)
    vou_match = re.search(r"^#\s*vou\s*(?:\+\s*(\d+))?", text_upper)
    
    if not (agenda_match or vou_match):
        return {"status": "ignored", "reason": "Not a recognized command"}
        
    # === Encontrar a Loja associada a este grupo ===
    lodge = db.query(Lodge).filter(
        (Lodge.whatsapp_group_id == remote_jid) |
        (Lodge.whatsapp_group_id == remote_jid.replace("@g.us", ""))
    ).first()
    
    if not lodge:
        logger.warning(f"Mensagem recebida do grupo {remote_jid}, mas não está vinculado a nenhuma Loja.")
        return {"status": "ignored", "reason": "Unregistered group"}
        
    # Ativa o contexto Multi-tenant para a Loja atual
    TenantContextManager.set_lodge_id(lodge.id)
    
    try:
        sender_phone_full = participant.split("@")[0] # ex: 5511999999999
        sender_phone_display = sender_phone_full[2:] if sender_phone_full.startswith("55") and len(sender_phone_full) >= 12 else sender_phone_full
        
        # Encontrar a PRÓXIMA SESSÃO
        next_session = db.query(MasonicSession).filter(
            MasonicSession.lodge_id == lodge.id,
            MasonicSession.session_date >= date.today()
        ).order_by(MasonicSession.session_date.asc()).first()
        
        if not next_session:
            return {"status": "ignored", "reason": "No upcoming session found"}

        message_id = key.get("id")

        if agenda_match:
            # Comando #AGENDA JANTAR
            forecast = get_presence_forecast(db, next_session.id)
            reply_text = (
                f"📊 *Previsão para o Jantar* (Sessão de {next_session.session_date.strftime('%d/%m/%Y')}):\n\n"
                f"🤵 Maçons confirmados: {forecast['confirmed_members'] + forecast['confirmed_visitors']}\n"
                f"👨‍👩‍👧 Acompanhantes: {forecast['confirmed_guests']}\n"
                f"Total esperado: *{forecast['total_expected']} pessoas*"
            )
            
            await evolution_client.reply_message(
                remote_jid=remote_jid,
                text=reply_text,
                message_id=message_id
            )
            return {"status": "success", "action": "agenda"}

        elif vou_match:
            # Comando #VOU
            guests_str = vou_match.group(1)
            guests_count = int(guests_str) if guests_str else 0
            
            # Localizar o membro pelo telefone
            member = db.query(Member).filter(Member.phone == sender_phone_full).first()
            if not member:
                # Se não achar por 55, tenta sem o 55
                member = db.query(Member).filter(Member.phone.like(f"%{sender_phone_display}%")).first()
                
            if member:
                # Upsert na tabela de presenças
                attendance = db.query(SessionAttendance).filter(
                    SessionAttendance.session_id == next_session.id,
                    SessionAttendance.member_id == member.id
                ).first()
                
                if attendance:
                    attendance.attendance_status = "Confirmado"
                    attendance.guests_count = guests_count
                else:
                    attendance = SessionAttendance(
                        session_id=next_session.id,
                        member_id=member.id,
                        attendance_status="Confirmado",
                        guests_count=guests_count
                    )
                    db.add(attendance)
                
                db.commit()
            
            guest_text = f" com {guests_count} acompanhante(s)" if guests_count > 0 else ""
            reply_text = f"@{sender_phone_full} confirmando o registro da sua participação{guest_text} na próxima sessão ({next_session.session_date.strftime('%d/%m/%Y')})! ✅"
            
            await evolution_client.reply_message(
                remote_jid=remote_jid,
                text=reply_text,
                message_id=message_id,
                mentions=[participant]
            )
            return {"status": "success", "action": "presence"}

    except Exception as e:
        logger.error(f"Erro processando mensagem do WhatsApp: {e}")
        db.rollback()
        return {"status": "error"}
    finally:
        # Limpar contexto
        TenantContextManager.set_lodge_id(None)

