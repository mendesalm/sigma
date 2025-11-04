from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import sqlalchemy as sa
from database import get_db
from routes import obedience_routes, lodge_routes, role_routes, permission_routes, auth_routes, super_admin_routes # Adicionado super_admin_routes

app = FastAPI(
    title="SiGMa API",
    description="Sistema de Gestão Maçônica",
    version="0.1.0"
)

# Inclui as rotas
app.include_router(auth_routes.router)
app.include_router(obedience_routes.router)
app.include_router(lodge_routes.router)
app.include_router(role_routes.router)
app.include_router(permission_routes.router)
app.include_router(super_admin_routes.router) # Inclui as rotas de Super Admins

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Endpoint para verificar a saúde da aplicação e a conexão com o banco de dados.
    """
    try:
        # Tenta executar uma query simples para verificar a conexão com o DB
        db.execute(sa.text("SELECT 1"))
        return {"status": "ok", "database_connection": "successful"}
    except Exception as e:
        return {"status": "error", "database_connection": f"failed: {e}"}
