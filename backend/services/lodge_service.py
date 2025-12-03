import os
import uuid

from sqlalchemy.orm import Session

from models import models
from schemas import lodge_schema
from services import auth_service


def get_lodge(db: Session, lodge_id: int) -> models.Lodge | None:
    """Fetches a single lodge by its ID."""
    return db.query(models.Lodge).filter(models.Lodge.id == lodge_id).first()


def get_lodges(db: Session, skip: int = 0, limit: int = 100) -> list[models.Lodge]:
    """Fetches all lodges with pagination."""
    from sqlalchemy.orm import joinedload
    return db.query(models.Lodge).options(joinedload(models.Lodge.obedience)).offset(skip).limit(limit).all()


def create_lodge(db: Session, lodge: lodge_schema.LodgeCreate) -> models.Lodge:
    """
    Creates a new lodge with a unique lodge_code and an associated Webmaster user for its technical contact.
    """
    # Generate a unique code for the lodge
    unique_code = str(uuid.uuid4())  # Simple unique code generation

    try:
        db_lodge = models.Lodge(
            **lodge.model_dump(),
            lodge_code=unique_code,
            is_active=True,  # Set default active status
        )
        db.add(db_lodge)
        db.flush()  # Flush to get the ID

        # Now, create the associated webmaster user
        auth_service._create_webmaster_user(
            db=db,
            name=lodge.technical_contact_name,
            email=lodge.technical_contact_email,
            lodge_id=db_lodge.id,
            commit=False,  # Do not commit yet
        )

        # Create storage directory for the lodge
        # Sanitize lodge_number to ensure valid directory name
        safe_lodge_number = (
            "".join(c for c in lodge.lodge_number if c.isalnum() or c in (" ", "-", "_")).strip().replace(" ", "_")
        )
        storage_path = os.path.join("storage", "lodges", f"loja_{safe_lodge_number}")
        os.makedirs(storage_path, exist_ok=True)
        
        # Create subdirectories for logo and profile pictures
        os.makedirs(os.path.join(storage_path, "logo"), exist_ok=True)
        os.makedirs(os.path.join(storage_path, "profile_pictures"), exist_ok=True)

        # --- IMPORTAÇÃO DE MEMBROS GLOBAIS ---
        # Busca visitantes no banco global que declararam ser desta loja
        try:
            from database import get_oriente_db
            from models.global_models import GlobalVisitor
            
            oriente_db_gen = get_oriente_db()
            oriente_db = next(oriente_db_gen)
            
            # Critérios de busca:
            # 1. Pelo ID externo se fornecido
            # 2. Pelo Nome e Número da Loja (Manual Entry)
            
            potential_members = []
            
            if hasattr(lodge, 'external_id') and lodge.external_id:
                # Busca por ID externo (origin_lodge_id)
                potential_members = oriente_db.query(GlobalVisitor).filter(
                    GlobalVisitor.origin_lodge_id == lodge.external_id
                ).all()
                print(f"Buscando membros globais pelo ID externo {lodge.external_id}: {len(potential_members)} encontrados.")
            
            # Se não achou ou não tem ID, tenta por nome/número
            if not potential_members:
                # Normalização para busca
                target_name = lodge.lodge_name.strip() # Usando lodge_name do schema
                target_number = str(lodge.lodge_number).strip()
                
                potential_members = oriente_db.query(GlobalVisitor).filter(
                    GlobalVisitor.manual_lodge_name.ilike(f"%{target_name}%"),
                    GlobalVisitor.manual_lodge_number == target_number
                ).all()
                print(f"Buscando membros globais por Nome/Número: {len(potential_members)} encontrados.")
            
            imported_count = 0
            for visitor in potential_members:
                # Verifica se já existe membro com este CIM/CPF
                existing_member = db.query(models.Member).filter(models.Member.cim == visitor.cim).first()
                
                if not existing_member:
                    # Cria novo membro
                    new_member = models.Member(
                        full_name=visitor.full_name,
                        cim=visitor.cim,
                        grade=visitor.degree,
                        status="Regular", # Assume regular
                        email=f"temp_{visitor.cim}@sigma.com", # Placeholder email
                    )
                    db.add(new_member)
                    db.flush() # Para ter ID
                    
                    # Associa à loja
                    association = models.MemberLodgeAssociation(
                        member_id=new_member.id,
                        lodge_id=db_lodge.id,
                        is_primary=True
                    )
                    db.add(association)
                    imported_count += 1
                else:
                    # Membro já existe, verifica se já tem associação com esta loja
                    existing_assoc = db.query(models.MemberLodgeAssociation).filter(
                        models.MemberLodgeAssociation.member_id == existing_member.id,
                        models.MemberLodgeAssociation.lodge_id == db_lodge.id
                    ).first()
                    
                    if not existing_assoc:
                        association = models.MemberLodgeAssociation(
                            member_id=existing_member.id,
                            lodge_id=db_lodge.id,
                            is_primary=False # Já existia, então essa é secundária ou filiação
                        )
                        db.add(association)
                        imported_count += 1
            
            print(f"Importados {imported_count} membros do cadastro global para a nova loja {db_lodge.name}.")
            oriente_db.close()
            
        except Exception as import_err:
            print(f"Erro ao importar membros globais (não bloqueante): {import_err}")
            # Não faz rollback por erro na importação opcional

        db.commit()
        db.refresh(db_lodge)

    except Exception as e:
        db.rollback()
        raise e

    return db_lodge


def update_lodge(db: Session, lodge_id: int, lodge_update: lodge_schema.LodgeUpdate) -> models.Lodge | None:
    """Updates an existing lodge."""
    db_lodge = get_lodge(db, lodge_id)
    if not db_lodge:
        return None

    update_data = lodge_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lodge, key, value)

    db.commit()
    db.refresh(db_lodge)
    return db_lodge


def delete_lodge(db: Session, lodge_id: int) -> models.Lodge | None:
    """Deletes a lodge."""
    db_lodge = get_lodge(db, lodge_id)
    if not db_lodge:
        return None

    db.delete(db_lodge)
    db.commit()
    return db_lodge
