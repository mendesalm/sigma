from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_

from models.models import Loan, LibraryItem, ItemStatusEnum, LoanStatusEnum, Waitlist, WaitlistStatusEnum, Member, DegreeEnum
from schemas.loan_schema import LoanCreate, LoanUpdate
from schemas.waitlist_schema import WaitlistCreate
from services.library_item_service import LibraryItemService
from services.email_service import send_library_waitlist_notice_email, send_library_late_notice_email

def get_member_degree_level(degree: DegreeEnum) -> int:
    if degree == DegreeEnum.APPRENTICE:
        return 1
    elif degree == DegreeEnum.FELLOW:
        return 2
    elif degree in (DegreeEnum.MASTER, DegreeEnum.INSTALLED_MASTER):
        return 3
    return 1 # Default 

class WaitlistService:
    @staticmethod
    def create_waitlist(db: Session, lodge_id: int, member_id: int, waitlist_in: WaitlistCreate) -> Waitlist:
        # Verifica se o membro já está na fila
        existing = db.query(Waitlist).filter(
            and_(
                Waitlist.book_id == waitlist_in.book_id,
                Waitlist.member_id == member_id,
                Waitlist.lodge_id == lodge_id,
                Waitlist.status.in_([WaitlistStatusEnum.WAITING, WaitlistStatusEnum.NOTIFIED])
            )
        ).first()
        if existing:
            raise ValueError("Você já está na fila de espera para este livro.")

        new_waitlist = Waitlist(
            book_id=waitlist_in.book_id,
            lodge_id=lodge_id,
            member_id=member_id,
            status=WaitlistStatusEnum.WAITING
        )
        db.add(new_waitlist)
        db.commit()
        db.refresh(new_waitlist)
        return new_waitlist

    @staticmethod
    def notify_next_in_line(db: Session, book_id: int, lodge_id: int) -> Optional[Waitlist]:
        # Pega o primeiro da fila
        next_in_line = db.query(Waitlist).filter(
            and_(
                Waitlist.book_id == book_id,
                Waitlist.lodge_id == lodge_id,
                Waitlist.status == WaitlistStatusEnum.WAITING
            )
        ).order_by(Waitlist.request_date.asc()).first()

        if next_in_line:
            next_in_line.status = WaitlistStatusEnum.NOTIFIED
            next_in_line.notification_date = datetime.now()
            next_in_line.expiration_date = datetime.now() + timedelta(days=15)
            db.commit()
            db.refresh(next_in_line)
            
            # Disparar email
            if next_in_line.member and next_in_line.member.email:
                send_library_waitlist_notice_email(
                    to=next_in_line.member.email,
                    book_title=next_in_line.book.title
                )
                
            return next_in_line
            
        return None
        
    @staticmethod
    def fulfill_waitlist(db: Session, waitlist_id: int) -> bool:
        wait = db.query(Waitlist).filter(Waitlist.id == waitlist_id).first()
        if wait and wait.status == WaitlistStatusEnum.NOTIFIED:
            wait.status = WaitlistStatusEnum.FULFILLED
            db.commit()
            return True
        return False
        
    @staticmethod
    def get_user_active_waitlists(db: Session, member_id: int, lodge_id: int) -> List[Waitlist]:
        return db.query(Waitlist).filter(
            and_(
                Waitlist.member_id == member_id,
                Waitlist.lodge_id == lodge_id,
                Waitlist.status.in_([WaitlistStatusEnum.WAITING, WaitlistStatusEnum.NOTIFIED])
            )
        ).all()
        
    @staticmethod
    def expire_notified_waitlists(db: Session):
        now = datetime.now()
        expired = db.query(Waitlist).filter(
            and_(
                Waitlist.status == WaitlistStatusEnum.NOTIFIED,
                Waitlist.expiration_date < now
            )
        ).all()
        
        for w in expired:
            w.status = WaitlistStatusEnum.EXPIRED
            # Avisa o próximo da fila
            WaitlistService.notify_next_in_line(db, w.book_id, w.lodge_id)
            
        if expired:
            db.commit()

