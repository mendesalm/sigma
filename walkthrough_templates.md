# Walkthrough: Implementação de Templates e Geração de PDF

## Visão Geral
Este documento descreve as etapas realizadas para implementar o sistema de edição de templates de documentos (Balaústre e Edital) e a geração de PDFs utilizando Playwright.

## Funcionalidades Implementadas

### 1. Editor de Templates
- **Frontend**: Criada a página `DocumentTemplates.tsx` com Monaco Editor para edição de HTML/Jinja2.
- **Backend**: Implementados endpoints CRUD em `template_routes.py` e modelo `DocumentTemplate`.
- **Preview**: Adicionado botão "Pré-visualizar PDF" que envia o conteúdo atual do editor para o backend gerar um PDF de teste com dados fictícios.

### 2. Geração de PDF
- **Engine**: Migração de `pyppeteer` para `playwright` para maior estabilidade e compatibilidade.
- **Serviço**: Atualizado `DocumentGenerationService` para usar `async_playwright`.
- **Compatibilidade Windows**: Criado script `backend/run.py` para configurar corretamente o `WindowsProactorEventLoopPolicy` e evitar erros de `NotImplementedError` com `asyncio` e subprocessos.

### 3. Template de Balaústre
- **Estrutura**: Atualizado `balaustre_template.html` para replicar fielmente o modelo legado (Word).
- **Conteúdo**: Texto ajustado para um único parágrafo contínuo, conforme requisitos de ata.
- **Dados Dinâmicos**: Adicionados novos campos ao contexto de geração:
    - `lodge_tittle`, `suboobedience_name`, `lodge_address`, `lodge_state`.
    - `chanceler_name`, `hospitaleiro_name`.

## Arquivos Modificados/Criados

- `backend/main.py`: Configuração de CORS e inclusão de rotas.
- `backend/run.py`: Script de inicialização para Windows.
- `backend/requirements.txt`: Substituição de `pyppeteer` por `playwright`.
- `backend/routes/template_routes.py`: Endpoints de template e preview.
- `backend/services/document_generation_service.py`: Lógica de geração de PDF e coleta de dados.
- `backend/templates/balaustre_template.html`: Template HTML atualizado.
- `frontend/src/pages/Management/DocumentTemplates.tsx`: Interface do editor.

## Como Rodar (Windows)

Devido às limitações do `uvicorn` com `reload` no Windows ao usar `playwright`, utilize o script dedicado:

```bash
python backend/run.py
```

Isso iniciará o servidor na porta 8000 sem o auto-reload (para garantir a estabilidade do loop de eventos).

## Próximos Passos
- Implementar armazenamento real de logos da Loja.
- Adicionar templates para "Convite" e "Cartão de Aniversário".
- Refinar permissões de acesso aos templates.
