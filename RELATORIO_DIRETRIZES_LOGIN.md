
# Relatório de Diretrizes de Login - Sistema Sigma (Backend)

Este documento detalha o fluxo de autenticação, autorização e gerenciamento de sessão implementado no backend do sistema Sigma, com base na análise e reconstrução do código-fonte.

---

## 1. Visão Geral do Fluxo

O sistema utiliza um fluxo de autenticação moderno e seguro baseado em tokens. O processo pode ser resumido da seguinte forma:

1.  O usuário envia suas credenciais (identificador + senha) para um endpoint público da API.
2.  O backend verifica as credenciais em diferentes tabelas de usuários, em uma ordem pré-definida.
3.  Se as credenciais forem válidas, o backend gera um **JSON Web Token (JWT)**, que contém informações sobre a identidade e o perfil do usuário.
4.  Este token é retornado ao frontend.
5.  Para acessar rotas protegidas da API, o frontend deve incluir este token no cabeçalho de cada requisição.
6.  O backend valida o token em cada requisição a uma rota protegida antes de permitir o acesso.

---

## 2. Endpoint de Login

- **URL**: `/auth/token`
- **Método**: `POST`
- **Arquivo de Rota**: `backend/routes/auth_routes.py`
- **Formato do Request**: O endpoint segue o padrão OAuth2 e espera um formulário do tipo `application/x-www-form-urlencoded` com os seguintes campos:
    - `username`: O identificador do usuário.
    - `password`: A senha do usuário.

---

## 3. Processo de Autenticação

A lógica central de validação de credenciais está no arquivo `backend/services/auth_service.py`.

### 3.1. Identificador do Usuário

O campo `username` enviado no formulário de login é tratado como um **identificador genérico**. O sistema o utilizará para buscar o usuário em diferentes colunas e tabelas, conforme a diretriz.

### 3.2. Ordem e Lógica de Verificação

O sistema busca pelo identificador na seguinte ordem de prioridade:

1.  **Tabela `super_admins`**: Procura por uma correspondência nos campos `username` ou `email`.
2.  **Tabela `webmasters`**: Se não encontrar um SuperAdmin, procura por uma correspondência nos campos `username` ou `email`.
3.  **Tabela `members`**: Se não encontrar um Webmaster, procura por uma correspondência nos campos `email` ou `CIM`.

### 3.3. Verificação de Senha

- **Arquivo de Lógica**: `backend/utils/password_utils.py`
- **Algoritmo**: A comparação de senhas não é feita em texto plano. O sistema utiliza a biblioteca `passlib` com o algoritmo **bcrypt** para verificar se a senha fornecida corresponde ao *hash* seguro armazenado no banco de dados (`password_hash`).

---

## 4. Geração de Token (Sessão)

- **Arquivo de Lógica**: `backend/utils/auth_utils.py`
- **Tecnologia**: JSON Web Token (JWT).
- **Algoritmo de Assinatura**: HS256, utilizando uma chave secreta definida em `backend/config.py`.

### 4.1. Conteúdo do Token (Payload)

Se a autenticação for bem-sucedida, um token JWT é gerado com as seguintes informações (payload):

- `sub` (Subject): O `email` do usuário, servindo como identificador principal dentro do token.
- `exp` (Expiration Time): A data e hora de expiração do token. Por padrão, está configurado para expirar em **7 dias**.
- `user_id`: O ID numérico do usuário na sua respectiva tabela.
- `user_type`: Uma string que identifica o perfil do usuário. Pode ser `"super_admin"`, `"webmaster"` ou `"member"`. Este campo é essencial para o frontend decidir qual dashboard ou interface apresentar.
- **Contexto Adicional**: Para usuários do tipo `webmaster`, o payload também inclui `lodge_id` ou `obedience_id`, permitindo que o sistema isole os dados corretamente.

---

## 5. Autorização em Rotas Protegidas

- **Arquivo de Lógica**: `backend/dependencies.py`
- **Mecanismo**: Para proteger um endpoint, ele deve usar a dependência `get_current_user_payload`.
- **Validação**: Esta dependência extrai e valida o token JWT enviado no cabeçalho `Authorization` de cada requisição.
    - Se o token estiver ausente, for inválido ou estiver expirado, a API retorna automaticamente um erro `HTTP 401 Unauthorized`, bloqueando o acesso.
    - Se o token for válido, a função retorna o *payload* decodificado, que pode ser usado dentro da rota para verificações de permissão mais refinadas (ex: "Este usuário é um webmaster de loja?").
