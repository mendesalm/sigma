import contextvars

# Context variables to hold the current tenant's context during a request lifecycle
_tenant_lodge_id: contextvars.ContextVar[int | None] = contextvars.ContextVar("tenant_lodge_id", default=None)
_tenant_obedience_id: contextvars.ContextVar[int | None] = contextvars.ContextVar("tenant_obedience_id", default=None)


class TenantContextManager:
    @staticmethod
    def set_lodge_id(lodge_id: int | None):
        """Sets the current lodge_id in the contextvar and returns a token"""
        return _tenant_lodge_id.set(lodge_id)

    @staticmethod
    def get_lodge_id() -> int | None:
        """Gets the current lodge_id from the contextvar"""
        return _tenant_lodge_id.get()

    @staticmethod
    def reset_lodge_id(token):
        """Resets the lodge_id contextvar using the token"""
        _tenant_lodge_id.reset(token)

    @staticmethod
    def set_obedience_id(obedience_id: int | None):
        """Sets the current obedience_id in the contextvar and returns a token"""
        return _tenant_obedience_id.set(obedience_id)

    @staticmethod
    def get_obedience_id() -> int | None:
        """Gets the current obedience_id from the contextvar"""
        return _tenant_obedience_id.get()

    @staticmethod
    def reset_obedience_id(token):
        """Resets the obedience_id contextvar using the token"""
        _tenant_obedience_id.reset(token)

    @classmethod
    def get_accessible_lodges(cls, db) -> list[int] | None:
        """
        Retorna uma lista de IDs de lojas que o tenant atual pode acessar.
        - Se for Loja, retorna [lodge_id].
        - Se for Obediência, retorna os IDs de todas as Lojas subordinadas (direta e indiretamente).
        - Se for Super Admin (nem loja nem obediência no contexto), retorna None (permitir todas).
        """
        lodge_id = cls.get_lodge_id()
        if lodge_id:
            return [lodge_id]

        obedience_id = cls.get_obedience_id()
        if obedience_id:
            from app.modules.core.services.obedience_service import get_all_subordinate_lodges
            return get_all_subordinate_lodges(db, obedience_id)

        # Super Admin / Full Access
        return None
