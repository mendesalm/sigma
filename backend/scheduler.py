from datetime import date, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Importações do projeto
from database import SessionLocal
from models import models
from services import session_service, classified_service

# Cria uma instância do agendador que rodará com asyncio
scheduler = AsyncIOScheduler()


def check_and_start_sessions_job():
    """
    Esta é a tarefa que o agendador executará.
    Ela verifica por sessões que deveriam iniciar e as inicia.
    Também verifica sessões que devem ser encerradas.
    """
    print(f"[{datetime.now()}] Executando tarefa agendada: Verificando sessões...")
    db = SessionLocal()
    try:
        now = datetime.now()

        # 1. Iniciar Sessões
        relevant_dates = [date.today(), date.today() - timedelta(days=1)]
        sessions_to_start = (
            db.query(models.MasonicSession)
            .filter(models.MasonicSession.status == "AGENDADA", models.MasonicSession.session_date.in_(relevant_dates))
            .all()
        )

        for session in sessions_to_start:
            if not session.start_time:
                continue
            session_start_datetime = datetime.combine(session.session_date, session.start_time)
            two_hours_before_start = session_start_datetime - timedelta(hours=2)

            if two_hours_before_start <= now:
                print(f"Iniciando sessão agendada ID: {session.id} - {session.title}")
                session_service.start_scheduled_session(db, session.id)

        # 2. Encerrar Sessões
        sessions_to_close = (
            db.query(models.MasonicSession)
            .filter(models.MasonicSession.status == "EM_ANDAMENTO")
            .all()
        )

        for session in sessions_to_close:
             # Determine reference end time
             if session.end_time:
                 session_end_datetime = datetime.combine(session.session_date, session.end_time)
             elif session.start_time:
                 # Fallback: assume 2h duration if no end time set
                 session_end_datetime = datetime.combine(session.session_date, session.start_time) + timedelta(hours=2)
             else:
                 continue
            
             two_hours_after_end = session_end_datetime + timedelta(hours=2)
             
             if now >= two_hours_after_end:
                 print(f"Encerrando sessão ID: {session.id} - {session.title}")
                 session_service.close_scheduled_session(db, session.id)

    except Exception as e:
        print(f"Erro ao executar a tarefa agendada de sessões: {e}")
    finally:
        db.close()


def check_classifieds_lifecycle_job():
    """
    Tarefa agendada para gerenciar o ciclo de vida dos classificados.
    """
    print(f"[{datetime.now()}] Executando tarefa agendada: Limpeza de classificados...")
    db = SessionLocal()
    try:
        classified_service.cleanup_classifieds(db)
    except Exception as e:
        print(f"Erro ao executar a tarefa de classificados: {e}")
    finally:
        db.close()


def initialize_scheduler():
    """Inicializa o agendador e adiciona a tarefa."""
    # Adiciona a tarefa para ser executada a cada 5 minutos
    scheduler.add_job(check_and_start_sessions_job, "interval", minutes=5, id="check_sessions_job")
    scheduler.add_job(check_classifieds_lifecycle_job, "interval", hours=1, id="check_classifieds_job")
    if not scheduler.running:
        scheduler.start()
        print("Agendador de tarefas iniciado. A verificação de sessões será executada a cada 5 minutos.")


def shutdown_scheduler():
    """Desliga o agendador de forma limpa."""
    if scheduler.running:
        scheduler.shutdown()
        print("Agendador de tarefas desligado.")
