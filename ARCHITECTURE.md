# Arquitetura e Entendimento Técnico do Projeto Sigma

Este documento fornece um panorama técnico avançado do sistema **Sigma**, descrevendo a concepção arquitetural, o relacionamento entre os módulos e os padrões de projeto (Design Patterns) adotados no backend e frontend.

---

## 1. Visão Geral do Sistema

O **Sigma** é uma plataforma SaaS (Software as a Service) voltada para a gestão de organizações maçônicas. Ele foi projetado para operar com **Multi-tenancy** (múltiplos inquilinos), o que significa que o sistema atende simultaneamente múltiplas "Obediências" e "Lojas", isolando os dados e permissões entre elas.

A stack tecnológica principal inclui:
- **Backend:** Python, FastAPI, SQLAlchemy, Alembic (migrações) e PostgreSQL.
- **Frontend:** React 19, TypeScript, Vite, Material-UI (MUI) e axios.

---

## 2. Padrões de Projeto (Design Patterns) Adotados

O desenvolvimento do Sigma priorizou manutenibilidade, testabilidade e escalabilidade, refletindo-se nos seguintes padrões:

### 2.1. Modular Monolith & Vertical Slices (Backend)
O backend não utiliza o tradicional padrão "camadas" (onde tudo que é rota fica numa pasta e tudo de banco em outra). Em vez disso, adota a arquitetura de **Monolito Modular** com **Fatias Verticais (Vertical Slices)** inspiradas em Domain-Driven Design (DDD).
- **Conceito:** A aplicação é dividida por domínio de negócio (ex: `members`, `finance`). Dentro do diretório de cada domínio existem as suas próprias `routes`, `services`, e `schemas`.
- **Vantagem:** O código relacionado a uma funcionalidade fica coeso no mesmo lugar. É mais fácil escalar e, se necessário, desmembrar um módulo inteiro para um microserviço no futuro.

### 2.2. Service Layer Pattern
Para evitar o "Fat Controller" (rotas com excesso de lógica), a lógica de negócio foi isolada em **Serviços** (`app/modules/*/services/*_service.py`).
- Os `Routers` apenas validam os inputs recebidos pela requisição HTTP, invocam os serviços, e retornam a resposta. 
- O banco de dados (`db: Session`) é repassado da rota para o serviço, simplificando os testes unitários da lógica sem precisar rodar um servidor HTTP.

### 2.3. Dependency Injection (DI)
Uso intenso do sistema nativo de Injeção de Dependência do FastAPI (`Depends`).
- Controle do ciclo de vida das sessões com o banco de dados (`get_db`).
- Extração e Validação do usuário autenticado e escopos de segurança através de dependências (`get_current_user`, `get_current_super_admin`, `require_permissions`).

### 2.4. Tenant Context Isolation (Multitenancy)
Para manter o isolamento dos dados dos clientes (Tenants/Lojas), foi criado o padrão de **Context Manager** (`TenantContextManager` em `app/shared/tenant_context.py`) baseado em `contextvars` do Python.
- Permite que o ID da Loja ou da Obediência flua implicitamente pela chamada sem ter que ser injetado manualmente em cada função do serviço, garantindo segurança na filtragem dos dados do BD de forma transparente e evitando vazamento de dados entre clientes.

### 2.5. Strategy Pattern
Usado na geração dinâmica de PDFs de Documentos (`app/modules/documents/services/document_strategies/`).
- Em vez de ter dezenas de `if/else` espalhados para montar layouts diferentes (ex: Certificado vs. Carta de Parabenização), implementamos diferentes "estratégias" que herdam de uma base comum e formatam dados usando um editor Tiptap injetado como HTML no PDF.

---

## 3. Arquitetura de Módulos (Backend)

Todos os módulos de negócio estão isolados sob `app/modules/`.

1. **`core/`**
   - **Responsabilidade:** O "coração" do sistema. Contém as raízes do SaaS.
   - **Componentes:** `Obediences`, `Lodges`, `Super Admins` (administradores do SaaS), `Committees` e Lojas Externas. Relatórios agregados (Dashboards) globais.
2. **`access_control/`**
   - **Responsabilidade:** Segurança e governança de acessos.
   - **Componentes:** Autenticação (OAuth2/JWT), gestão de `Roles` (cargos), `Permissions` granulares e gestão de Webmasters (membros com acessos elevados na Loja).
