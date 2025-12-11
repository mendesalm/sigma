import os

target_file = r"c:\Users\engan\OneDrive\Área de Trabalho\sigma\storage\lodges\model\templates\balaustre\balaustre_template.html"
content = """{% set config = {
    'header': 'header_classico.html',
    'body': 'balaustre_padrao.html',
    'footer': 'footer_padrao.html',
    'styles': {
        'show_border': true,  
        'page_margin': '1cm',
        'font_family': 'Arial, sans-serif',
        'font_size': '12pt'
    }
} %}
{% extends 'components/layouts/doc_base.html' %}"""

os.makedirs(os.path.dirname(target_file), exist_ok=True)
with open(target_file, "w", encoding="utf-8") as f:
    f.write(content)
print(f"Updated: {target_file}")
