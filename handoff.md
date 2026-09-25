# Documento de Handoff - Ecossistema Sigma / Lojas / CoReVM / Harmonia (25/09/2026)

**Data de Atualização:** 25 de Setembro de 2026  
**Status da Sessão:** 🟢 Design System Soberano implantado, Favicons em ouro maçônico padronizados, Telas de Login de todo o ecossistema unificadas (clones visuais do e-Sigma) e Deploys automáticos ativos e validados na VPS (`srv854308`).

---

## 🎯 Contexto Consolidado da Sessão (25/09/2026)

### 1. Design System Soberano (Glassmorphism & Ouro Maçônico)
- **Visual Dark Soberano**: Fundo Abissal (`#050508`), partículas animadas em canvas (`HeroBackground`), cards em Deep Blue Glass (`.card-deep-blue-glass`), tipografia alternando Branco Puro e Ouro Maçônico (`#FDE68A` -> `#DDB96B` -> `#B8862D`).
- **Botões Pill com Aro Chanfrado Metálico**: Implementadas classes `.btn-masonic-pill .btn-pill-blue` e `.btn-pill-gold` em todos os frontends (`e-sigma`, `Lojas`, `CoReVM`, `Harmonia`).
- **Padronização de Favicons e Logotipos**: Favicons dourados e `favicon.ico` gerados para todos os 4 domínios com versionamento `?v=3` contra cache.

### 2. Telas de Login Unificadas (Clones Visuais do e-Sigma)
- Padronização rigorosa de layout, cards, proporções e tipografia em `e-sigma`, `Lojas`, `CoReVM` e `Harmonia`.
- Diferenciação exclusiva pelos logotipos oficiais de cada aplicação: `LogoAnimadaSigma`, `LogoAnimadaLojas`, `LogoAnimadaCore` e `LogoAnimadaHarmonia`.
- Preservação total de regras de autenticação (OAuth Google, IdP e-Sigma, seleção multi-lojas e troca de senha obrigatória).

### 3. Pipeline de Deploy Contínuo na VPS (`srv854308`)
- Todos os repositórios com automação GitHub Actions via SSH (`appleboy/ssh-action`).
- Testado e validado via requisições HTTP diretas nos domínios de produção:
  - `https://e-sigma.app` (HTTP 200)
  - `https://lojas.e-sigma.app` (HTTP 200)
  - `https://core.e-sigma.app` (HTTP 200)
  - `https://harmonia.e-sigma.app` (HTTP 200)

---

## 🎯 Contexto das Sessões Anteriores (24/09/2026)

### 1. Identidade & SSO Multi-Domínio (e-Sigma IdP)
- **Cookie HttpOnly Transversal (`sigma_sso_token`)**: Ao efetuar login (credenciais ou passkey) no e-Sigma IdP (`:8000`), a resposta injeta o cookie seguro `sigma_sso_token` com escopo transversal (`.e-sigma.app` em produção ou `localhost` em desenvolvimento).
- **Validação de Sessão Global (`GET /api/v1/auth/sso/session`)**: Criada rota segura no IdP para que módulos satélites (CoReVM e Lojas) detectem e restaurem a sessão ativa automaticamente sem expor credenciais na URL.
- **Logout Global Unificado (`POST /api/v1/auth/logout`)**: Rota para invalidar e expirar cookies em todos os domínios do ecossistema.
- **CORS Multi-Tenant Dinâmico**: Configurada regex de origens (`https://.*\.e-sigma\.app`) permitindo requisições autenticadas com credenciais entre os frontends (`:5173`, `:5174`, `:5175`).

### 2. CoReVM: Decomposição Modular do Monólito de Rotas & Fronteira de API Limpa
- **Eliminação do Monólito**: O antigo `rotas.py` (com mais de 5.000 linhas) foi completamente decomposto em 5 submódulos limpos e desacoplados em `backend/api/v1/regional/`:
  - `rotas_governanca.py`: Dashboard executivo, perfil regional (`/me`), minhas regiões, diretoria, reconciliação e discrepâncias.
  - `rotas_lojas_agregadas.py`: Lojas jurisdicionadas, oficiais da loja, suplência, operadores administrativos e transmissão emergencial de cargo.
  - `rotas_comunicacao_agenda.py`: Mural de avisos regionais, calendário de eventos e pranchas.
  - `rotas_patrimonio_documentos.py`: Patrimônio regional, cautelas, repositório documental e relatórios executivos.
  - `rotas_admissoes_votacoes.py`: Prévias de admissão, considerações de veneráveis e votações/deliberações.
- **Zero Acesso Direto a Bancos Alheios**: Todas as consultas a obreiros, mandatos e dados de lojas foram migradas para o `LojasApiClient` (`core/lojas_cliente.py`). O `verificar_fronteiras_api.py` passa com 0 violações (ALLOWLIST limpa).

### 3. CoReVM: Auditoria Estruturada e Barramento em Tempo Real (SSE)
- **Barramento SSE (`core/eventos_tempo_real.py`)**: Implementado barramento de mensageria assíncrona por região com heartbeat (25s) e generator `gerador_sse_regional` conectado ao endpoint `GET /{regiao_id}/eventos/stream`.
- **Trilha de Auditoria (`core/auditoria_service.py`)**: Gravação obrigatória no banco de dados (`RegistroAuditoriaRegional`) combinada com notificação instantânea no barramento SSE para ações de governança (transmissão de cargo, registro de avisos, aprovação de atas).
- **Endpoint de Consulta (`GET /{regiao_id}/auditoria`)**: Auditoria com filtros por entidade e paginação.

### 4. Lojas: Endpoints de Integração API-First
- **Mandatos e Oficiais**: Criadas rotas dedicadas para elegibilidade de Veneráveis Mestres e Oficiais (`POST /mandatos/veneraveis-elegiveis`, `GET /lojas/{loja_id}/oficiais-elegiveis`).
- **Busca de Obreiros**: Adicionados endpoints de consulta em lote e individual por ID/identificador no módulo Lojas (`POST /obreiros/busca/multiplos`, `GET /obreiros/busca-identificador/{identificador}`).
- **Integração de Painel**: Suporte à emissão e sincronização de eventos, comunicados e documentos de Minha Loja para a agenda e mural do Conselho Regional.

---

## 🏛️ Definição de Arquitetura e Portas do Ecossistema
- **`e-Sigma` (IdP & SaaS)**: Porta `:8000`, Frontend `:5173`, Banco `esigma`.
- **`Lojas` (ERP das Oficinas)**: Porta `:8001`, Frontend `:5175`, Banco `lojas_db`. Reincorpora Finanças, Biblioteca, Classificados, Arquiteto e Patrimônio.
- **`CoReVM` (Conselho Regional)**: Porta `:8003`, Frontend `:5174`, Banco `core_db`. Totalmente API-First consumidor de `Lojas` e `e-Sigma`.

---

## 🚧 Próximos Passos para a Próxima Sessão
1. **Frontend do CoReVM**: Conectar o hook `useEventosRegionais` (SSE) na barra de navegação/notificações e criar tela de visualização de auditoria para a Diretoria Regional.
2. **Dashboard Lojas (Clone Legado)**: Prosseguir com o espelhamento estrito do layout visual do sistema legado Sigma no frontend do Lojas.
3. **Reincorporação de Schemas em `lojas_db`**: Migrar tabelas de Finanças e Patrimônio para a base mestre de Lojas.
