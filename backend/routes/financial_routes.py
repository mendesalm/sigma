from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from database import get_db
from dependencies import get_current_user_payload
from schemas import financial_transaction_schema as schemas
from services import financial_service as services

router = APIRouter(
    prefix="/financial",
    tags=["Financial"], # Updated to "Financial" to match main.py
)

def require_lodge_admin(current_user: dict):
    user_type = current_user.get("user_type")
    if user_type != "super_admin" and user_type != "webmaster":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acesso negado às configurações financeiras."
        )

# --- Configurações da Loja ---
@router.get(
    "/config", 
    response_model=schemas.LodgeFinancialConfigResponse,
    summary="Obter Configurações Financeiras",
    description="Retorna as configurações financeiras do tenant atual (loja), como regras de inadimplência e gateway ativo. Acessível apenas para administradores (Webmaster/SuperAdmin).",
    responses={
        200: {"description": "Configurações retornadas com sucesso"},
        403: {"description": "Acesso negado"}
    }
)
def get_lodge_financial_config(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    require_lodge_admin(current_user)
    lodge_id = current_user.get("lodge_id")
    config = services.get_lodge_financial_config(db, lodge_id)
    return {**config.__dict__, "has_api_key": bool(config.gateway_api_key)}

@router.put(
    "/config", 
    response_model=schemas.LodgeFinancialConfigResponse,
    summary="Atualizar Configurações Financeiras",
    description="Atualiza as configurações do gateway, regras de orçamento e juros/multa padronizados da loja.",
    responses={
        200: {"description": "Configurações atualizadas"},
        403: {"description": "Acesso negado"}
    }
)
def update_lodge_financial_config(
    config_update: schemas.LodgeFinancialConfigCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    require_lodge_admin(current_user)
    lodge_id = current_user.get("lodge_id")
    config = services.update_lodge_financial_config(db, lodge_id, config_update)
    return {**config.__dict__, "has_api_key": bool(config.gateway_api_key)}

# --- Categorias (Plano de Contas) ---
@router.get(
    "/categories", 
    response_model=List[schemas.FinancialCategoryResponse],
    summary="Listar Categorias Financeiras",
    description="Obtém o plano de contas da loja, podendo ser filtrado pelo tipo de movimentação (RECEITA/DESPESA).",
)
def get_categories(
    type: Optional[schemas.TransactionType] = Query(None, description="Filtrar categorias por Receita ou Despesa"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    # Qualquer membro pode ver categorias para o formulario (depende da permissao)
    lodge_id = current_user.get("lodge_id")
    return services.get_categories(db, lodge_id, type)

@router.post(
    "/categories", 
    response_model=schemas.FinancialCategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Categoria Financeira",
    description="Adiciona uma nova rubrica/categoria ao plano de contas da loja (Apenas Admins).",
)
def create_category(
    category: schemas.FinancialCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload),
):
    require_lodge_admin(current_user)
    lodge_id = current_user.get("lodge_id")
    return services.create_category(db, lodge_id, category)

# --- Transações Financeiras ---
@router.get(
    "/transactions",
    response_model=List[schemas.FinancialTransactionResponse],
    summary="Listar Transações da Loja",
    description="Busca lançamentos financeiros usando filtros. Obreiros comuns só podem listar as próprias transações. Administradores podem listar e filtrar a loja inteira.",
)
def list_financial_transactions(
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
    member_id: int | None = Query(None, description="Filtrar por membro específico."),
    transaction_type: schemas.TransactionTypeEnum | None = Query(None, description="Filtrar por tipo (RECEITA/DESPESA)."),
):
    # Se nao for admin, so pode ver dele
    user_type = current_user_payload.get("user_type")
    if user_type not in ["super_admin", "webmaster"]:
        if member_id and member_id != current_user_payload.get("sub"):
            raise HTTPException(status_code=403, detail="Você só pode ver seus próprios débitos.")
        # Força ser as dele caso num seja admin ou master e seja busca geral
        elif not member_id:
             member_id = int(current_user_payload.get("sub"))
        
    return services.get_financial_transactions_by_lodge(
        db=db, current_user_payload=current_user_payload, member_id=member_id, transaction_type=transaction_type
    )

@router.post(
    "/transactions",
    response_model=schemas.FinancialTransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar Nova Transação Financeira",
    description="Cria contas a pagar ou a receber. Caso um gateway esteja configurado na loja, a cobrança também será registrada na integradora.",
)
def create_new_financial_transaction(
    transaction_data: schemas.FinancialTransactionCreate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    require_lodge_admin(current_user_payload)
    return services.create_financial_transaction(
        db=db, transaction_data=transaction_data, current_user_payload=current_user_payload
    )

@router.get(
    "/transactions/{transaction_id}",
    response_model=schemas.FinancialTransactionResponse,
    summary="Obter Transação por ID",
    description="Exibe detalhes precisos (incluindo links de gateway) de uma transação específica.",
)
def get_financial_transaction(
    transaction_id: int, 
    db: Session = Depends(get_db), 
    current_user_payload: dict = Depends(get_current_user_payload)
):
    txn = services.get_financial_transaction_by_id(
        db=db, transaction_id=transaction_id, current_user_payload=current_user_payload
    )
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    
    # Check permissions
    user_type = current_user_payload.get("user_type")
    if user_type not in ["super_admin", "webmaster"]:
        if txn.member_id != int(current_user_payload.get("sub")):
            raise HTTPException(status_code=403, detail="Não autorizado a ver este registro.")
            
    return txn


@router.put(
    "/transactions/{transaction_id}",
    response_model=schemas.FinancialTransactionResponse,
    summary="Atualizar Lançamento",
    description="Permite mudar as datas, status, e aplicar descontos ou juros manuais na transação. Baixas manuais ocorrem por aqui.",
)
def update_existing_financial_transaction(
    transaction_id: int,
    transaction_update: schemas.FinancialTransactionUpdate,
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    require_lodge_admin(current_user_payload)
    txn = services.update_financial_transaction(
        db=db,
        transaction_id=transaction_id,
        transaction_update=transaction_update,
        current_user_payload=current_user_payload,
    )
    if not txn:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    return txn

@router.delete(
    "/transactions/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir (Cancelar) Transação",
    description="Remove a transação do sistema e cancela a cobrança junto ao gateway (se aplicável).",
)
def delete_existing_financial_transaction(
    transaction_id: int, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    require_lodge_admin(current_user_payload)
    success = services.delete_financial_transaction(
        db=db, transaction_id=transaction_id, current_user_payload=current_user_payload
    )
    if not success:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada")
    return None
