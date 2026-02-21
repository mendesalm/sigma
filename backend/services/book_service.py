import httpx
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models.models import Book
from schemas.book_schema import BookCreate, BookUpdate

class BookService:
    @staticmethod
    async def fetch_book_from_isbn(isbn: str) -> Optional[dict]:
        """Busca dados do livro na API do Google Books e formata para o esquema BookCreate."""
        url = f"https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("totalItems", 0) > 0:
                        volume_info = data["items"][0]["volumeInfo"]
                        
                        return {
                            "isbn": isbn,
                            "title": volume_info.get("title", ""),
                            "author": ", ".join(volume_info.get("authors", [])) if volume_info.get("authors") else "Autor Desconhecido",
                            "publisher": volume_info.get("publisher", ""),
                            "publish_year": int(volume_info.get("publishedDate", "0")[:4]) if volume_info.get("publishedDate") else None,
                            "pages": volume_info.get("pageCount", None),
                            "cover_url": volume_info.get("imageLinks", {}).get("thumbnail", ""),
                            "synopsis": volume_info.get("description", ""),
                            "required_degree": 1 # Padrão para Aprendiz
                        }
            except Exception as e:
                # Log error
                print(f"Erro ao buscar ISBN {isbn}: {e}")
                
        return None

    @staticmethod
    def create_book(db: Session, book_in: BookCreate) -> Book:
        if book_in.isbn:
            db_book = db.query(Book).filter(Book.isbn == book_in.isbn).first()
            if db_book:
                raise ValueError(f"Book with ISBN {book_in.isbn} already exists.")
                
        new_book = Book(
            isbn=book_in.isbn,
            title=book_in.title,
            author=book_in.author,
            publisher=book_in.publisher,
            publish_year=book_in.publish_year,
            pages=book_in.pages,
            cover_url=book_in.cover_url,
            synopsis=book_in.synopsis,
            required_degree=book_in.required_degree
        )
        db.add(new_book)
        db.commit()
        db.refresh(new_book)
        return new_book

    @staticmethod
    def get_book(db: Session, book_id: int) -> Optional[Book]:
        return db.query(Book).filter(Book.id == book_id).first()
        
    @staticmethod
    def get_book_by_isbn(db: Session, isbn: str) -> Optional[Book]:
        return db.query(Book).filter(Book.isbn == isbn).first()

    @staticmethod
    def list_books(db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> List[Book]:
        query = db.query(Book)
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    Book.title.ilike(search_filter),
                    Book.author.ilike(search_filter),
                    Book.isbn.ilike(search_filter)
                )
            )
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def update_book(db: Session, book_id: int, book_in: BookUpdate) -> Optional[Book]:
        db_book = BookService.get_book(db, book_id)
        if not db_book:
            return None
            
        update_data = book_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_book, field, value)
            
        db.commit()
        db.refresh(db_book)
        return db_book

    @staticmethod
    def delete_book(db: Session, book_id: int) -> bool:
        db_book = BookService.get_book(db, book_id)
        if not db_book:
            return False
            
        db.delete(db_book)
        db.commit()
        return True
