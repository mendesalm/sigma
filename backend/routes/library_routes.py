from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import database
import dependencies
from schemas import book_schema, library_item_schema, loan_schema, waitlist_schema
from services.book_service import BookService
from services.library_item_service import LibraryItemService
from services.loan_service import LoanService, WaitlistService

router = APIRouter(
    prefix="/library",
    tags=["Library"],
)


def require_librarian_or_admin(current_user: dict):
    user_type = current_user.get("user_type")
    if user_type in ("super_admin", "webmaster"):
        return True

    active_role = current_user.get("active_role_name")
    if active_role in ("Bibliotecário", "Bibliotecário Adjunto", "Venerável Mestre"):
        return True

    raise HTTPException(status_code=403, detail="Not authorized to manage library")


@router.get("/books/search-isbn/{isbn}", response_model=Optional[dict])
async def search_book_by_isbn(
    isbn: str,
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Busca dados de um livro no Google Books via ISBN."""
    require_librarian_or_admin(current_user)
    book_data = await BookService.fetch_book_from_isbn(isbn)
    if not book_data:
        raise HTTPException(status_code=404, detail="Livro não encontrado no Google Books")
    return book_data


@router.get("/books", response_model=list[book_schema.BookResponse])
def list_books(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Lista catálogo global de livros."""
    return BookService.list_books(db, skip=skip, limit=limit, search=search)


@router.post("/books", response_model=book_schema.BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: book_schema.BookCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Adiciona um livro ao catálogo global."""
    require_librarian_or_admin(current_user)
    try:
        return BookService.create_book(db, book_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/items", response_model=list[library_item_schema.LibraryItemResponse])
def list_library_items(
    book_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Lista acervo de exemplares da Loja atual."""
    lodge_id = current_user.get("lodge_id")
    if not lodge_id:
        raise HTTPException(status_code=400, detail="Usuário sem loja vinculada")

    return LibraryItemService.list_items(db, lodge_id=lodge_id, book_id=book_id, skip=skip, limit=limit)


@router.post("/items", response_model=library_item_schema.LibraryItemResponse, status_code=status.HTTP_201_CREATED)
def create_library_item(
    item_in: library_item_schema.LibraryItemCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Adiciona um exemplar ao acervo da Loja."""
    require_librarian_or_admin(current_user)
    lodge_id = current_user.get("lodge_id")
    if not lodge_id:
        raise HTTPException(status_code=400, detail="Usuário sem loja vinculada")

    try:
        return LibraryItemService.create_item(db, lodge_id, item_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/loans", response_model=loan_schema.LoanResponse, status_code=status.HTTP_201_CREATED)
def create_loan(
    loan_in: loan_schema.LoanCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Registra um novo empréstimo de livro para um membro."""
    require_librarian_or_admin(current_user)
    lodge_id = current_user.get("lodge_id")
    if not lodge_id:
        raise HTTPException(status_code=400, detail="Usuário sem loja vinculada")

    try:
        return LoanService.create_loan(db, lodge_id, loan_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/loans/{loan_id}/return", response_model=loan_schema.LoanResponse)
def return_loan(
    loan_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Registra a devolução de um livro."""
    require_librarian_or_admin(current_user)
    lodge_id = current_user.get("lodge_id")
    if not lodge_id:
        raise HTTPException(status_code=400, detail="Usuário sem loja vinculada")

    try:
        return LoanService.return_loan(db, loan_id, lodge_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/loans/me", response_model=list[loan_schema.LoanResponse])
def get_my_loans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Lista empréstimos do membro logado."""
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not found")

    return LoanService.get_member_loans(db, user_id, skip=skip, limit=limit)


@router.get("/loans/active", response_model=list[loan_schema.LoanResponse])
def get_active_loans(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Lista todos os empréstimos ativos da Loja (Para Bibliotecário)."""
    require_librarian_or_admin(current_user)
    lodge_id = current_user.get("lodge_id")
    if not lodge_id:
        raise HTTPException(status_code=400, detail="Usuário sem loja vinculada")

    return LoanService.get_lodge_active_loans(db, lodge_id, skip=skip, limit=limit)


@router.post("/waitlist", response_model=waitlist_schema.WaitlistResponse, status_code=status.HTTP_201_CREATED)
def enter_waitlist(
    waitlist_in: waitlist_schema.WaitlistCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Entra na fila de espera de um livro esgotado."""
    lodge_id = current_user.get("lodge_id")
    user_id = current_user.get("user_id")
    if not lodge_id or not user_id:
        raise HTTPException(status_code=400, detail="Usuário sem loja vinculada ou ID inválido")

    try:
        return WaitlistService.create_waitlist(db, lodge_id, user_id, waitlist_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/waitlist/me", response_model=list[waitlist_schema.WaitlistResponse])
def get_my_waitlists(
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_user_payload),
):
    """Lista a fila de espera ativa do usuário."""
    lodge_id = current_user.get("lodge_id")
    user_id = current_user.get("user_id")
    if not lodge_id or not user_id:
        raise HTTPException(status_code=400, detail="Usuário sem loja vinculada/ID inválido")

    return WaitlistService.get_user_active_waitlists(db, user_id, lodge_id)
