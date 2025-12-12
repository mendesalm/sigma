# Manual Técnico: Projeto SiGMa - Backend

Este documento serve como um guia técnico abrangente para a arquitetura, funcionalidades e regras de negócio implementadas no backend do sistema SiGMa.

---

## 1. Visão Geral e Arquitetura

O backend é construído em **Python** usando o framework **FastAPI**, escolhido por sua alta performance, tipagem moderna e geração automática de documentação interativa (Swagger UI).

A arquitetura segue um padrão de **camadas de serviço (service-oriented)**, visando uma clara separação de responsabilidades:

- **Camada de Rotas (`routes/`):** Responsável por definir os endpoints da API, lidar com a comunicação HTTP (métodos, status codes) e validar os dados de entrada/saída usando Schemas Pydantic. Esta camada orquestra as requisições, chamando os serviços apropriados.
- **Camada de Serviços (`services/`):** Contém a lógica de negócio principal e as interações com o banco de dados. É aqui que as regras são aplicadas e as consultas são executadas através do SQLAlchemy ORM.

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
      SECRET_KEY="sua_chave_secreta_super_longa_e_segura"
      ```
3.  **Banco de Dados:**
    - Assegure que o banco de dados especificado em `DATABASE_URL` exista.
    - Aplique as migrações para criar as tabelas:
      ```bash
      # A partir da pasta `backend` e com o venv ativado
      alembic upgrade head
      ```
5.  **Iniciar o Servidor:**
    ```bash
    # Use o reload para desenvolvimento, para que o servidor reinicie a cada mudança
    uvicorn main:app --reload
    ```
    - A API estará disponível em `http://127.0.0.1:8000`.
    - A documentação interativa (Swagger) estará em `http://127.0.0.1:8000/docs`.


---

## 3. Autenticação e Autorização

O sistema possui um fluxo de autenticação flexível e seguro projetado para suportar múltiplos perfis de usuário.

### 3.1. Regras de Negócio

- **Login Único:** Todos os usuários utilizam uma única tela de login e um único endpoint (`POST /auth/login`). 
- **Identificadores de Login:**
    - **SuperAdmin/Webmaster:** Login via `username` ou `email`.
    - **Member (Membro):** Login via `email` ou `CIM` (Cadastro de Identificação Maçônica).
- **Seleção de Contexto para Membros:** Se um membro possui afiliação com mais de uma loja ou obediência, o login ocorre em **dois passos**:
    1.  Após a validação das credenciais, a API retorna um token JWT contendo a flag `requires_selection: true` e a lista de afiliações (`associations`).
    2.  O frontend exibe uma tela de seleção. Após o usuário escolher, o frontend chama o endpoint `POST /auth/token/select-association`, enviando a afiliação escolhida para obter um novo token de acesso, agora com o escopo definido.
- **Segurança de Senha:** As senhas nunca são armazenadas em texto plano. Elas são hasheadas com o algoritmo **bcrypt**.

### 3.2. Fluxo Técnico (JWT)

- **Token JWT:** A autenticação é baseada em **JSON Web Tokens**. Após o login bem-sucedido, um token é gerado.
- **Payload do Token:** O token contém um `payload` com informações cruciais para a autorização:
    - `sub`: O `email` do usuário.
    - `exp`: Timestamp de expiração do token.
    - `user_id`: O ID do usuário.
    - `user_type`: Define o "perfil" do usuário (ex: `super_admin`, `webmaster`, `member`).
    - `lodge_id` / `obedience_id`: IDs de contexto, quando aplicável.
- **Proteção de Endpoints:**
    - A pasta `dependencies.py` contém as funções de segurança.
    - `get_current_user_payload`: Dependência principal que valida o token e carrega o payload.
    - Endpoints que modificam dados (`POST`, `PUT`, `DELETE`) são protegidos com dependências que validam o token e, quando necessário, as permissões do usuário.

---

## 4. Endpoints da API Implementados

A seguir, a lista de módulos com endpoints implementados.

*Nota: Em geral, as rotas de leitura (`GET`) são públicas ou semi-públicas, enquanto as de modificação (`POST`, `PUT`, `DELETE`) requerem autenticação e autorização adequadas.*

