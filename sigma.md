# Manual Técnico: Projeto SiGMa - Backend

Este documento serve como um guia técnico abrangente para a arquitetura, funcionalidades e regras de negócio implementadas no backend do sistema SiGMa.

---

## 1. Visão Geral e Arquitetura

O backend é construído em **Python** usando o framework **FastAPI**, escolhido por sua alta performance, tipagem moderna e geração automática de documentação interativa (Swagger UI).

A arquitetura segue um padrão de **camadas de serviço (service-oriented)**, visando uma clara separação de responsabilidades:

- **Camada de Rotas (`routes/`):** Responsável por definir os endpoints da API, lidar com a comunicação HTTP (métodos, status codes) e validar os dados de entrada/saída usando Schemas Pydantic. Esta camada orquestra as requisições, chamando os serviços apropriados.
- **Camada de Serviços (`services/`):** Contém a lógica de negócio principal e as interações com o banco de dados. É aqui que as regras são aplicadas e as consultas são executadas através do SQLAlchemy ORM.

O diretório `controllers/` existe mas está atualmente em desuso, pois a lógica que ele abrigaria foi absorvida pela camada de serviços para simplificar a arquitetura.

### 1.1. Estrutura de Pastas

```
backend/
├── alembic/              # Configurações e scripts de migração do Alembic
├── config/               # Configurações da aplicação (settings.py)
├── middleware/           # Dependências de segurança e autorização
├── models/               # Modelos de dados SQLAlchemy (schema do DB)
├── routes/               # Definição dos endpoints da API
├── schemas/              # Schemas Pydantic para validação
├── services/             # Lógica de negócio da aplicação
├── venv/                 # Ambiente virtual Python
├── .env                  # Arquivo para variáveis de ambiente (credenciais)
├── alembic.ini           # Arquivo de configuração do Alembic
├── main.py               # Ponto de entrada da aplicação FastAPI
```

--- 

## 2. Configuração do Ambiente de Desenvolvimento

Para executar o projeto, siga os seguintes passos:

1.  **Instalar Dependências:**
    As dependências do projeto são gerenciadas pelo ambiente virtual. Certifique-se de que o `venv` está ativo. Se precisar instalar uma nova biblioteca, use `pip install <biblioteca>`.
2.  **Configurar Variáveis de Ambiente:**
    - Crie ou edite o arquivo `.env` na raiz da pasta `backend`. Ele deve conter pelo menos as seguintes chaves:
      ```
      DATABASE_URL="mysql+pymysql://user:pass@host:port/dbname"
      JWT_SECRET="sua_chave_secreta_super_longa_e_segura"
      ```
3.  **Banco de Dados:**
    - Assegure que o banco de dados especificado em `DATABASE_URL` exista.
    - Aplique as migrações para criar as tabelas:
      ```bash
      # A partir da pasta `backend` e com o venv ativado
      python -m alembic upgrade head
      ```


5.  **Iniciar o Servidor:**
    ```bash
    # Use o reload para desenvolvimento, para que o servidor reinicie a cada mudança
    python -m uvicorn main:app --reload
    ```
    - A API estará disponível em `http://127.0.0.1:8000`.
    - A documentação interativa (Swagger) estará em `http://127.0.0.1:8000/docs`.


---

## 3. Autenticação e Autorização

O sistema possui um fluxo de autenticação flexível e seguro projetado para suportar múltiplos perfis de usuário.

### 3.1. Regras de Negócio

- **Login Único:** Todos os usuários utilizam uma única tela de login e um único endpoint (`POST /token`). 
- **Identificadores de Login:**
    - **SuperAdmin/Webmaster:** Login via `username`.
    - **Member (Membro):** Login via `email` ou `CIM` (Cadastro de Identificação Maçônica).
- **Seleção de Contexto para Membros:** Se um membro possui afiliação com mais de uma loja, o login ocorre em **dois passos** para que ele possa escolher em qual contexto deseja operar:
    1.  Após a validação das credenciais, a API retorna um status `selection_required` com a lista de lojas disponíveis e um `selection_token` temporário.
    2.  O frontend deve então chamar um segundo endpoint (`POST /token/select`), enviando o `selection_token` e o `lodge_id` escolhido para obter o token de acesso final e com escopo definido.
- **Segurança de Senha:** As senhas nunca são armazenadas em texto plano. Elas são hasheadas com o algoritmo **bcrypt**.

### 3.2. Fluxo Técnico (JWT)

- **Token JWT:** A autenticação é baseada em **JSON Web Tokens**. Após o login bem-sucedido, um token é gerado.
- **Payload do Token:** O token contém um `payload` com informações cruciais para a autorização:
    - `sub`: O identificador do usuário (`username` ou `email`).
    - `exp`: Timestamp de expiração do token.
    - `scope`: Define o "perfil" do usuário (ex: `super_admin`, `webmaster_lodge`, `member`).
    - `lodge_id` / `obedience_id`: IDs de contexto, quando aplicável.
- **Proteção de Endpoints:**
    - A pasta `middleware/dependencies.py` contém as funções de segurança.
    - `get_current_user`: Dependência principal que valida o token e carrega o objeto do usuário.
    - `get_current_super_admin`: Dependência que garante que o usuário tem o escopo `super_admin`.
    - Endpoints que modificam dados (`POST`, `PUT`, `DELETE`) são protegidos com essas dependências.

---

## 4. Endpoints da API Implementados

A seguir, a lista de módulos com endpoints CRUD implementados.

*Nota: Em geral, as rotas de leitura (`GET`) são públicas, enquanto as de modificação (`POST`, `PUT`, `DELETE`) requerem autenticação de SuperAdmin.*

- **Authentication (`/token`, `/token/select`):** Endpoints de login e seleção de contexto.
- **Health Check (`/`):** Endpoint público para verificação de status.
- **Obediences (`/obediences`):** CRUD completo para gerenciamento de Potências/Obediências.
- **Lodges (`/lodges`):** CRUD completo para gerenciamento de Lojas.
- **Members (`/members`):** CRUD para gerenciamento de Membros de uma loja.
- **Roles (`/roles`):** CRUD completo para gerenciamento de Cargos.
- **Permissions (`/permissions`):** CRUD completo para gerenciamento de Permissões.