3. **`members/`**
   - **Responsabilidade:** O ciclo de vida dos associados e recursos humanos da Loja.
   - **Componentes:** Perfis de membros (`Member`), familiares vinculados, histórico de ocupação de cargos (`Role History`), associações entre membro e loja e distribuição de condecorações (`Decorations`).
4. **`sessions/`**
   - **Responsabilidade:** Sessões físicas/online e ritos maçônicos.
   - **Componentes:** Gestão das `Masonic Sessions`, atas (balaústres), presença dos membros, controle automatizado de Check-In via sistema (QR Codes) e livro de registro de Visitantes.
5. **`finance/`**
   - **Responsabilidade:** O "ERP financeiro" do sistema.
   - **Componentes:** Fluxo de caixa (Transações), Categorias Financeiras, Contas Bancárias, Configurações de Mensalidades (Cobranças automatizadas) e registro de Pagamentos.
6. **`communication/`**
   - **Responsabilidade:** Portal de interação do usuário com a comunidade.
   - **Componentes:** Murais de Avisos (`Notices`), Classificados de Negócios (Marketplace interno), Publicações de artigos, Eventos Sociais e integração de Calendário.
7. **`documents/` e `library/`**
   - **Responsabilidade:** Inteligência burocrática e cultural.
   - **Componentes:** O `documents` lida com as configurações de templates oficiais, geração automática de processos administrativos e emissão de PDFs dinâmicos. O `library` gere o acervo da biblioteca da loja física, controle de livros e filas de espera (Loans/Waitlist).

### 3.1. Relacionamento entre os Módulos
Embora modularizados na aplicação, os módulos dividem a mesma base de dados.
- **Acoplamento Físico (Database):** Tabelas possuem relacionamentos `Foreign Keys` clássicos entre si (ex: Transações apontam para um Membro; Membros apontam para Roles).
- **Acoplamento Lógico (Backend):** Foi estabelecida a diretriz para que **Serviços de Módulos Distintos evitem importar esquemas ou instanciar lógicas de outros módulos fortemente**. A dependência de injeção resolve os elos, e em casos complexos de processamentos em lote (ex: ao deletar um membro, deletar suas sessões e finanças), o fluxo interage chamando os serviços correspondentes sem criar imports circulares, respeitando as fronteiras arquitetônicas.

---

## 4. Frontend - Estrutura e Práticas

A SPA em React que consome a API foi estruturada para ser um cliente robusto, reativo e intuitivo.

- **Gerência de Estado:** React Context API para temas globais que devem fluir pela árvore do DOM, como Autenticação (`AuthContext`) e Tema/Modo de Tela (`ColorModeContext`).
- **Data Fetching:** Abstraído usando requisições via `Axios`, encapsulado em hooks ou métodos utilitários, fornecendo os JWT Tokens via cabeçalhos de requisição implicitamente.
- **Componentização Avançada:** Arquitetura altamente centrada em componentes granulares usando `Material-UI`. Customizações complexas feitas com o uso da biblioteca `@emotion/react` em conjunto ao sistema de "slots" do MUI.
- **Roteamento:** Construído utilizando o `react-router-dom`, com guardas de rotas (Route Guards) baseadas no cargo de Webmaster (Módulo Access Control) validando a visualização dos layouts.
- **Formulários e Performance:** O uso de `react-hook-form` é estrito, visando diminuir os re-renders de digitação em formulários grandes (ex: Cadastro de Membros).

---

## 5. Fluxo CI/CD & Deploy
*(Apenas overview baseado em práticas de backend presentes)*

- As atualizações no banco de dados seguem um versionamento estrito usando `Alembic` (Migrations).
- Os fluxos de execução dependem de variáveis de ambiente gerenciadas via Docker (`Dockerfile` encontrado no frontend) e pipelines que protegem chaves de segurança estritas. 
- Scripts utilitários de checagem e formatação (ex: eslint, tsc, pylint, pytest) formam a barreira defensiva garantindo que nenhuma refatoração quebre a malha complexa que liga todos estes módulos de domínio.

---
_Documentação gerada com base na última refatoração de Monolito Modular (Fase 3 do Projeto)._
