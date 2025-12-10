# Plano de Implementação: Módulo de Publicações

**Objetivo**: Implementar o sistema de gerenciamento de publicações (notícias, artigos, comunicados) para Lojas Maçônicas, com fluxo de criação por membros e moderação por Secretários.

## 1. Estrutura de Dados (Backend)

Criar novo modelo `Publication` em `models/models.py`.

```python
class PublicationTypeEnum(str, enum.Enum):
    NOTICE = "Aviso"
    NEWS = "Notícia"
    ARTICLE = "Artigo"
    OFFICIAL = "Boletim Oficial"

class PublicationStatusEnum(str, enum.Enum):
    DRAFT = "Rascunho"
    PENDING = "Pendente"
    PUBLISHED = "Publicado"
    REJECTED = "Rejeitado"
    ARCHIVED = "Arquivado"

class Publication(BaseModel):
    __tablename__ = "publications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False) # Rich Text
    excerpt = Column(Text, nullable=True) # Resumo
    
    type = Column(SQLAlchemyEnum(PublicationTypeEnum, ...), nullable=False)
    status = Column(SQLAlchemyEnum(PublicationStatusEnum, ...), default=PublicationStatusEnum.PENDING)
    
    author_id = Column(Integer, ForeignKey("members.id"), nullable=False)
    lodge_id = Column(Integer, ForeignKey("lodges.id"), nullable=False)
    
    published_at = Column(DateTime(timezone=True), nullable=True)
    valid_until = Column(Date, nullable=True) # Para avisos com validade
    
    cover_image = Column(String(512), nullable=True)
    
    # Relationships
    author = relationship("Member", backref="publications")
    lodge = relationship("Lodge", backref="publications")
```

*(Opcional: Tabela `PublicationAttachment` se precisar de múltiplos arquivos/fotos, similar a Classificados)*

## 2. Camada de Serviço (Backend)

Criar `services/publication_service.py`:

- **CRUD**: `create`, `get`, `update`, `delete`.
- **Listagem**:
    - `get_by_lodge`: Retorna todas (para Secretário).
    - `get_public_by_lodge`: Retorna apenas `PUBLISHED` e dentro da validade (para Mural/Feed).
    - `get_by_author`: Retorna todas do usuário (para "Minhas Publicações").
- **Workflow**:
    - `approve_publication`: Secretário muda status para `PUBLISHED`.
    - `reject_publication`: Secretário muda para `REJECTED` (opcional: motivo).

## 3. API Endpoints (Backend)

Criar `routes/publication_routes.py`:

- `GET /publications` (Lista pública/filtrada da loja do usuário logado)
- `GET /publications/my` (Minhas publicações)
- `POST /publications` (Criar - Status inicial `PENDING` se for Obreiro, `PUBLISHED` se for Secretário/Admin)
- `GET /publications/{id}` (Detalhes)
- `PUT /publications/{id}` (Editar - valida se é autor ou Secretário)
- `PUT /publications/{id}/status` (Apenas Secretário/Admin - Aprovar/Rejeitar)
- `DELETE /publications/{id}` (Autor ou Secretário)

## 4. Frontend (Interfaces)

### Componentes Reutilizáveis
- `PublicationCard`: Card para exibição em lista (Título, Tipo, Autor, Data, Resumo, Status Badge).
- `PublicationForm`: Formulário com validação (Título, Tipo, Conteúdo [Editor Rico], Capa).

### Páginas ("Obreiro")
1. **Minhas Publicações** (`/dashboard/obreiro/minhas-publicacoes`)
   - Tabela/Lista com suas publicações.
   - Botão "Nova Publicação".
   - Status visual (Pendente, Aprovado, etc.).

### Páginas ("Secretário")
1. **Gerenciar Publicações** (`/dashboard/secretario/publicacoes`)
   - Tabela completa da loja.
   - Filtros (Pendentes, Publicadas).
   - Ações de Aprovar/Rejeitar.

### Páginas ("Home/Dashboard")
- Widget/Feed de "Últimas Publicações" no Dashboard principal.

## 5. Permissões e Segurança

- **Obreiro**: Pode criar, editar (se DRAFT/PENDING) e ver suas próprias. Não pode alterar status para PUBLISHED.
- **Secretário**: Pode ver todas da sua loja, editar qualquer uma, e alterar status (Aprovação).
- **SuperAdmin**: Acesso total.

## 6. Etapas de Execução

1.  Criar Models e Migração (Alembic).
2.  Implementar Service e Routes.
3.  Implementar Frontend (Layout, Listagem, Criação).
4.  Testar Fluxo: Obreiro cria -> Secretário aprova -> Aparece no Feed.
