# Plano de Implementação: Refinamento da Produção de Documentos

## 1. Diagnóstico e Comparativo

### Legado (_reference/backend_old)
- **Tecnologia:** Node.js + Puppeteer (Headless Chrome).
- **Templates:** HTML/CSS complexos, responsivos, uso de CSS Grid/Flexbox.
- **Estética:** Alta fidelidade, uso de fontes customizadas (Poppins, Oleo Script), imagens de cabeçalho/rodapé, assinaturas digitais visuais.
- **UX:** Formulário de confecção da ata imitava o documento final, facilitando a edição.

### Atual (backend/frontend)
- **Tecnologia:** Python + WeasyPrint (via `document_generation_service.py`).
- **Templates:** HTML básico (`balaustre_template.html`), estilização simples (Times New Roman).
- **Estética:** Funcional, mas visualmente inferior ao legado.
- **UX:** Geração automática baseada em dados, sem edição visual prévia ("WYSIWYG").

## 2. Objetivos
1.  **Elevada Qualidade Visual:** Migrar os templates ricos do legado para o sistema atual.
2.  **Edição Visual ("WYSIWYG"):** Implementar no frontend uma interface de edição que simule o documento final (A4), permitindo ao usuário editar o texto da ata e outros campos diretamente no "papel".
3.  **Fidelidade de Renderização:** Garantir que o PDF gerado seja idêntico ao visualizado na tela.

## 3. Estratégia de Implementação

### Fase 1: Migração e Adaptação de Templates (Backend)
1.  **Portar Templates:** Copiar `balaustre.html`, `edital.html` e `convite_participacao.html` do legado para `backend/templates/`.
2.  **Adaptação Jinja2:** Ajustar a sintaxe de interpolação de variáveis (de `{{var}}` para `{{ var }}`) e lógica condicional para Jinja2.
3.  **Assets (Imagens e Fontes):**
    *   Mover fontes e imagens do legado para `backend/assets/` ou `backend/static/`.
    *   Atualizar o serviço para converter esses assets em Base64 e injetar no HTML (necessário para WeasyPrint/PDF renderizar corretamente sem URLs externas).

### Fase 2: Refinamento do Serviço de Geração (Backend)
1.  **Enriquecimento de Dados:** Atualizar `_collect_session_data` em `document_generation_service.py` para incluir todos os campos que o template legado exigia (ex: lista detalhada de cargos, visitantes, finanças).
2.  **Renderização PDF:**
    *   Testar a renderização dos templates complexos com `WeasyPrint`.
    *   *Risco:* WeasyPrint pode ter diferenças de renderização de CSS moderno em comparação ao Chrome (Puppeteer).
    *   *Mitigação:* Ajustar CSS para ser compatível com Paged Media (padrão de impressão) ou, se a qualidade for crítica, considerar migrar para `playwright-python` (equivalente ao Puppeteer em Python).

### Fase 3: Interface de Edição Visual (Frontend)
Esta é a funcionalidade chave solicitada ("formulário com a forma do documento").

1.  **Novo Componente `DocumentEditor`:**
    *   Criar uma página/modal que exibe o layout do documento (A4) na tela.
    *   Usar o mesmo HTML/CSS do template do backend para garantir consistência.
2.  **Campos Editáveis:**
    *   Em vez de inputs tradicionais, usar áreas editáveis (`contentEditable` ou `TextField` estilizados sem borda) posicionados exatamente onde o texto final ficaria.
    *   Exemplo: O texto da ata ("Precisamente às...") será um grande bloco de texto editável.
3.  **Fluxo de Geração:**
    *   Ao abrir a tela de "Gerar Balaústre", o frontend busca os dados pré-preenchidos (data, horários, presentes).
    *   O usuário vê o documento preenchido e pode editar o texto livremente.
    *   Ao clicar em "Salvar/Gerar PDF", o frontend envia o **conteúdo editado** (ou os dados estruturados atualizados) para o backend gerar o PDF final.

## 4. Plano de Ação Imediato

1.  **Copiar Assets:** Trazer pastas `fonts` e `images` do legado para o novo backend.
2.  **Atualizar Template Balaústre:** Substituir o `balaustre_template.html` atual pelo do legado, adaptando para Jinja2.
3.  **Criar Endpoint de "Preview":** Um endpoint que retorna o HTML preenchido (não o PDF) para o frontend renderizar no editor.
4.  **Desenvolver `BalaustreEditor.tsx`:** O componente visual de edição.

## 5. Oportunidades de Melhoria (Estado da Arte)
- **Assinatura Digital:** O legado já tinha placeholders para assinatura visual. Podemos integrar isso com o sistema de usuários atual, inserindo automaticamente a "assinatura" (nome/cargo/timestamp) de quem gerou ou aprovou o documento.
- **QR Code de Validação:** Adicionar um QR Code no rodapé do PDF que leva a uma página pública de validação da autenticidade do documento.
