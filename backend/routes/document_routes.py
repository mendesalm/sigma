from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

# Importações do projeto
from database import get_db
from dependencies import get_current_user_payload
from schemas import document_schema
from services import document_service

router = APIRouter(prefix="/documents", tags=["Documentos"], responses={404: {"description": "Não encontrado"}})


@router.post(
    "/",
    response_model=document_schema.DocumentInDB,
    summary="Upload de um Novo Documento",
    description="Faz o upload de um arquivo e o associa à loja do usuário logado.",
)
async def upload_document(
    title: str = Form(..., description="Título do documento."),
    session_id: int | None = Form(None, description="ID da sessão associada (opcional)."),
    file: UploadFile = File(..., description="Arquivo a ser enviado."),
    db: Session = Depends(get_db),
    current_user_payload: dict = Depends(get_current_user_payload),
):
    """
    Endpoint para criar um novo documento. O arquivo é salvo em um diretório
    específico do tenant (loja) e os metadados são salvos no banco de dados.
    """
    return await document_service.create_document(
        db=db, file=file, title=title, session_id=session_id, current_user_payload=current_user_payload
    )


@router.get(
    "/",
    response_model=list[document_schema.DocumentInDB],
    summary="Listar Documentos da Loja",
    description="Retorna uma lista de todos os documentos associados à loja do usuário.",
)
def list_documents(db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)):
    """
    Endpoint para listar todos os documentos da loja do usuário autenticado.
    """
    return document_service.get_documents_by_lodge(db=db, current_user_payload=current_user_payload)


@router.get("/{document_id}", response_model=document_schema.DocumentInDB, summary="Obter um Documento por ID")
def read_document(
    document_id: int, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    """
    Endpoint para obter os detalhes de um documento específico,
    verificando se o documento pertence à loja do usuário.
    """
    return document_service.get_document_by_id(
        db=db, document_id=document_id, current_user_payload=current_user_payload
    )


@router.get(
    "/{document_id}/download",
    summary="Baixar Documento",
    description="Faz o download do arquivo associado ao documento.",
)
def download_document(
    document_id: int, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    """
    Endpoint para baixar o arquivo de um documento.
    """
    from fastapi.responses import FileResponse

    document = document_service.get_document_by_id(
        db=db, document_id=document_id, current_user_payload=current_user_payload
    )

    return FileResponse(path=document.file_path, filename=document.file_name, media_type=document.file_type)


@router.delete("/{document_id}", response_model=document_schema.DocumentInDB, summary="Excluir um Documento")
def remove_document(
    document_id: int, db: Session = Depends(get_db), current_user_payload: dict = Depends(get_current_user_payload)
):
    """
    Endpoint para excluir um documento do banco de dados e do sistema de arquivos.
    """
    return document_service.delete_document(db=db, document_id=document_id, current_user_payload=current_user_payload)
