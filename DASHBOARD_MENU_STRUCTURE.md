# Estrutura Hierárquica do Dashboard da Loja

**Data**: 2025-11-30  
**Status**: 🚧 EM IMPLEMENTAÇÃO

---

## 📋 Visão Geral

Esta documentação define a nova estrutura hierárquica de navegação do Dashboard da Loja (Lodge Dashboard), com menus primários, secundários e suas respectivas permissões baseadas em cargos.

---

## 🏠 HOME (Dashboard Principal)

**Ativação**: Quando nenhum item do menu principal estiver ativo  
**Rota**: `/dashboard/lodge-dashboard`  
**Ícone**: *Ainda sem ícone definido*  
**Permissões**: Todos os membros da loja

### Conteúdo:
- Calendário de eventos
- Boxes gerais de métricas (Total de membros, Próximos eventos, etc.)
- Mural de avisos
- **OBS**: Não possui menu secundário

---

## 👷 OBREIRO (Menu Primário)

**Ícone**: `Macom-D.png`  
**Destinatários**: Todos os membros da loja  
**Finalidade**: Acesso a funcionalidades de gerenciamento pessoal e visualização de dados próprios

### Sub-menus:

#### 1. MEU CADASTRO
- **Rota**: `/dashboard/obreiro/meu-cadastro`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - **Leitura**: Visualização completa do próprio cadastro
    - Dados pessoais
    - Dados maçônicos
    - Familiares
    - Histórico de cargos exercidos
    - Condecorações
  - **Edição Parcial**: Permitido editar
    - Dados pessoais (endereço, telefone, etc.)
    - Familiares
    - Senha

#### 2. MINHAS PRESENÇAS
- **Rota**: `/dashboard/obreiro/minhas-presencas`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - Produção de relatório de presenças próprias em sessões da loja
  - Visualização de histórico de presença
  - Estatísticas de assiduidade

#### 3. MINHAS VISITAÇÕES
- **Rota**: `/dashboard/obreiro/minhas-visitacoes`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - Leitura do histórico de visitações realizadas a outras lojas
  - Data, loja visitada, tipo de sessão

#### 4. MINHAS PUBLICAÇÕES
- **Rota**: `/dashboard/obreiro/minhas-publicacoes`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - Leitura do histórico de publicações cadastradas no site
  - Filtro por tipo, data

#### 5. MEUS ANÚNCIOS
- **Rota**: `/dashboard/obreiro/meus-anuncios`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - Cadastro de novos anúncios no módulo de classificados (Global)
  - Upload de múltiplas fotos (Carrossel)
  - Leitura de anúncios próprios
  - Edição de anúncios próprios
  - Reativação de anúncios expirados (Período de graça de 14 dias)
  - Gerenciamento de status (ativo, expirado)

#### 6. CLASSIFICADOS (Novo)
- **Rota**: `/dashboard/obreiro/classificados`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - Visualização de anúncios de todos os membros de todas as lojas
  - Interface Premium Glassmorphism
  - Detalhes com galeria de fotos
  - Busca e filtros

#### 6. MEUS EMPRÉSTIMOS
- **Rota**: `/dashboard/obreiro/meus-emprestimos`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - Cadastro de solicitação de empréstimo de livros da biblioteca
  - Leitura do histórico de empréstimos pessoais
  - Visualização de prazos de devolução

---

## 📝 SECRETÁRIO (Menu Primário)

**Ícone**: `Secretario-D.png`  
**Destinatários**: Secretário ou Secretário Adjunto da loja  
**Finalidade**: Gerenciamento dos membros e sessões da loja

### Sub-menus:

#### 1. CADASTRO
- **Rota**: `/dashboard/secretario/cadastro`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - **CRUD Completo** de membros da loja
  - Campos gerenciáveis:
    - Dados pessoais
    - Dados maçônicos
    - Familiares
    - Histórico de cargos
    - Condecorações
    - Senha (reset)

#### 2. PRESENÇAS
- **Rota**: `/dashboard/secretario/presencas`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - Produção de relatórios de presenças de **todos os membros**
  - Filtros por período, sessão, status
  - Exportação de relatórios

#### 3. PUBLICAÇÕES
- **Rota**: `/dashboard/secretario/publicacoes`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - **Gerenciamento completo** de todas as publicações da loja
  - Criação, edição, remoção
  - Aprovação de publicações de membros

