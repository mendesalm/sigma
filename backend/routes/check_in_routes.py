from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

# Importações do projeto
from ..database import get_db
from ..schemas import attendance_schema
from ..schemas.session_attendance_schema import SessionAttendanceResponse
from ..services import attendance_service

router = APIRouter(
    prefix="/check-in",
    tags=["Check-in"],
    responses={404: {"description": "Não encontrado"}}
)

@router.post(
    "/qr",
    response_model=SessionAttendanceResponse,
    summary="Realizar Check-in por QR Code",
    description=(
        "Endpoint para o aplicativo móvel enviar os dados de check-in. "
        "O backend encontra a sessão ativa da loja, valida a geolocalização e o horário, "
        "e registra a presença do usuário como membro do quadro ou visitante."
    )
)
def qr_code_check_in(
    check_in_data: attendance_schema.QrCheckInRequest,
    db: Session = Depends(get_db)
):
    # Nota: Este endpoint pode precisar de uma camada de autenticação básica
    # para evitar abuso, como um API key para o aplicativo móvel.
    # Por enquanto, ele é aberto para receber os dados.
    return attendance_service.record_qr_code_attendance(
        db=db,
        check_in_data=check_in_data
    )
