from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.shared.tenant_context import _tenant_lodge_id, _tenant_obedience_id

class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware para garantir o isolamento total dos ContextVars (Multitenancy).
    Embora o FastAPI inicie uma nova Task asyncio por request (que naturalmente isola o ContextVar),
    thread pools e integrações profundas podem reutilizar threads e vazar contexto.
    Isso força o reset e garante 100% de segurança no isolamento.
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        # Define os context vars como None para o request atual
        token_lodge = _tenant_lodge_id.set(None)
        token_obedience = _tenant_obedience_id.set(None)
        
        try:
            # Continua o fluxo normal do FastAPI
            response = await call_next(request)
            return response
        finally:
            # Reseta os valores ao terminar o request, limpando o contexto
            _tenant_lodge_id.reset(token_lodge)
            _tenant_obedience_id.reset(token_obedience)