#### 4. SESSÕES
- **Rota**: `/dashboard/secretario/sessoes`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - **CRUD Completo** de sessões da loja
  - Campos:
    - Data, horário, tipo de sessão
    - Ordem do dia
    - Ata (geração automática)
    - Status (agendada, realizada, cancelada)

---

## 🏛️ CHANCELER (Menu Primário)

**Ícone**: `Chanceler-D.png`  
**Destinatários**: Chanceler ou Chanceler Adjunto da loja  
**Finalidade**: Gerenciamento de presenças, visitações e visitantes

### Sub-menus:

#### 1. CADASTRO
- **Rota**: `/dashboard/chanceler/cadastro`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - **Idêntico ao Secretário**
  - CRUD Completo de membros da loja

#### 2. PRESENÇAS
- **Rota**: `/dashboard/chanceler/presencas`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - **Gerenciamento completo** de presenças dos membros em sessões
  - Registro de presença (manual ou QR Code)
  - Edição de presenças
  - Relatórios

#### 3. VISITAÇÕES
- **Rota**: `/dashboard/chanceler/visitacoes`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - **Gerenciamento completo** de visitações dos membros em outras lojas
  - Cadastro de visitações
  - Edição e remoção
  - Relatórios de visitações

#### 4. VISITANTES
- **Rota**: `/dashboard/chanceler/visitantes`
- **Ícone**: *Ainda sem ícone*
- **Funcionalidades**:
  - **Gerenciamento completo** de visitantes de outras lojas nas sessões da loja em contexto
  - Cadastro de visitante
  - Registro de presença
  - Relatórios de visitantes recebidos

---

## 🔐 Matriz de Permissões

| Funcionalidade | Obreiro | Secretário | Chanceler |
|---|---|---|---|
| MEU CADASTRO (Leitura Completa) | ✅ | ✅ | ✅ |
| MEU CADASTRO (Edição Parcial) | ✅ | ✅ | ✅ |
| CADASTRO Geral (CRUD Completo) | ❌ | ✅ | ✅ |
| MINHAS PRESENÇAS | ✅ | ✅ | ✅ |
| PRESENÇAS Geral (Gerenciamento) | ❌ | 📊 Relatórios | ✅ CRUD |
| MINHAS VISITAÇÕES | ✅ | ✅ | ✅ |
| VISITAÇÕES Geral (Gerenciamento) | ❌ | ❌ | ✅ CRUD |
| VISITANTES (Gerenciamento) | ❌ | ❌ | ✅ CRUD |
| PUBLICAÇÕES Próprias | ✅ | ✅ | ✅ |
| PUBLICAÇÕES Geral | ❌ | ✅ CRUD | ❌ |
| ANÚNCIOS Próprios | ✅ CRUD | ✅ | ✅ |
| EMPRÉSTIMOS Próprios | ✅ CRUD | ✅ | ✅ |
| SESSÕES | ❌ | ✅ CRUD | ❌ |

---

## 🛠️ Estrutura Técnica

### Backend (Cargos no Banco de Dados)

Os cargos relevantes para este módulo devem estar cadastrados na tabela `roles` com:

- **Secretário**: `role_type = "Loja"`, nível hierárquico definido
- **Secretário Adjunto**: `role_type = "Loja"`, nível hierárquico definido
- **Chanceler**: `role_type = "Loja"`, nível hierárquico definido
- **Chanceler Adjunto**: `role_type = "Loja"`, nível hierárquico definido

### Frontend (Controle de Acesso)

A navegação e visibilidade dos menus será controlada por:

1. **AuthContext**: Carrega o perfil do usuário logado e seus cargos
2. **usePermissions Hook**: Verifica se o usuário possui cargo/permissão específica
3. **Menu Condicional**: Renderiza apenas os itens do menu que o usuário pode acessar

### Rotas Protegidas

Todas as rotas devem ser protegidas no backend com middleware de autorização que verifica:

1. Se o usuário está autenticado
2. Se o usuário possui o cargo necessário
3. Se o cargo é válido (não expirado: `end_date IS NULL`)

---

## 📦 Próximas Etapas

1. ✅ Documentação da estrutura (este arquivo)
2. ⏳ Atualizar `LodgeDashboardLayout.tsx` com a nova estrutura de menus
3. ⏳ Criar componentes de página para cada sub-menu
4. ⏳ Implementar hooks de permissões (`usePermissions`, `useUserRoles`)
5. ⏳ Criar rotas protegidas no backend para cada funcionalidade
6. ⏳ Implementar lógica de negócio nos serviços
7. ⏳ Testes de integração e validação de permissões
