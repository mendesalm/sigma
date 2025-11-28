import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

# Importações do projeto
from models import models
from schemas import document_schema
from utils.path_utils import get_tenant_path


# Assumindo que o `current_user_payload` é um dicionário vindo do token JWT,
# contendo 'sub' (user_id), 'lodge_id', e 'user_type'.
async def create_document(
    db: Session,
    title: str,
    current_user_payload: dict,
    file: UploadFile | None = None,  # Arquivo de upload, se houver
    file_content_bytes: bytes | None = None,  # Conteúdo do arquivo em bytes, se gerado internamente
    filename: str | None = None,  # Nome do arquivo para conteúdo em bytes
    content_type: str | None = None,  # Tipo de conteúdo para bytes
) -> models.Document:
    """
    Salva um arquivo no diretório do tenant e cria um registro no banco de dados.
    Pode receber um UploadFile ou conteúdo em bytes para documentos gerados internamente.
    """
    lodge_id = current_user_payload.get("lodge_id")
    user_id = current_user_payload.get("sub")

    if not lodge_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operação não permitida: O usuário não está associado a uma loja.",
        )

    # Busca a loja para obter o obedience_id
    lodge = db.query(models.Lodge).filter(models.Lodge.id == lodge_id).first()
    if not lodge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada.")

    # 1. Obter o caminho de armazenamento seguro para o tenant
    tenant_path = get_tenant_path(id_obediencia=lodge.obedience_id, id_loja=lodge_id, resource_type="documents")

    file_to_save_name: str
    file_to_save_content: bytes
    file_to_save_type: str

    if file:
        file_to_save_name = file.filename
        file_to_save_content = await file.read()
        file_to_save_type = file.content_type
        await file.close()
    elif file_content_bytes and filename and content_type:
        file_to_save_name = filename
        file_to_save_content = file_content_bytes
        file_to_save_type = content_type
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="É necessário fornecer um UploadFile ou o conteúdo do arquivo em bytes com nome e tipo.",
        )

    # 2. Gerar um nome de arquivo único para evitar conflitos e problemas de segurança
    file_extension = Path(file_to_save_name).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_location = tenant_path / unique_filename

    # 3. Salvar o arquivo no disco de forma eficiente
    try:
        with open(file_location, "wb") as buffer:
            buffer.write(file_to_save_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Erro ao salvar arquivo no disco: {e}"
        )

    # 4. Criar o registro no banco de dados
    db_document_data = document_schema.DocumentCreate(
        title=title,
        file_path=str(file_location),
        file_name=file_to_save_name,
        file_type=file_to_save_type,
        uploaded_by_member_id=user_id,  # user_id do payload é o member_id do Uploader
    )

    db_document = models.Document(**db_document_data.model_dump(), lodge_id=lodge_id)

    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    return db_document


def get_document_by_id(db: Session, document_id: int, current_user_payload: dict) -> models.Document:
    """
    Busca um documento pelo ID, garantindo que ele pertença à loja do usuário.
    """
    lodge_id = current_user_payload.get("lodge_id")
    document = db.query(models.Document).filter(models.Document.id == document_id).first()

    if not document or document.lodge_id != lodge_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Documento não encontrado.")

    return document


def get_documents_by_lodge(db: Session, current_user_payload: dict) -> list[models.Document]:
    """
    Lista todos os documentos de uma loja específica.
    """
    lodge_id = current_user_payload.get("lodge_id")
    if not lodge_id:
        return []
    return db.query(models.Document).filter(models.Document.lodge_id == lodge_id).all()


def delete_document(db: Session, document_id: int, current_user_payload: dict) -> models.Document:
    """
    Apaga um documento do banco de dados e do sistema de arquivos.
    """
    document_to_delete = get_document_by_id(db, document_id, current_user_payload)  # Reutiliza a lógica de verificação

    # 1. Apagar o arquivo físico
    try:
        file_path = Path(document_to_delete.file_path)
        if file_path.exists():
            file_path.unlink()
    except Exception as e:
        # Opcional: logar que o arquivo físico não pode ser removido, mas prosseguir.
        print(f"Aviso: O arquivo físico {document_to_delete.file_path} não pôde ser removido: {e}")

    # 2. Apagar o registro do banco
    db.delete(document_to_delete)
    db.commit()

    return document_to_delete
