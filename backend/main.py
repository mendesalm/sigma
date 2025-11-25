
from dotenv import load_dotenv
load_dotenv() # Carrega as variáveis de ambiente do arquivo .env

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import (
    attendance_routes,
    auth_routes,
    check_in_routes,
    document_routes,
    event_routes,
    financial_routes,
    lodge_routes,
    member_routes,
    obedience_routes,
    session_routes,
    super_admin_routes,
    webmaster_routes,
)
from .scheduler import initialize_scheduler, shutdown_scheduler

app = FastAPI(
    title="Sigma Backend",
    description="Backend for the Sigma project.",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    """Inicia o agendador de tarefas quando a aplicação é iniciada."""
    initialize_scheduler()

@app.on_event("shutdown")
def shutdown_event():
    """Desliga o agendador de tarefas quando a aplicação é encerrada."""
    shutdown_scheduler()

# Configure CORS
# IMPORTANT: In production, you should restrict the origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(obedience_routes.router)
app.include_router(lodge_routes.router)
app.include_router(member_routes.router)
app.include_router(document_routes.router)
app.include_router(event_routes.router)
app.include_router(financial_routes.router)
app.include_router(session_routes.router)
app.include_router(attendance_routes.router)
app.include_router(check_in_routes.router)
app.include_router(super_admin_routes.router)
app.include_router(webmaster_routes.router)

@app.get("/", tags=["Root"])
def read_root():
    """A simple health check endpoint."""
    return {"message": "Welcome to the Sigma Backend"}

# To run this application:
# uvicorn main:app --reload
