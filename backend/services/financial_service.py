from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ..models import models
from ..schemas import financial_transaction_schema

# --- Funções de Serviço para Transações Financeiras ---


def create_financial_transaction(
    db: Session, transaction_data: financial_transaction_schema.FinancialTransactionCreate, current_user_payload: dict
) -> models.FinancialTransaction:
    """
    Cria uma nova transação financeira associada à loja do usuário.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Operação não permitida: Usuário não associado a uma loja."
        )

    # Verifica se o member_id pertence à loja do usuário
    member = (
        db.query(models.MemberLodgeAssociation)
        .filter(
            models.MemberLodgeAssociation.member_id == transaction_data.member_id,
            models.MemberLodgeAssociation.lodge_id == lodge_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Membro não encontrado ou não pertence à loja do usuário."
        )

    db_transaction = models.FinancialTransaction(**transaction_data.model_dump(), lodge_id=lodge_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def get_financial_transaction_by_id(
    db: Session, transaction_id: int, current_user_payload: dict
) -> models.FinancialTransaction:
    """
    Busca uma transação financeira pelo ID, garantindo que pertença à loja do usuário.
    """
    lodge_id = current_user_payload.get("lodge_id")
    transaction = (
        db.query(models.FinancialTransaction)
        .filter(models.FinancialTransaction.id == transaction_id, models.FinancialTransaction.lodge_id == lodge_id)
        .first()
    )

    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação financeira não encontrada.")
    return transaction


def get_financial_transactions_by_lodge(
    db: Session,
    current_user_payload: dict,
    member_id: int | None = None,
    transaction_type: financial_transaction_schema.TransactionTypeEnum | None = None,
) -> list[models.FinancialTransaction]:
    """
    Lista todas as transações financeiras associadas à loja do usuário, opcionalmente filtrando por membro e tipo.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        return []

    query = db.query(models.FinancialTransaction).filter(models.FinancialTransaction.lodge_id == lodge_id)

    if member_id:
        query = query.filter(models.FinancialTransaction.member_id == member_id)
    if transaction_type:
        query = query.filter(models.FinancialTransaction.transaction_type == transaction_type)

    return query.all()


def update_financial_transaction(
    db: Session,
    transaction_id: int,
    transaction_update: financial_transaction_schema.FinancialTransactionUpdate,
    current_user_payload: dict,
) -> models.FinancialTransaction:
    """
    Atualiza uma transação financeira existente, garantindo que pertença à loja do usuário.
    """
    db_transaction = get_financial_transaction_by_id(db, transaction_id, current_user_payload)  # Valida propriedade

    # Se o member_id for atualizado, verifica se o novo membro pertence à mesma loja
    if transaction_update.member_id is not None and transaction_update.member_id != db_transaction.member_id:
        member = (
            db.query(models.MemberLodgeAssociation)
            .filter(
                models.MemberLodgeAssociation.member_id == transaction_update.member_id,
                models.MemberLodgeAssociation.lodge_id == db_transaction.lodge_id,
            )
            .first()
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Novo membro especificado não pertence à loja da transação.",
            )

    for key, value in transaction_update.model_dump(exclude_unset=True).items():
        setattr(db_transaction, key, value)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def delete_financial_transaction(
    db: Session, transaction_id: int, current_user_payload: dict
) -> models.FinancialTransaction:
    """
    Apaga uma transação financeira existente, garantindo que pertença à loja do usuário.
    """
    db_transaction = get_financial_transaction_by_id(db, transaction_id, current_user_payload)  # Valida propriedade
    db.delete(db_transaction)
    db.commit()
    return db_transaction
