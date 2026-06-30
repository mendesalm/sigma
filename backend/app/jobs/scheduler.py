from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
import logging

logger = logging.getLogger(__name__)

jobstores = {
    'default': MemoryJobStore()
}

scheduler = AsyncIOScheduler(jobstores=jobstores, timezone="America/Sao_Paulo")

def start_scheduler():
    from app.jobs.whatsapp_jobs import setup_whatsapp_jobs
    
    if not scheduler.running:
        setup_whatsapp_jobs(scheduler)
        scheduler.start()
        logger.info("APScheduler started successfully.")

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler shut down successfully.")
