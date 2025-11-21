from datetime import date, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

# Importações do projeto
from .database import SessionLocal
from .services import session_service
from .models import models

# Cria uma instância do agendador que rodará com asyncio
scheduler = AsyncIOScheduler()

def check_and_start_sessions_job():
    """
    Esta é a tarefa que o agendador executará.
    Ela verifica por sessões que deveriam iniciar e as inicia.
    """
    print(f"[{datetime.now()}] Executando tarefa agendada: Verificando sessões para iniciar...")
    db = SessionLocal()
    try:
        now = datetime.now()

        # Busca por sessões agendadas para hoje ou ontem (para pegar casos de madrugada)
        relevant_dates = [date.today(), date.today() - timedelta(days=1)]

        sessions_to_check = db.query(models.MasonicSession).filter(
            models.MasonicSession.status == 'AGENDADA',
            models.MasonicSession.session_date.in_(relevant_dates)
        ).all()

        if not sessions_to_check:
            print("Nenhuma sessão candidata para iniciar no momento.")
            return

        for session in sessions_to_check:
            if not session.start_time:
                continue

            # Combina a data da sessão com a hora de início para ter um datetime completo
            session_start_datetime = datetime.combine(session.session_date, session.start_time)

            # Define o limite de 2 horas antes para iniciar
            two_hours_before_start = session_start_datetime - timedelta(hours=2)

            # Verifica se a hora atual está dentro da janela de "auto-start"
            if two_hours_before_start <= now:
                print(f"Iniciando sessão agendada ID: {session.id} - {session.title}")
                session_service.start_scheduled_session(db, session.id)

    except Exception as e:
        print(f"Erro ao executar a tarefa agendada de sessões: {e}")
    finally:
        db.close()

def initialize_scheduler():
    """Inicializa o agendador e adiciona a tarefa."""
    # Adiciona a tarefa para ser executada a cada 5 minutos
    scheduler.add_job(check_and_start_sessions_job, 'interval', minutes=5, id="check_sessions_job")
    if not scheduler.running:
        scheduler.start()
        print("Agendador de tarefas iniciado. A verificação de sessões será executada a cada 5 minutos.")

def shutdown_scheduler():
    """Desliga o agendador de forma limpa."""
    if scheduler.running:
        scheduler.shutdown()
        print("Agendador de tarefas desligado.")

