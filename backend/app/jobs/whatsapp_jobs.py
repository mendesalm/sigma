import logging
from datetime import date, timedelta
from app.database import SessionLocal
from app.modules.core.models import Lodge
from app.modules.members.models import Member
from app.modules.sessions.models import MasonicSession
from app.modules.sessions.services.session_service import get_presence_forecast
from app.modules.communication.services.evolution_client import evolution_client
from app.shared.tenant_context import TenantContextManager

logger = logging.getLogger(__name__)

async def run_birthday_notifications():
    """
    Executa todos os dias às 08:00.
    Encontra membros que fazem aniversário hoje, e cuja loja permite notificações.
    Envia uma mensagem de parabéns via Evolution API.
    """
    logger.info("Executando job: run_birthday_notifications")
    today = date.today()
    
    db = SessionLocal()
    try:
        # Encontra membros cujo mês e dia de nascimento batem com hoje
        # Extrai mês e dia
        members = db.query(Member).join(Lodge, Member.lodge_id == Lodge.id).filter(
            db.func.extract('month', Member.birth_date) == today.month,
            db.func.extract('day', Member.birth_date) == today.day,
            Lodge.is_active == True,
            Lodge.whatsapp_notifications_enabled == True,
            Member.phone != None
        ).all()
        
        for member in members:
            phone_full = member.phone # assumed to be E.164 without @s.whatsapp.net
            remote_jid = f"{phone_full}@s.whatsapp.net"
            
            first_name = member.full_name.split(" ")[0]
            message = (
                f"🎉 Parabéns, Irmão {first_name}!\n\n"
                f"A ARLS {member.lodge.lodge_name} te deseja um feliz aniversário! "
                f"Muita saúde, paz e sucesso no seu novo ciclo. Tfa! 📐"
            )
            
            # Enviar via evolution_client (await manual na coroutine)
            await evolution_client.send_message(remote_jid, message)
            logger.info(f"Mensagem de aniversário enviada para {first_name} ({phone_full})")
            
    except Exception as e:
        logger.error(f"Erro no job run_birthday_notifications: {e}")
    finally:
        db.close()


async def run_session_bumps():
    """
    Executa às 10h, 14h, e 18h.
    Encontra sessões nos próximos 4 dias, em lojas que têm notificações habilitadas.
    """
    logger.info("Executando job: run_session_bumps")
    today = date.today()
    max_date = today + timedelta(days=4)
    
    db = SessionLocal()
    try:
        sessions = db.query(MasonicSession).join(Lodge, MasonicSession.lodge_id == Lodge.id).filter(
            MasonicSession.session_date >= today,
            MasonicSession.session_date <= max_date,
            MasonicSession.status == "AGENDADA",
            Lodge.is_active == True,
            Lodge.whatsapp_notifications_enabled == True,
            Lodge.whatsapp_group_id != None
        ).all()
        
        for session in sessions:
            days_until = (session.session_date - today).days
            
            # O bump só dispara dependendo do days_until e da hora atual
            # Se for hoje (days_until == 0), só dispara o bump das 10h.
            # Aqui não temos como saber a hora do cron a menos que injetemos,
            # ou simplesmente vamos checar a hora atual do sistema.
            from datetime import datetime
            current_hour = datetime.now().hour
            
            if days_until == 0 and current_hour >= 12:
                # No dia da sessão (days_until=0), não mandar bumps depois do meio-dia (14h e 18h pulados)
                continue
                
            # Ativa TenantContext apenas para calcular a previsão corretamente, se o service exigir (embora get_presence_forecast não use TenantContext estritamente, é boa prática)
            TenantContextManager.set_lodge_id(session.lodge_id)
            
            try:
                forecast = get_presence_forecast(db, session.id)
                confirmed_masons = forecast['confirmed_members'] + forecast['confirmed_visitors']
                confirmed_guests = forecast['confirmed_guests']
                
                date_str = session.session_date.strftime("%d/%m/%Y")
                time_str = session.start_time.strftime("%H:%M") if session.start_time else ""
                
                msg = (
                    f"⚠️ *Lembrete de Sessão*\n\n"
                    f"Irmãos, nossa próxima sessão será dia {date_str} às {time_str}.\n\n"
                    f"Até o momento, temos *{confirmed_masons} maçons* e *{confirmed_guests} acompanhantes* confirmados.\n\n"
                    f"Confirme sua presença respondendo com `#VOU` (Se for levar acompanhantes, responda com o número, ex: `#VOU +1`)."
                )
                
                group_jid = session.lodge.whatsapp_group_id
                # O ID pode já estar no formato @g.us
                if not group_jid.endswith("@g.us"):
                    group_jid = f"{group_jid}@g.us"
                    
                await evolution_client.send_message(group_jid, msg)
                logger.info(f"Bump enviado para a Loja {session.lodge.id} (Sessão {session.id})")
                
            finally:
                TenantContextManager.set_lodge_id(None)
                
    except Exception as e:
        logger.error(f"Erro no job run_session_bumps: {e}")
    finally:
        db.close()


def setup_whatsapp_jobs(scheduler):
    # Aniversários todo dia às 08:00
    scheduler.add_job(
        run_birthday_notifications, 
        'cron', 
        hour=8, 
        minute=0, 
        id="birthday_notifications",
        replace_existing=True
    )
    
    # Bumps todo dia às 10:00, 14:00, 18:00
    scheduler.add_job(
        run_session_bumps,
        'cron',
        hour="10,14,18",
        minute=0,
        id="session_bumps",
        replace_existing=True
    )
