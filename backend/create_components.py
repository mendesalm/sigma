import os

base_dir = r"c:\Users\engan\OneDrive\Área de Trabalho\sigma\storage\lodges\model\templates\components"

files = {
    r"layouts\doc_base.html": """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>{{ title | default('Documento') }}</title>
    <style>
        @page {
            size: A4;
            margin: {{ config.styles.page_margin | default('1cm') }};
            @bottom-right {
                content: counter(page);
                font-family: Arial, sans-serif;
                font-size: 10pt;
            }
        }
        body {
            font-family: {{ config.styles.font_family | default('Arial, sans-serif') }};
            font-size: {{ config.styles.font_size | default('12pt') }};
            line-height: 1.5;
            text-align: justify;
            color: {{ config.styles.color | default('#000000') }};
            background-color: #fff;
            margin: 0;
            padding: 0;
        }
        .page-border {
            {% if config.styles.show_border %}
            border: 2px solid {{ config.styles.border_color | default('#000000') }};
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: -1;
            {% endif %}
        }
        header { margin-bottom: 20px; }
        footer { margin-top: 30px; }
        
        /* Utils */
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="page-border"></div>
    
    <header>
        {% include 'components/headers/' + (config.header or 'header_classico.html') %}
    </header>

    <main>
        {% include 'components/bodies/' + (config.body or 'balaustre_padrao.html') %}
    </main>

    <footer>
        {% include 'components/footers/' + (config.footer or 'footer_padrao.html') %}
    </footer>
</body>
</html>""",

    r"headers\header_classico.html": """<div class="text-center">
    {% if header_image %}
    <img src="{{ header_image }}" style="max-height: 120px; margin-bottom: 10px;" alt="Logo da Loja">
    {% endif %}
    
    <div style="font-size: 14pt;" class="bold uppercase">{{ lodge_title_formatted }}</div>
    <div style="font-size: 16pt; color: {{ config.styles.primary_color | default('#000000') }};" class="bold uppercase">{{ lodge_name }} Nº {{ lodge_number }}</div>
    
    {% if affiliation_text_1 %}
    <div style="font-size: 10pt;">{{ affiliation_text_1 }}</div>
    {% endif %}
    {% if affiliation_text_2 %}
    <div style="font-size: 10pt;">{{ affiliation_text_2 }}</div>
    {% endif %}
    
    <div style="margin-top: 10px; font-size: 10pt;">
        {{ lodge_address }}
    </div>
</div>
<hr style="border: 0; border-top: 2px solid {{ config.styles.border_color | default('#000000') }}; margin: 15px 0;">""",

    r"footers\footer_padrao.html": """<div class="text-center" style="margin-top: 20px;">
    {% if footer_image %}
    <img src="{{ footer_image }}" style="max-height: 60px; margin-bottom: 10px;" alt="Logo Rodapé">
    {% endif %}
    
    <div style="font-size: 9pt;">
        Documento gerado eletronicamente pelo sistema SIGMA em {{ current_date_day }}/{{ current_date_month }}/{{ current_date_year }}.
    </div>
    
    {% if hash_validation %}
    <div style="font-size: 8pt; margin-top: 5px; font-family: monospace;">
        HASH: {{ hash_validation }}
    </div>
    {% endif %}
</div>""",

    r"bodies\balaustre_padrao.html": """<h1 class="text-center uppercase" style="font-size: 18pt; margin-bottom: 20px;">
    BALAÚSTRE DA SESSÃO {{ session_type | default('MAGNA') }} Nº {{ session_number }}
</h1>

{% if custom_text %}
    <!-- Conteúdo Customizado (HTML do Editor) -->
    {{ custom_text | safe }}
{% else %}
    <!-- Conteúdo Automático Fallback -->
    <p>
        <strong>ABERTURA:</strong> Aos {{ current_date_day }} dias do mês de {{ current_date_month }} de {{ current_date_year }},
        reuniu-se a Loja {{ lodge_name }}... (Conteúdo gerado automaticamente indisponível no modo básico).
    </p>
{% endif %}

<!-- Área de Assinaturas (Opcional no corpo, pode ser componente separado) -->
<div style="margin-top: 50px; display: flex; justify-content: space-between;">
    <div class="text-center" style="width: 45%;">
        _____________________________<br>
        <strong>{{ Veneravel }}</strong><br>
        Venerável Mestre
    </div>
    <div class="text-center" style="width: 45%;">
        _____________________________<br>
        <strong>{{ Secretario }}</strong><br>
        Secretário
    </div>
</div>"""
}

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {full_path}")
