# Plano de Implementação: Módulo de Classificados Global

## Visão Geral
Implementação de um sistema de classificados onde membros de todas as lojas podem anunciar bens e serviços. O sistema será global (visível para todos), com ciclo de vida automático (21 dias ativo + 14 dias inativo antes da exclusão).

## 1. Backend (Python/FastAPI)

### 1.1. Banco de Dados (`backend/models/models.py`)
Atualizar o modelo `Classified` existente e criar `ClassifiedPhoto` para suportar múltiplas imagens.

**Alterações em `Classified`:**
- Adicionar `expires_at` (DateTime).
- Remover `image_path` (será substituído pela tabela de fotos).
- Manter `lodge_id` para referência de origem, mas a listagem ignorará filtro por loja.

**Novo Modelo `ClassifiedPhoto`:**
- `id` (PK)
- `classified_id` (FK)
- `image_path` (String)
- `created_at`

### 1.2. Schemas (`backend/schemas/classified_schema.py`)
Criar schemas Pydantic para validação e serialização:
- `ClassifiedCreate`: Título, descrição, preço, contato.
- `ClassifiedOut`: Dados completos + lista de URLs de fotos + status + data expiração.
- `ClassifiedUpdate`: Campos editáveis.

### 1.3. Serviço (`backend/services/classified_service.py`)
Implementar lógica de negócios:
- **Criação**: Definir `expires_at = data_atual + 21 dias`. Salvar imagens no disco.
- **Listagem**: Retornar todos os anúncios com `status='ACTIVE'` (sem filtro de loja).
- **Ciclo de Vida (Scheduler)**:
  - **Desativação**: Buscar anúncios ativos com `expires_at < agora` -> Atualizar para `EXPIRED`.
  - **Exclusão**: Buscar anúncios `EXPIRED` com `expires_at < agora - 14 dias` -> Deletar registro e arquivos de imagem.

### 1.4. Agendador (`backend/scheduler.py`)
Adicionar job diário para executar a rotina de limpeza (`cleanup_classifieds`).

### 1.5. Rotas (`backend/routes/classified_routes.py`)
- `GET /classifieds`: Listar todos (público para logados).
- `POST /classifieds`: Criar novo (upload de múltiplas imagens).
- `GET /classifieds/my`: Listar anúncios do usuário logado.
- `PUT /classifieds/{id}`: Editar.
- `DELETE /classifieds/{id}`: Excluir manualmente.

## 2. Frontend (React/MUI)

### 2.1. API Service (`frontend/src/services/api.ts`)
Adicionar métodos para interagir com os novos endpoints.

### 2.2. Interface do Usuário
Criar diretório `frontend/src/pages/Obreiro/Classificados/`.

- **`ClassifiedsPage.tsx`**:
  - Grid de cards mostrando foto principal, título, preço e loja de origem.
  - Filtros de busca (texto, categoria se houver).
  - Botão "Meus Anúncios".
  
- **`ClassifiedDetailsDialog.tsx`**:
  - Modal para ver detalhes e galeria de fotos.
  
- **`CreateClassifiedForm.tsx`**:
  - Formulário com upload de múltiplas imagens (preview).

### 2.3. Navegação
Adicionar item "Classificados" no menu "Obreiro" no Dashboard.

## 3. Fluxo de Trabalho
1. **Backend**: Ajustar modelos -> Migração (se necessário/possível) -> Schemas -> Service -> Routes -> Scheduler.
2. **Frontend**: Service API -> Componentes UI -> Integração.
