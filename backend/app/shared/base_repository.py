from contextlib import contextmanager
from typing import Any, Generic, TypeVar

from sqlalchemy.orm import Session

from app.shared.base_model import BaseModel
from app.shared.tenant_context import TenantContextManager

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], db: Session):
        self.model = model
        self.db = db
        self._bypass_tenant = False

    @contextmanager
    def bypass_tenant(self):
        """
        Context manager to temporarily bypass tenant isolation for this repository instance.
        Usage:
            with repo.bypass_tenant():
                return repo.get(id)
        """
        original_state = self._bypass_tenant
        self._bypass_tenant = True
        try:
            yield self
        finally:
            self._bypass_tenant = original_state

    def _apply_tenant_filter(self, query):
        """Automatically applies lodge_id or obedience_id filters if applicable and not bypassed."""
        if self._bypass_tenant:
            return query

        if hasattr(self.model, "lodge_id"):
            lodge_id = TenantContextManager.get_lodge_id()
            if lodge_id is not None:
                query = query.filter(self.model.lodge_id == lodge_id)

        elif hasattr(self.model, "obedience_id"):
            # Some models might be tied to obedience rather than lodge
            obedience_id = TenantContextManager.get_obedience_id()
            if obedience_id is not None:
                query = query.filter(self.model.obedience_id == obedience_id)

        return query

    def get(self, id: Any) -> ModelType | None:
        query = self.db.query(self.model).filter(self.model.id == id)
        return self._apply_tenant_filter(query).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        query = self.db.query(self.model)
        query = self._apply_tenant_filter(query)
        return query.offset(skip).limit(limit).all()

    def create(self, obj_in: dict[str, Any] | BaseModel) -> ModelType:
        obj_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump()

        # Automatically inject tenant_id if not explicitly provided
        if hasattr(self.model, "lodge_id") and "lodge_id" not in obj_data:
            lodge_id = TenantContextManager.get_lodge_id()
            if lodge_id is not None:
                obj_data["lodge_id"] = lodge_id

        db_obj = self.model(**obj_data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: ModelType, obj_in: dict[str, Any] | BaseModel) -> ModelType:
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, id: Any) -> bool:
        obj = self.get(id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
