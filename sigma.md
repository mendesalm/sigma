# Documentação do Projeto SiGMa - Backend

Este documento resume o progresso de desenvolvimento do backend até a data atual.

## 1. Estrutura e Configuração do Projeto

- **Repositório Git:** O projeto foi inicializado como um repositório Git e um arquivo `.gitignore` foi configurado para excluir arquivos desnecessários (ex: `venv`, `__pycache__`, `.env`).
- **Estrutura de Pastas:** Foi estabelecida uma arquitetura em camadas para a aplicação FastAPI, com as seguintes pastas principais:
    - `config/`: Para configurações da aplicação (ex: `settings.py`).
    - `database/`: Para a configuração da conexão com o banco de dados.
    - `middleware/`: Para dependências de segurança e autorização.
    - `models/`: Contém os modelos de dados SQLAlchemy (`models.py`).
    - `routes/`: Define os endpoints da API.
    - `schemas/`: Contém os schemas Pydantic para validação de dados.
    - `services/`: Contém a lógica de negócio principal.
- **Banco de Dados:**
    - O `Alembic` foi configurado para gerenciar as migrações do banco de dados.
    - Após dificuldades iniciais, o schema do banco de dados `sigma_db` foi criado e o Alembic foi sincronizado com o estado atual.

## 2. Funcionalidades Implementadas

### 2.1. Autenticação e Autorização

Foi implementado um sistema de autenticação e autorização robusto e flexível:

- **Login Unificado (`POST /token`):** Um único endpoint para autenticar todos os tipos de usuário (`SuperAdmin`, `Webmaster`, `Member`).
    - O login para membros aceita **email** ou **CIM**.
- **Fluxo de Múltiplas Associações:** Se um membro pertence a mais de uma loja, o login ocorre em dois passos:
    1.  A API retorna um status `selection_required` com a lista de lojas e um token temporário.
    2.  Um novo endpoint (`POST /token/select`) recebe a escolha do usuário e retorna o token de acesso final, com o contexto da loja selecionada.
- **Tokens JWT:** A autenticação é baseada em JSON Web Tokens, que contêm o escopo (`scope`) e o contexto do usuário (ex: `lodge_id`).
- **Proteção de Rotas:** Foi criada uma camada de `middleware` com dependências (`get_current_user`, `get_current_super_admin`) para proteger os endpoints, garantindo que apenas usuários autorizados possam realizar certas ações.

### 2.2. Endpoints da API

Foram implementados os endpoints CRUD (Create, Read, Update, Delete) para os seguintes modelos, com as rotas de modificação devidamente protegidas:

- **Health Check (`GET /health`):** Verifica a saúde da aplicação e a conexão com o banco.
- **Obediences (`/obediences`):** Gerenciamento de Potências/Obediências.
- **Lodges (`/lodges`):** Gerenciamento de Lojas.
- **Roles (`/roles`):** Gerenciamento de Cargos.
- **Permissions (`/permissions`):** Gerenciamento de Permissões.
- **Super Admins (`/super-admins`):** Gerenciamento de Super Administradores.

### 2.3. Seeding de Dados

- Foi criado um script (`seed_super_admin.py`) para popular o banco de dados com um usuário SuperAdmin inicial, permitindo o primeiro login e o teste do sistema.
    - **Usuário:** `sigma_sa@sigma.com`
    - **Senha:** `Cd@Sigma#33`
