# Documentação Técnica e Operacional: Módulo Access Control

## Visão Geral
O módulo de **Access Control** é o núcleo de segurança do projeto Sigma. Ele gerencia a autenticação de usuários (Membros, Webmasters, Super Admins) e o controle de acesso baseado em atributos e papéis (ABAC/RBAC).

## Arquitetura
1. **Modelos**:
   - `SuperAdmin`: Acesso global.
   - `Webmaster`: Acesso restrito a escopos (Loja ou Obediência).
   - `RefreshToken`: Tabela para armazenar e validar tokens opacos com suporte a revogação.
2. **Rotas (`auth_routes.py`)**:
   - `POST /auth/login`: Autenticação unificada (Aceita e-mail, CIM, username). Retorna JWT e injeta Cookie `HttpOnly` com Refresh Token.
   - `POST /auth/token/select-association`: Rota para membros com múltiplas filiações escolherem a Loja/Obediência ativa na sessão atual (injetando `lodge_id` ou `obedience_id` no payload do JWT).
   - `POST /auth/refresh`: Atualização segura de token via Cookie.
3. **Serviços (`auth_service.py`)**:
   - Valida credenciais usando `passlib.context.CryptContext`.
   - Lógica de cálculo de `credential` (para webmasters = 1000, secretários = 100, etc.).

## Regras de Negócio e Segurança
- **Proteção contra Cross-Tenant**: Um membro não pode acessar dados de outra Loja. O `lodge_id` é forçado pelo backend (via validação de `AssociationSelection`), impedindo manipulações do frontend.
- **Auditoria**: Ações críticas como `LOGIN` são registradas via `AuditLog` para rastreamento (IP, User ID).
- **Gerenciamento de Sessão**: Implementa expiração do Access Token (15m) e Refresh Token em banco de dados (7 dias) com suporte a invalidação.

## Próximos Passos (Incremental)
- [ ] Implementar blacklist de Access Tokens usando Redis.
- [ ] Suporte nativo a Single Sign-On (SSO).
