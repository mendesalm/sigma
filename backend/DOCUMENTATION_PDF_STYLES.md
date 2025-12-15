# Documentação: Padrão de Geração de Estilos PDF

## Contexto e Problema
Durante o desenvolvimento do módulo de geração de PDF (Balaústres), identificamos um problema crítico onde formatadores externos de código (como Prettier/Beautify em VS Code) corrompiam a sintaxe do Jinja2 dentro de blocos tags `<style>` HTML. 
Exemplo de corrupção: `{{ variavel }}` tornava-se `{ \n { variavel } \n }`, quebrando o parser do Jinja2 e resultando em estilos não aplicados (margens zeradas, falta de bordas, alinhamento incorreto).

## Solução Adotada: Injeção Dinâmica de CSS
Para contornar este problema e garantir a integridade dos estilos, adotamos a seguinte arquitetura para **todas** as estratégias de documento (Balaústre, Edital, Prancha, etc.):

1.  **Remoção de Lógica do Template HTML**:
    *   Os templates HTML (ex: `balaustre_template.html`) **NÃO** devem conter blocos `<style>` com lógica Jinja2 complexa.
    *   O `<head>` deve conter apenas: `{{ dynamic_style_block | safe }}`.

2.  **Geração no Backend (Python Strategy)**:
    *   A classe de estratégia (ex: `BalaustreStrategy`) é responsável por processar o payload de estilos (`styles` dict).
    *   Os estilos são validados via Pydantic (`DocumentStyles`).
    *   A string CSS é construída programaticamente no Python usando f-strings.
    *   A string final deve incluir as tags `<style>` e `</style>`.
    *   Esta string é injetada no contexto como `dynamic_style_block`.

## Guia de Implementação para Novos Documentos

Ao criar uma nova estratégia (ex: `PranchaStrategy`), siga este padrão:

### 1. Backend (`services/document_strategies/prancha_strategy.py`)
```python
    async def collect_data(self, db: Session, session_id: int, **kwargs) -> dict:
        # ... lógica de coleta de dados ...
        
        # Processamento de Estilos
        override_styles = kwargs.get('styles')
        if override_styles and isinstance(override_styles, dict):
            styles_model = DocumentStyles(**override_styles)
            context['styles'] = styles_model
            
            # GERAÇÃO DINÂMICA DE CSS
            css = f"""
            @page {{
                size: {styles_model.page_size} {styles_model.orientation};
                margin: {styles_model.page_margin};
                /* ... outros estilos de página ... */
            }}
            
            body {{
                font-family: {styles_model.font_family};
                /* ... estilos do corpo ... */
            }}
            
            .content {{
                /* ... alinhamento, fontes, etc ... */
            }}
            """
            
            # EMPACOTAMENTO
            context['dynamic_style_block'] = f"<style>{css}</style>"
            
        return context
```

### 2. Frontend Template (`templates/prancha_template.html`)
```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <title>{{ title }}</title>
  <!-- Injeção de Estilos Dinâmicos -->
  {{ dynamic_style_block | safe }}
</head>
<body>
   <!-- Conteúdo HTML Puro com Jinja -->
   <div class="page-content">
       ...
   </div>
</body>
</html>
```

## Lições Aprendidas de Debugging

1.  **Payload Capture**: Sempre que houver discrepância visual, verificar o payload bruto enviado pelo frontend. Instrumente o endpoint `preview` para salvar o JSON recebido (ex: `frontend_payload_capture.json`).
2.  **Validação Pydantic**: Converter o dict para Pydantic Model (`DocumentStyles`) antes de usar no template garante que campos opcionais tenham defaults seguros (ex: `justify` para alinhamento).
3.  **Isolamento do Formatador**: Nunca confie que o arquivo HTML no disco permanecerá com a sintaxe Jinja2 intacta se houver formatadores automáticos no ambiente de desenvolvimento. A geração via Python é imune a isso.
