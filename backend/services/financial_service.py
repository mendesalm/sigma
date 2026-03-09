from sqlalchemy.orm import Session

from models import finance_models as models
from schemas import financial_transaction_schema as schemas


# --- Lodge Config ---
def get_lodge_financial_config(db: Session, lodge_id: int) -> models.LodgeFinancialConfig:
    config = db.query(models.LodgeFinancialConfig).filter(models.LodgeFinancialConfig.lodge_id == lodge_id).first()
    if not config:
        config = models.LodgeFinancialConfig(lodge_id=lodge_id)
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def update_lodge_financial_config(
    db: Session, lodge_id: int, config_update: schemas.LodgeFinancialConfigCreate
) -> models.LodgeFinancialConfig:
    config = get_lodge_financial_config(db, lodge_id)
    update_data = config_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(config, key, value)
    db.commit()
    db.refresh(config)
    return config


# --- Categories ---
def get_categories(
    db: Session, lodge_id: int, type: schemas.TransactionType | None = None
) -> list[models.FinancialCategory]:
    query = db.query(models.FinancialCategory).filter(models.FinancialCategory.lodge_id == lodge_id)
    if type:
        query = query.filter(models.FinancialCategory.type == type.value)
    return query.all()


def create_category(db: Session, lodge_id: int, category: schemas.FinancialCategoryCreate) -> models.FinancialCategory:
    db_category = models.FinancialCategory(**category.model_dump(), lodge_id=lodge_id)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def update_category(
    db: Session, lodge_id: int, category_id: int, category_update: schemas.FinancialCategoryBase
) -> models.FinancialCategory | None:
    db_category = (
        db.query(models.FinancialCategory)
        .filter(models.FinancialCategory.id == category_id, models.FinancialCategory.lodge_id == lodge_id)
        .first()
    )
    if not db_category:
        return None

    update_data = category_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return db_category


# --- Transactions ---
def get_financial_transactions_by_lodge(
    db: Session,
    current_user_payload: dict,
    member_id: int | None = None,
    transaction_type: schemas.TransactionType | None = None,
) -> list[models.FinancialTransaction]:
    lodge_id = current_user_payload.get("lodge_id")
    query = db.query(models.FinancialTransaction).filter(models.FinancialTransaction.lodge_id == lodge_id)
    if member_id:
        query = query.filter(models.FinancialTransaction.member_id == member_id)
    if transaction_type:
        query = query.filter(models.FinancialTransaction.transaction_type == transaction_type.value)
    return query.order_by(models.FinancialTransaction.due_date.desc()).all()


def get_financial_transaction_by_id(
    db: Session, transaction_id: int, current_user_payload: dict
) -> models.FinancialTransaction | None:
    lodge_id = current_user_payload.get("lodge_id")
    return (
        db.query(models.FinancialTransaction)
        .filter(models.FinancialTransaction.id == transaction_id, models.FinancialTransaction.lodge_id == lodge_id)
        .first()
    )


def create_financial_transaction(
    db: Session, transaction_data: schemas.FinancialTransactionCreate, current_user_payload: dict
) -> models.FinancialTransaction:
    lodge_id = current_user_payload.get("lodge_id")
    db_transaction = models.FinancialTransaction(**transaction_data.model_dump(), lodge_id=lodge_id)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def update_financial_transaction(
    db: Session, transaction_id: int, transaction_update: schemas.FinancialTransactionUpdate, current_user_payload: dict
) -> models.FinancialTransaction | None:
    current_user_payload.get("lodge_id")
    db_transaction = get_financial_transaction_by_id(db, transaction_id, current_user_payload)
    if not db_transaction:
        return None

    update_data = transaction_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_transaction, key, value)

    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def delete_financial_transaction(db: Session, transaction_id: int, current_user_payload: dict) -> bool:
    db_transaction = get_financial_transaction_by_id(db, transaction_id, current_user_payload)
    if not db_transaction:
        return False

    db.delete(db_transaction)
    db.commit()
    return True
