import os
import shutil

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

import database
import dependencies

router = APIRouter(
    prefix="/admin/templates",
    tags=["Start/Admin Templates"],
)


class UniversalTemplateUpdate(BaseModel):
    content: str


@router.get("/universal/{doc_type}")
def get_universal_template(
    doc_type: str,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """
    Lê o conteúdo do arquivo de template universal (Master).
    """
    valid_types = {
        "balaustre": ("balaustre_template.html", "templates/balaustre"),
        # Adicionar outros conforme necessário, ex: "prancha": ("prancha_template.html", "templates/prancha")
    }

    if doc_type not in valid_types:
        raise HTTPException(
            status_code=400, detail="Tipo de documento inválido ou não suportado para edição universal."
        )

    filename, subpath = valid_types[doc_type]

    # Path: backend/storage/lodges/model/templates/{subpath}/{filename}
    # Ajuste conforme estrutura real: storage/lodges/model/templates/balaustre/balaustre_template.html
    base_storage = os.path.join("storage", "lodges", "model", subpath)
    file_path = os.path.join(base_storage, filename)

    if not os.path.exists(file_path):
        # Tenta buscar do backend/templates como fallback inicial se o model não existir
        fallback_path = os.path.join("backend", "templates", filename)
        if os.path.exists(fallback_path):
            with open(fallback_path, encoding="utf-8") as f:
                return {"content": f.read(), "source": "fallback"}
        raise HTTPException(status_code=404, detail="Arquivo de template universal não encontrado.")

    try:
        with open(file_path, encoding="utf-8") as f:
            content = f.read()
            return {"content": content, "source": "model"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler arquivo: {str(e)}")


@router.put("/universal/{doc_type}")
def update_universal_template(
    doc_type: str,
    payload: UniversalTemplateUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(dependencies.get_current_super_admin),
):
    """
    Atualiza (sobrescreve) o arquivo de template universal.
    Isso afetará todas as lojas que não têm personalizações (Padrão Sigma).
    """
    valid_types = {
        "balaustre": ("balaustre_template.html", "templates/balaustre"),
    }

    if doc_type not in valid_types:
        raise HTTPException(status_code=400, detail="Tipo de documento inválido.")

    filename, subpath = valid_types[doc_type]

    base_storage = os.path.join("storage", "lodges", "model", subpath)
    os.makedirs(base_storage, exist_ok=True)

    file_path = os.path.join(base_storage, filename)

    # Backup antes de salvar (boas práticas)
    if os.path.exists(file_path):
        shutil.copy2(file_path, file_path + ".bak")

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(payload.content)

        return {"message": "Template universal atualizado com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")