class LoanService:
    @staticmethod
    def create_loan(db: Session, lodge_id: int, loan_in: LoanCreate) -> Loan:
        # 1. Verifica active loans do membro
        active_loans = db.query(Loan).filter(
            and_(
                Loan.member_id == loan_in.member_id,
                Loan.status == LoanStatusEnum.ACTIVE
            )
        ).count()
        
        if active_loans >= 3:
            raise ValueError("O limite máximo é de 3 empréstimos simultâneos por membro.")
            
        # 2. Verifica se o item existe e está disponível na loja
        item = LibraryItemService.get_item(db, loan_in.item_id, lodge_id)
        if not item:
            raise ValueError("Exemplar não encontrado.")
            
        if item.status not in (ItemStatusEnum.AVAILABLE, ItemStatusEnum.RESERVED):
             raise ValueError(f"Exemplar indisponível. Status atual: {item.status}")
             
        # 3. Verifica grau do membro vs grau do livro
        member = db.query(Member).filter(Member.id == loan_in.member_id).first()
        if not member:
            raise ValueError("Membro não encontrado.")
            
        member_degree_level = get_member_degree_level(member.degree)
        book_degree_level = item.book.required_degree
        
        if member_degree_level < book_degree_level:
            raise ValueError(f"O seu grau maçônico não permite o empréstimo deste livro. Grau exigido: {book_degree_level}")

        # Se estava reservado para este membro, a gente marca a Waitlist como Atendida
        waitlist_entry = db.query(Waitlist).filter(
            and_(
                Waitlist.book_id == item.book_id,
                Waitlist.member_id == loan_in.member_id,
                Waitlist.lodge_id == lodge_id,
                Waitlist.status == WaitlistStatusEnum.NOTIFIED
            )
        ).first()
        
        if waitlist_entry:
            waitlist_entry.status = WaitlistStatusEnum.FULFILLED
        elif item.status == ItemStatusEnum.RESERVED:
            # Se estava reservado, mas não tem waitlist entry para este usuário, é de outra pessoa
            raise ValueError("Este livro está reservado para o próximo da fila.")

        # 4. Registra empréstimo (30 dias)
        new_loan = Loan(
            item_id=item.id,
            member_id=member.id,
            due_date=datetime.now() + timedelta(days=30),
            status=LoanStatusEnum.ACTIVE
        )
        
        # Altera status do Exemplar
        item.status = ItemStatusEnum.LOANED
        
        db.add(new_loan)
        db.commit()
        db.refresh(new_loan)
        return new_loan

    @staticmethod
    def return_loan(db: Session, loan_id: int, lodge_id: int) -> Loan:
        loan = db.query(Loan).join(LibraryItem).filter(
            and_(
                Loan.id == loan_id,
                LibraryItem.lodge_id == lodge_id
            )
        ).first()
        
        if not loan:
            raise ValueError("Empréstimo não encontrado.")
            
        if loan.status == LoanStatusEnum.RETURNED:
             raise ValueError("Este empréstimo já foi finalizado.")
             
        loan.status = LoanStatusEnum.RETURNED
        loan.return_date = datetime.now()
        
        # Checar se há alguém na Waitlist
        next_in_line = WaitlistService.notify_next_in_line(db, loan.item.book_id, lodge_id)
        if next_in_line:
            loan.item.status = ItemStatusEnum.RESERVED
        else:
            loan.item.status = ItemStatusEnum.AVAILABLE
            
        db.commit()
        db.refresh(loan)
        return loan
        
    @staticmethod
    def get_member_loans(db: Session, member_id: int, skip: int = 0, limit: int = 100) -> List[Loan]:
        return db.query(Loan).filter(Loan.member_id == member_id).order_by(Loan.loan_date.desc()).offset(skip).limit(limit).all()
        
    @staticmethod
    def get_lodge_active_loans(db: Session, lodge_id: int, skip: int = 0, limit: int = 100) -> List[Loan]:
        return db.query(Loan).join(LibraryItem).filter(
            and_(
                LibraryItem.lodge_id == lodge_id,
                Loan.status.in_([LoanStatusEnum.ACTIVE, LoanStatusEnum.LATE])
            )
        ).order_by(Loan.due_date.asc()).offset(skip).limit(limit).all()

    @staticmethod
    def check_late_loans(db: Session):
        now = datetime.now()
        late_loans = db.query(Loan).filter(
            and_(
                Loan.status == LoanStatusEnum.ACTIVE,
                Loan.due_date < now
            )
        ).all()
        
        for loan in late_loans:
            loan.status = LoanStatusEnum.LATE
            if loan.member and loan.member.email:
                send_library_late_notice_email(
                    to=loan.member.email, 
                    book_title=loan.item.book.title
                )
            
        if late_loans:
            db.commit()
