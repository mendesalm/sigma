from dotenv import load_dotenv

load_dotenv()  # Carrega as variáveis de ambiente do arquivo .env

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from routes import (  # noqa: E402
    attendance_routes,
    auth_routes,
    check_in_routes,
    document_routes,
    event_routes,
    financial_routes,
    lodge_routes,
    member_role_routes,
    member_routes,
    obedience_routes,
    permission_routes,
    role_routes,
    session_routes,
    super_admin_routes,
    webmaster_routes,
)
from scheduler import initialize_scheduler, shutdown_scheduler  # noqa: E402

# Metadata para documentação da API
description = """
## 🏛️ Sistema de Gestão Maçônica Sigma

API RESTful completa para gestão de lojas maçônicas, membros, sessões e documentos.

### 🔐 Autenticação

Todos os endpoints (exceto login) requerem autenticação via **Bearer Token (JWT)**.

**Exemplo de uso**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 👥 Tipos de Usuários

* **SuperAdmin**: Acesso total ao sistema
* **Webmaster**: Gestão de uma loja específica
* **Membro**: Acesso limitado aos seus dados

### 🏛️ Multi-Tenancy

O sistema é multi-tenant, isolando dados por loja. Cada usuário tem acesso apenas aos dados de sua(s) loja(s).

### 📁 Upload de Arquivos

Arquivos são armazenados em estrutura isolada por loja:
```
storage/lodges/loja_{lodge_number}/
├── profile_pictures/{cim}.ext
└── documents/{filename}
```

### 🔗 Links Úteis

* [Documentação Completa](https://github.com/seu-repo/sigma)
* [Issues](https://github.com/seu-repo/sigma/issues)
* [Changelog](https://github.com/seu-repo/sigma/releases)
"""

tags_metadata = [
    {
        "name": "Auth",
        "description": "Autenticação e gestão de tokens JWT. Login para SuperAdmins, Webmasters e Membros.",
    },
    {
        "name": "Super Admins",
        "description": "Gestão de usuários Super Administradores. Operações CRUD e reset de senha.",
    },
    {
        "name": "Webmasters",
        "description": "Gestão de Webmasters. Criação, listagem e reset de senha.",
    },
    {
        "name": "Obediences",
        "description": "Gestão de Obediências Maçônicas (Grandes Lojas). CRUD completo.",
    },
    {
        "name": "Lodges",
        "description": "Gestão de Lojas Maçônicas. CRUD, configurações e associações.",
    },
    {
        "name": "Lodge Members",
        "description": "Gestão de Membros. CRUD, upload de foto, histórico de cargos e familiares.",
    },
    {
        "name": "Roles",
        "description": "Gestão de Cargos Maçônicos. Cargos de loja e obediência.",
    },
    {
        "name": "Permissions",
        "description": "Gestão de Permissões. Sistema RBAC (Role-Based Access Control).",
    },
    {
        "name": "Masonic Sessions",
        "description": "Gestão de Sessões Maçônicas. Agendamento, ciclo de vida e documentação.",
    },
    {
        "name": "Attendance",
        "description": "Controle de Presença em Sessões. Check-in manual e por QR Code.",
    },
    {
        "name": "Check-in",
        "description": "Check-in por QR Code. Valida localização, horário e gera registro de presença/visitação.",
    },
    {
        "name": "Events",
        "description": "Gestão de Eventos. Calendário de atividades da loja.",
    },
    {
        "name": "Documents",
        "description": "Gestão de Documentos. Upload, listagem e geração de PDFs (Balaústres).",
    },
    {
        "name": "Financial",
        "description": "Gestão Financeira. Registro de transações e contribuições.",
    },
    {
        "name": "Root",
        "description": "Health check e informações básicas da API.",
    },
]

app = FastAPI(
    title="Sigma API",
    description=description,
    version="1.0.0",
    contact={
        "name": "Dantec",
        "url": "https://dantec.com.br",
        "email": "suporte@dantec.com.br",
    },
    license_info={
        "name": "Proprietary",
        "url": "https://dantec.com.br/license",
    },
    openapi_tags=tags_metadata,
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
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

# Include routers (BEFORE mounting static files)
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
app.include_router(member_role_routes.router)
app.include_router(role_routes.router)
app.include_router(permission_routes.router)

# Mount static files AFTER routers
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

# Get the project root directory (parent of backend)
BACKEND_DIR = Path(__file__).parent
PROJECT_ROOT = BACKEND_DIR.parent
STORAGE_DIR = PROJECT_ROOT / "storage"

# Create storage directory if it doesn't exist
STORAGE_DIR.mkdir(exist_ok=True)

# Mount the storage directory
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")


@app.get("/", tags=["Root"])
def read_root():
    """A simple health check endpoint."""
    return {"message": "Welcome to the Sigma Backend"}


# To run this application:
# uvicorn main:app --reload

