import logging
from datetime import date, timedelta, datetime
from database import SessionLocal
from app.modules.core.models import Lodge
from app.modules.members.models import Member
from app.modules.sessions.models import MasonicSession
from app.modules.sessions.services.session_service import get_presence_forecast
from app.modules.communication.services.evolution_client import evolution_client
from app.shared.tenant_context import TenantContextManager

logger = logging.getLogger(__name__)

DEFAULT_WHATSAPP_SETTINGS = {
    "birthdays": {
        "enabled": True,
        "time": "08:00",
        "message_template": "🎉 Parabéns, Irmão {first_name}!\n\nA ARLS {lodge_name} te deseja um feliz aniversário! Muita saúde, paz e sucesso no seu novo ciclo. Tfa! 📐"
    },
    "session_bumps": {
        "enabled": True,
        "days_before": [4, 3, 2, 1],
        "times": ["10:00", "14:00", "18:00"],
        "day_of_session_times": ["10:00"],
        "message_template": "⚠️ *Lembrete de Sessão*\n\nIrmãos, nossa próxima sessão será dia {date} às {time}.\n\nAté o momento, temos *{confirmed_masons} maçons* e *{confirmed_guests} acompanhantes* confirmados.\n\nConfirme sua presença respondendo com `#VOU` (Se for levar acompanhantes, responda com o número, ex: `#VOU +1`)."
    }
}

def round_time_to_nearest_interval(dt: datetime, interval_minutes: int = 30) -> str:
    """Arredonda a hora para string HH:MM de acordo com o intervalo, ex: 14:00, 14:30"""
    minute = (dt.minute // interval_minutes) * interval_minutes
    return f"{dt.hour:02d}:{minute:02d}"

async def process_birthdays(db, lodge: Lodge, settings: dict, current_time_str: str, today: date):
    b_settings = settings.get("birthdays", {})
    if not b_settings.get("enabled"):
        return
        
    target_time = b_settings.get("time")
    if target_time != current_time_str:
        return
        
    members = db.query(Member).filter(
        Member.lodge_id == lodge.id,
        db.func.extract('month', Member.birth_date) == today.month,
        db.func.extract('day', Member.birth_date) == today.day,
        Member.phone != None
    ).all()
    
    template = b_settings.get("message_template", DEFAULT_WHATSAPP_SETTINGS["birthdays"]["message_template"])
    
    for member in members:
        phone_full = member.phone
        remote_jid = f"{phone_full}@s.whatsapp.net"
        first_name = member.full_name.split(" ")[0]
        
        msg = template.replace("{first_name}", first_name).replace("{lodge_name}", lodge.lodge_name)
        await evolution_client.send_message(remote_jid, msg)
        logger.info(f"Mensagem de aniversário enviada para {first_name} ({phone_full}) via SaaS Config")

async def process_session_bumps(db, lodge: Lodge, settings: dict, current_time_str: str, today: date):
    sb_settings = settings.get("session_bumps", {})
    if not sb_settings.get("enabled") or not lodge.whatsapp_group_id:
        return
        
    days_before = sb_settings.get("days_before", [])
    times = sb_settings.get("times", [])
    day_of_session_times = sb_settings.get("day_of_session_times", [])
    
    # max_days para a query de sessões
    max_days = max(days_before) if days_before else 0
    max_date = today + timedelta(days=max_days)
    
    sessions = db.query(MasonicSession).filter(
        MasonicSession.lodge_id == lodge.id,
        MasonicSession.session_date >= today,
        MasonicSession.session_date <= max_date,
        MasonicSession.status == "AGENDADA"
    ).all()
    
    template = sb_settings.get("message_template", DEFAULT_WHATSAPP_SETTINGS["session_bumps"]["message_template"])
    
    for session in sessions:
        days_until = (session.session_date - today).days
        
        should_send = False
        if days_until == 0:
            if current_time_str in day_of_session_times:
                should_send = True
        elif days_until in days_before:
            if current_time_str in times:
                should_send = True
                
        if should_send:
            TenantContextManager.set_lodge_id(session.lodge_id)
            try:
                forecast = get_presence_forecast(db, session.id)
                confirmed_masons = forecast['confirmed_members'] + forecast['confirmed_visitors']
                confirmed_guests = forecast['confirmed_guests']
                
                date_str = session.session_date.strftime("%d/%m/%Y")
                time_str = session.start_time.strftime("%H:%M") if session.start_time else ""
                
                msg = template.replace("{date}", date_str)\
                              .replace("{time}", time_str)\
                              .replace("{confirmed_masons}", str(confirmed_masons))\
                              .replace("{confirmed_guests}", str(confirmed_guests))
                
                group_jid = lodge.whatsapp_group_id
                if not group_jid.endswith("@g.us"):
                    group_jid = f"{group_jid}@g.us"
                    
                await evolution_client.send_message(group_jid, msg)
                logger.info(f"Bump SaaS enviado para a Loja {lodge.id} (Sessão {session.id}) às {current_time_str}")
            finally:
                TenantContextManager.set_lodge_id(None)


async def poll_whatsapp_jobs():
    """
    Master Polling Job: Executado a cada 30 minutos.
    Varre as lojas com whatsapp_notifications_enabled e dispara os jobs granulares de acordo com whatsapp_settings.
    """
    now = datetime.now()
    current_time_str = round_time_to_nearest_interval(now, 30)
    today = now.date()
    logger.info(f"Executando poll_whatsapp_jobs para o horário base: {current_time_str}")
    
    db = SessionLocal()
    try:
        lodges = db.query(Lodge).filter(
            Lodge.is_active == True,
            Lodge.whatsapp_notifications_enabled == True
        ).all()
        
        for lodge in lodges:
            # Usa o JSON da Loja ou o Default se estiver vazio
            settings = lodge.whatsapp_settings or DEFAULT_WHATSAPP_SETTINGS
            
            # Aniversários
            await process_birthdays(db, lodge, settings, current_time_str, today)
            
            # Sessões (Bumps)
            await process_session_bumps(db, lodge, settings, current_time_str, today)
            
    except Exception as e:
        logger.error(f"Erro no poll_whatsapp_jobs: {e}")
    finally:
        db.close()


def setup_whatsapp_jobs(scheduler):
    # Roda a cada meia hora (00 e 30) para permitir que as lojas escolham horários em blocos de 30 minutos
    scheduler.add_job(
        poll_whatsapp_jobs,
        'cron',
        minute="0,30",
        id="master_whatsapp_poller",
        replace_existing=True
    )
