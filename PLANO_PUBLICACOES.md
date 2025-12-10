# Plano de Implementação: Módulo de Publicações

**Objetivo**: Implementar o sistema de gerenciamento de publicações (notícias, artigos, comunicados) para Lojas Maçônicas, com fluxo de criação por membros e moderação por Secretários.

## 1. Estrutura de Dados (Backend)

Atualizar modelo `Publication` em `models/models.py`.

- Adicionar `file_path` (String) para guardar o caminho do PDF.
- `content` será usado como descrição/observação.
- `cover_image` pode ser removido ou ignorado (já que o ícone será fixo).
- `type` continua útil para categorizar (Aviso, Boletim, etc).

```python
class Publication(BaseModel):
    # ... colunas existentes ...
    file_path = Column(String(512), nullable=False) # Caminho do PDF
    file_size = Column(Integer, nullable=True) # Tamanho em bytes
```

## 2. Regras de Negócio e Permissões

- **Criação/Edição/Deleção**: **EXCLUSIVO** para Secretário (e SuperAdmin).
- **Visualização**: **TODOS** os membros (Obreiros).
- **Arquivos**:
    - Apenas PDF.
    - Máximo 5MB.
    - Armazenamento: `storage/lodges/loja_{number}/publications/`

## 3. Frontend (UI/UX)

- **Ícone Padrão**: Usar `Ic_Tempo_de_Estudos.png` para todos os itens.
- **Localização**:
    - Menu **Obreiro** -> **Publicações** (Visualização/Download).
    - Menu **Secretaria** -> **Gerenciar Publicações** (Upload/CRUD).
- **Design**:
    - Painel Moderno (Glassmorphism).
    - Lista de cards ou tabela estilizada.
    - Ao clicar, abre o PDF (nova aba ou modal).

## 4. Etapas Restantes

1.  ✅ Criar Modelos (Já feito, precisa migrar campo novo).
2.  🔄 Atualizar Model com `file_path`.
3.  Implementar `PublicationService` com upload de arquivo.
4.  Implementar `PublicationRoutes`.
5.  Frontend: Tela de Consulta (Obreiro).
6.  Frontend: Tela de Gestão (Secretário).
