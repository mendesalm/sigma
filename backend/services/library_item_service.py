from sqlalchemy import and_
from sqlalchemy.orm import Session

from models.models import ItemStatusEnum, LibraryItem
from schemas.library_item_schema import LibraryItemCreate, LibraryItemUpdate
from services.book_service import BookService


class LibraryItemService:
    @staticmethod
    def create_item(db: Session, lodge_id: int, item_in: LibraryItemCreate) -> LibraryItem:
        book = BookService.get_book(db, item_in.book_id)
        if not book:
            raise ValueError(f"Book with id {item_in.book_id} not found.")

        new_item = LibraryItem(
            book_id=item_in.book_id,
            lodge_id=lodge_id,
            inventory_code=item_in.inventory_code,
            condition=item_in.condition,
            status=ItemStatusEnum.AVAILABLE,
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        return new_item

    @staticmethod
    def get_item(db: Session, item_id: int, lodge_id: int) -> LibraryItem | None:
        return db.query(LibraryItem).filter(and_(LibraryItem.id == item_id, LibraryItem.lodge_id == lodge_id)).first()

    @staticmethod
    def list_items(
        db: Session, lodge_id: int, book_id: int | None = None, skip: int = 0, limit: int = 100
    ) -> list[LibraryItem]:
        query = db.query(LibraryItem).filter(LibraryItem.lodge_id == lodge_id)
        if book_id is not None:
            query = query.filter(LibraryItem.book_id == book_id)
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_item(db: Session, item_id: int, lodge_id: int, item_in: LibraryItemUpdate) -> LibraryItem | None:
        db_item = LibraryItemService.get_item(db, item_id, lodge_id)
        if not db_item:
            return None

        update_data = item_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_item, field, value)

        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def delete_item(db: Session, item_id: int, lodge_id: int) -> bool:
        db_item = LibraryItemService.get_item(db, item_id, lodge_id)
        if not db_item:
            return False

        # Não deletar se estiver emprestado
        if db_item.status == ItemStatusEnum.LOANED:
            raise ValueError("Não é possível excluir um exemplar que está emprestado.")

        db.delete(db_item)
        db.commit()
        return True
