# 🏛️ Sistema Sigma - Gestão Maçônica

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11%2B-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)
![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

API RESTful completa para gestão de lojas maçônicas, membros, sessões e documentos.

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando](#executando)
- [Documentação da API](#documentação-da-api)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Multi-Tenancy](#multi-tenancy)
- [Autenticação](#autenticação)
- [Contribuindo](#contribuindo)

---

## ✨ Características

- 🏛️ **Multi-Tenant**: Isolamento completo de dados por loja
- 🔐 **Autenticação JWT**: Sistema de autenticação robusto
- 👥 **RBAC**: Controle de acesso baseado em roles
- 📸 **Upload de Arquivos**: Fotos de perfil e documentos
- 📅 **Gestão de Sessões**: Ciclo completo de sessões maçônicas
- ✅ **Check-in por QR Code**: Com validação geográfica e temporal
- 📊 **Documentação Automática**: Swagger UI e ReDoc
- 🎯 **TypeScript**: Frontend completamente tipado
- 🎨 **Material-UI**: Interface moderna e responsiva

---

## 🛠️ Tecnologias

### Backend
- **FastAPI**: Framework web moderno e performático
- **SQLAlchemy**: ORM para Python
- **PostgreSQL**: Banco de dados relacional
- **Pydantic**: Validação e serialização de dados
- **JWT**: Autenticação stateless
- **APScheduler**: Agendamento de tarefas

### Frontend
- **React 18**: Biblioteca UI
- **TypeScript**: Tipagem estática
- **Material-UI v5**: Componentes UI
- **React Router**: Navegação
- **Axios**: Cliente HTTP
- **Vite**: Build tool

---

## 📌 Pré-requisitos

- **Python**: 3.11 ou superior
- **Node.js**: 18 ou superior
- **PostgreSQL**: 14 ou superior
- **Git**: Para controle de versão

---

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-repo/sigma.git
cd sigma
```

### 2. Backend Setup

```bash
# Navegar para o diretório do backend
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navegar para o diretório do frontend
cd ../frontend

# Instalar dependências
npm install
```

---

## ⚙️ Configuração

### 1. Banco de Dados

Crie um banco de dados PostgreSQL:

```sql
CREATE DATABASE sigma_db;
CREATE USER sigma_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE sigma_db TO sigma_user;
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
# Database
DATABASE_URL=postgresql://sigma_user:sua_senha_segura@localhost:5432/sigma_db

# JWT
SECRET_KEY=sua_chave_secreta_muito_segura_aqui
    ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Email (opcional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_app

# Environment
ENVIRONMENT=development
```

Crie um arquivo `.env` na pasta `frontend/`:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Inicializar Banco de Dados

```bash
cd backend

# Gerar SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copie o resultado para o .env

# Criar tabelas
alembic upgrade head

# Criar SuperAdmin inicial
python seed_super_admin.py
```

---

## 🏃 Executando

### Backend

```bash
cd backend

# Ativar ambiente virtual
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Iniciar servidor
uvicorn main:app --reload

# Servidor rodando em: http://localhost:8000
```

### Frontend

```bash
cd frontend

# Iniciar dev server
npm run dev

# Aplicação rodando em: http://localhost:5173
```

---

## 📚 Documentação da API

Após iniciar o backend, acesse:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Principais Endpoints

#### Autenticação
```http
POST /auth/token
POST /auth/select-affiliation
```

#### Membros
```http
GET    /members
POST   /members
GET    /members/{id}
PUT    /members/{id}
DELETE /members/{id}
POST   /members/{id}/photo
```

#### Lojas
```http
GET    /lodges
POST   /lodges
GET    /lodges/{id}
PUT    /lodges/{id}
DELETE /lodges/{id}
```

#### Sessões
```http
GET    /masonic-sessions
POST   /masonic-sessions
GET    /masonic-sessions/{id}
POST   /masonic-sessions/{id}/start
POST   /masonic-sessions/{id}/end
```

---

## 📁 Estrutura do Projeto

```
sigma/
├── backend/
│   ├── alembic/              # Migrações do banco
│   ├── models/               # Modelos SQLAlchemy
│   ├── routes/               # Endpoints da API
│   ├── schemas/              # Schemas Pydantic
│   ├── services/             # Lógica de negócio
│   ├── utils/                # Utilitários
│   ├── main.py               # App principal
│   └── requirements.txt      # Dependências Python
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/            # Páginas
│   │   ├── services/         # Serviços API
│   │   ├── hooks/            # Custom hooks
│   │   ├── context/          # Context providers
│   │   ├── types/            # TypeScript types
│   │   └── main.tsx          # Entry point
│   └── package.json          # Dependências Node
│
├── storage/                  # Arquivos (gitignored)
│   └── lodges/
│       └── loja_{number}/
│           ├── profile_pictures/
│           └── documents/
│
├── docs/                     # Documentação
└── README.md                 # Este arquivo
```

---

## 🎯 Funcionalidades

### Gestão de Usuários
- ✅ Super Admins (acesso total)
- ✅ Webmasters (gestão de loja)
- ✅ Membros (auto-gestão)
- ✅ Reset de senha
- ✅ Login com múltiplas afiliações

### Gestão de Membros
- ✅ CRUD completo
- ✅ Upload de foto de perfil
- ✅ Histórico de cargos
- ✅ Cadastro de familiares
- ✅ Graus maçônicos
- ✅ Decorações

### Gestão de Sessões
- ✅ Agendamento
- ✅ Início automático (2h antes)
- ✅ Controle de presença
- ✅ Check-in por QR Code
- ✅ Registro de visitantes
- ✅ Geração de Balaústre

### Gestão de Lojas
- ✅ CRUD de lojas
- ✅ Configurações
- ✅ QR Code único
- ✅ Webmaster dedicado
- ✅ Dados de localização

---

## 🏛️ Multi-Tenancy

O sistema implementa multi-tenancy rigoroso:

- **Isolamento de Dados**: Cada loja tem seus próprios dados
- **Contexto no Token**: JWT contém `lodge_id`
- **Validação Automática**: Middleware verifica acesso
- **Storage Isolado**: Arquivos separados por loja

### Estrutura de Armazenamento

```
storage/lodges/
├── loja_2181/
│   ├── profile_pictures/
│   │   ├── 272875.jpg
│   │   └── 123456.jpg
│   └── documents/
│       └── balaustre_2024_11.pdf
│
└── loja_3050/
    ├── profile_pictures/
    │   └── 456789.jpg
    └── documents/
```

---

## 🔐 Autenticação

### Fluxo de Login

1. **POST /auth/token** com credenciais
2. Recebe token JWT
3. Se múltiplas afiliações → seleciona contexto
4. **POST /auth/select-affiliation** com escolha
5. Recebe novo token com `lodge_id`
6. Usa token em todas as requisições

### Exemplo de Request

```bash
# Login
curl -X POST "http://localhost:8000/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@email.com&password=senha123"

# Usar token
curl -X GET "http://localhost:8000/members" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📸 Upload de Fotos

### Formato

```bash
POST /members/{member_id}/photo
Content-Type: multipart/form-data

file: [arquivo de imagem]
```

### Validações

- ✅ Membro deve ter CIM
- ✅ Usuário autorizado (Webmaster ou SuperAdmin)
- ✅ Formato de imagem válido

### Exemplo

```bash
curl -X POST "http://localhost:8000/members/1/photo" \
  -H "Authorization: Bearer {token}" \
  -F "file=@foto.jpg"
```

### Response

```json
{
  "filename": "272875.jpg",
  "path": "/storage/lodges/loja_2181/profile_pictures/272875.jpg"
}
```

---

## 🧪 Testes

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

---

## 📝 Migrações do Banco

```bash
# Criar nova migração
alembic revision --autogenerate -m "Descrição da mudança"

# Aplicar migrações
alembic upgrade head

# Reverter migração
alembic downgrade -1
```

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -am 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário. © 2025 Dantec. Todos os direitos reservados.

---

## 👥 Equipe

**Desenvolvido por**: Dantec  
**Email**: suporte@dantec.com.br  
**Website**: https://dantec.com.br

---

## 🆘 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato via suporte@dantec.com.br

---

## 📊 Status do Projeto

✅ **Em Produção** - Sistema estável e em uso ativo

### Roadmap

- [ ] Dashboard com métricas
- [ ] Relatórios PDF customizáveis
- [ ] Integração com sistemas externos
- [ ] App mobile
- [ ] Notificações push
- [ ] Chat interno

---

**Última atualização**: 28/11/2025