- **Authentication (`/auth`):** Endpoints de login e seleção de contexto.
- **Health Check (`/`):** Endpoint público para verificação de status.
- **Super Admins (`/super-admins`):** CRUD completo para gerenciamento de Super Admins e reset de senha.
- **Webmasters (`/webmasters`):** CRUD completo para gerenciamento de Webmasters e reset de senha.
- **Obediences (`/obediences`):** CRUD completo para gerenciamento de Potências/Obediências.
- **Lodges (`/lodges`):** CRUD completo para gerenciamento de Lojas.
- **Members (`/members`):** CRUD para gerenciamento de Membros de uma loja.
- **Roles (`/roles`):** CRUD completo para gerenciamento de Cargos.
- **Permissions (`/permissions`):** CRUD completo para gerenciamento de Permissões.
- **Sessions (`/sessions`):** Gerenciamento do ciclo de vida das sessões maçônicas.
- **Attendance (`/attendance`):** Gerenciamento de presença nas sessões.
- **Check-in (`/check-in`):** Endpoint para registro de presença via QR Code.
- **Documents (`/documents`):** Gerenciamento de documentos.
- **Events (`/events`):** Gerenciamento de eventos.
- **Financials (`/financials`):** Gerenciamento de transações financeiras.

## 5. Funcionalidades por Perfil

O sistema oferece funcionalidades segmentadas por perfil de acesso, refletidas na estrutura de menus do Dashboard.

### 5.1. Obreiros (Membros)

Funcionalidades disponíveis para todos os membros ativos da loja.

- **Meu Cadastro:** Visualização e atualização de dados pessoais, foto de perfil, dados profissionais e contatos.
- **Minhas Presenças:** Histórico completo de presenças em sessões da loja, com indicadores de frequência.
- **Minhas Visitações:** Registro e histórico de visitas a outras lojas (inter-lojas).
- **Publicações:** Acesso a Boletins Oficiais, Atos e Decretos publicados pela loja ou potência.
- **Meus Anúncios:** Classificados internos para oferta de produtos e serviços entre irmãos.
- **Meus Empréstimos:** Controle de livros e materiais retirados da biblioteca da loja.

### 5.2. Secretaria

Módulo administrativo para o Irmão Secretário, focado na gestão burocrática e documental.

- **Gestão de Irmãos:**
    - **Cadastro de Membros:** CRUD completo de obreiros, incluindo dados maçônicos (Graus, CIM) e profanos.
    - **Relatórios do Quadro:** Listagens exportáveis de membros ativos, inativos e dados estatísticos.
- **Sessões Maçônicas:**
    - **Agenda:** Criação e agendamento de sessões com definição de Grau, Ordem do Dia e Horários.
    - **Registro de Presenças:** Controle manual e validação de presença de obreiros e visitantes.
- **Documentos:**
    - **Balaústres (Atas):** Editor rico para redação de atas, com preenchimento automático de cabeçalho, oficiais (com substituição dinâmica) e estatísticas. Geração de PDF e assinatura digital.
    - **Publicações:** Criação e distruição de editais e boletins.
- **Processos:**
    - **Admissão:** Fluxo de workflow para iniciação de novos candidatos (em breve).
- **Exercícios Maçônicos:**
    - **Gestão de Diretoria:** Cadastro das administrações (biênios) e nomeação da oficialidade titular.

### 5.3. Chancelaria

Módulo administrativo para o Irmão Chanceler, focado no controle de frequência e hospitalaria.

- **Cadastro:** Visão auxiliar dos dados dos membros para controle de datas comemorativas (aniversários).
- **Presenças:** Monitoramento da frequência global da loja e alertas de assiduidade.
- **Visitações:** Gestão de registros de obreiros da loja visitando outros orientes.
- **Visitantes:** Cadastro de maçons visitantes (de outras lojas) recebidos em sessões, integrado ao Livro de Presenças.
- **Gestão de Comissões:** Organização de comissões internas e grupos de trabalho.

### 5.4. Webmaster / Administração

Funcionalidades técnicas e de configuração da Loja.

- **Minha Loja:** Configuração dos dados cadastrais da loja, endereço, rito e dias de reunião.
- **Administrações:** Histórico de venerabilatos e diretorias passadas.
- **Documentos (Configuração):** Personalização de templates para geração de PDFs (Cabeçalhos, Rodapés, Brasões).
- **Usuários:** Gestão de acesso e recuperação de senhas para oficiais.