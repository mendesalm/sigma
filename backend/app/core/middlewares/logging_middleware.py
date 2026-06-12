import uuid
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logger import trace_id_var, logger

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware responsável por interceptar todas as requisições,
    gerar um Trace ID único e medir o tempo de execução.
    """
    async def dispatch(self, request: Request, call_next):
        # Gerar um ID único para rastrear esta requisição do início ao fim
        trace_id = str(uuid.uuid4())
        
        # Injetar na variável de contexto
        token = trace_id_var.set(trace_id)
        
        start_time = time.time()
        
        try:
            logger.info("Requisição recebida", extra={"extra_data": {"method": request.method, "path": request.url.path}})
            
            response = await call_next(request)
            
            process_time = time.time() - start_time
            logger.info("Requisição finalizada", extra={"extra_data": {"status_code": response.status_code, "process_time_ms": round(process_time * 1000, 2)}})
            
            # Adicionar trace_id nos headers da resposta (opcional, útil para o frontend debugar)
            response.headers["X-Trace-ID"] = trace_id
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"Erro interno durante requisição: {str(e)}", exc_info=True, extra={"extra_data": {"process_time_ms": round(process_time * 1000, 2)}})
            raise
        finally:
            # Limpar o contexto (boa prática)
            trace_id_var.reset(token)
