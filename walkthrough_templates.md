# Walkthrough: Implementação de Templates e Geração de PDF

## Visão Geral
Este documento descreve as etapas realizadas para implementar o sistema de edição de templates de documentos (Balaústre e Edital) e a geração de PDFs.

## Funcionalidades Implementadas

### 1. Editor de Templates
- **Frontend**: Criada a página `DocumentTemplates.tsx` com Monaco Editor para edição de HTML/Jinja2.
- **Backend**: Implementados endpoints CRUD em `template_routes.py` e modelo `DocumentTemplate`.
- **Preview**: Adicionado botão "Pré-visualizar PDF" que envia o conteúdo atual do editor para o backend gerar um PDF de teste com dados fictícios.

### 2. Geração de PDF
- **Engine**: Migração de `xhtml2pdf`/`playwright` para **WeasyPrint** para maior fidelidade de renderização e suporte a CSS moderno (incluindo Paged Media).
- **Serviço**: Atualizado `DocumentGenerationService` para usar `HTML(string=content).write_pdf()`.
- **Recursos**: Suporte a imagens (Logos) e fontes personalizadas.

### 3. Template de Balaústre
- **Estrutura**: Atualizado `balaustre_template.html` para replicar fielmente o modelo legado.
- **Formatação**:
    - Margens configuradas via `@page` (2.5cm superior/inferior, 2.0cm laterais).
    - Bordas consistentes em todas as páginas usando `border` no body e controle de quebra de página.
    - Correção de "órfãs e viúvas" com `orphans: 4; widows: 4;`.
- **Dados Dinâmicos**: Adicionados novos campos ao contexto gerado no backend.

### 4. Lógica de Carregamento de Template
O serviço de geração de documentos segue a seguinte prioridade para buscar o template:
1. **Template Customizado da Loja**: Busca no banco um template do tipo (ex: 'balaustre') associado especificamente à Loja atual.
2. **Template Padrão do Sistema (Banco)**: Se não houver customizado, busca um template marcado como `is_default` no banco.
3. **Template de Arquivo (Fallback)**: Se nenhum template estiver no banco, carrega o arquivo físico em `backend/templates/`.

## Arquivos Modificados/Criados

- `backend/services/document_generation_service.py`: Lógica de geração com WeasyPrint e resolução de templates.
- `backend/templates/balaustre_template.html`: Template HTML otimizado para WeasyPrint.
- `backend/templates/css/pdf_styles.css`: Estilos globais para PDFs (se aplicável).
- `frontend/src/pages/Management/DocumentTemplates.tsx`: Interface do editor.

## Como Rodar

O backend deve estar rodando normalmente. Certifique-se de que as bibliotecas necessárias para o WeasyPrint (GTK3 no Windows, ou libs nativas no Linux) estejam instaladas se houver problemas de renderização.

No ambiente Windows atual, o `WeasyPrint` funcionou corretamente após a instalação das dependências listadas no `requirements.txt`.

## Histórico de Correções Recentes (Balaústre)
- **Margens e Bordas**: Corrigido problema onde a borda não aparecia em todas as páginas ou cortava o texto. Ajustado padding e margins no `@page` e `body`.
- **Template Loading**: Corrigido bug onde o template do arquivo físico não era encontrado devido a caminhos relativos incorretos. O sistema agora tenta resolver o caminho absoluto corretamente.
- **Formatação de Texto**: Removido `text-align: justify` forçado que causava espaçamento estranho em linhas curtas; ajustado para `left` ou justificado com hifenização se necessário.

## Próximos Passos
- Implementar upload e armazenamento real de logos da Loja.
- Refinar permissões de acesso aos templates (quem pode editar o default vs custom).
