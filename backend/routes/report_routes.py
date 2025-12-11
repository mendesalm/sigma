from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from database import get_db
from services.report_service import ReportService
from dependencies import get_current_user_payload
from models import models

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

@router.get("/lodge/{lodge_id}/members/pdf")
async def get_members_report_pdf(
    lodge_id: int,
    show_email: bool = Query(False, description="Include email column"),
    show_phone: bool = Query(False, description="Include phone column"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user_payload)
):
    """
    Generates a PDF report of active members for a specific lodge.
    """
    # Authorization check
    user_type = current_user.get("user_type")
    if user_type not in ["super_admin", "webmaster"]:
        # Se for membro, verifica se tem permissão de secretaria na loja
        # TODO: Implementar verificação fina de permissão. 
        # Por enquanto, assumimos que quem acessa a rota já passou pelo filtro do frontend
        pass

    try:
        pdf_bytes = await ReportService.generate_members_report_pdf(
            db=db, 
            lodge_id=lodge_id, 
            show_email=show_email, 
            show_phone=show_phone
        )
        
        # Create a streaming response
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=quadro_obreiros_loja_{lodge_id}.pdf"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error generating report")
