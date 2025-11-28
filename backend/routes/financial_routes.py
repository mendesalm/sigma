from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

# Importações do projeto
from database import get_db
from dependencies import get_current_user_payload
from schemas import financial_transaction_schema
from services import financial_service

router = APIRouter(
    prefix="/financial-transactions",
    tags=["Transações Financeiras"],
    responses={404: {"description": "Não encontrado"}},
)


@router.post(
    "/",
    response_model=financial_transaction_schema.FinancialTransactionInDB,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Nova Transação Financeira",
    description="Cria uma nova transação financeira (débito/crédito) associada a um membro da loja do usuário autenticado.",
)
def create_new_financial_transaction(
    transaction_data: financial_transaction_schema.FinancialTransactionCreate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    return financial_service.create_financial_transaction(
        db=db, transaction_data=transaction_data, current_user_payload=current_user_payload
    )


@router.get(
    "/",
    response_model=list[financial_transaction_schema.FinancialTransactionInDB],
    summary="Listar Transações Financeiras da Loja",
    description="Retorna uma lista de todas as transações financeiras associadas à loja do usuário autenticado, com filtros opcionais.",
)
def list_financial_transactions(
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
    member_id: int | None = Query(None, description="Filtrar transações por ID de membro."),
    transaction_type: financial_transaction_schema.TransactionTypeEnum | None = Query(
        None, description="Filtrar transações por tipo (débito/crédito)."
    ),
):
    return financial_service.get_financial_transactions_by_lodge(
        db=db, current_user_payload=current_user_payload, member_id=member_id, transaction_type=transaction_type
    )


@router.get(
    "/{transaction_id}",
    response_model=financial_transaction_schema.FinancialTransactionInDB,
    summary="Obter Transação Financeira por ID",
    description="Retorna uma transação financeira específica pelo seu ID, garantindo que pertença à loja do usuário.",
)
def get_financial_transaction(
    transaction_id: int, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    return financial_service.get_financial_transaction_by_id(
        db=db, transaction_id=transaction_id, current_user_payload=current_user_payload
    )


@router.put(
    "/{transaction_id}",
    response_model=financial_transaction_schema.FinancialTransactionInDB,
    summary="Atualizar Transação Financeira",
    description="Atualiza uma transação financeira existente, garantindo que pertença à loja do usuário.",
)
def update_existing_financial_transaction(
    transaction_id: int,
    transaction_update: financial_transaction_schema.FinancialTransactionUpdate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    return financial_service.update_financial_transaction(
        db=db,
        transaction_id=transaction_id,
        transaction_update=transaction_update,
        current_user_payload=current_user_payload,
    )


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir Transação Financeira",
    description="Exclui uma transação financeira existente, garantindo que pertença à loja do usuário.",
)
def delete_existing_financial_transaction(
    transaction_id: int, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    financial_service.delete_financial_transaction(
        db=db, transaction_id=transaction_id, current_user_payload=current_user_payload
    )
    return {"message": "Transação financeira excluída com sucesso."}
