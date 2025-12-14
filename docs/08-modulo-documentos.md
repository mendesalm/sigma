# Módulo de Personalização e Geração de Documentos (Engine Sigma)

## 1. Concepção e Visão Geral
O Módulo de Personalização de Documentos foi concebido para resolver a necessidade de **padronização de dados** concomitante à **identidade visual única** de cada Loja Maçônica no sistema multi-tenant Sigma.

A arquitetura opera sob o princípio de **"Template Dinâmico Guiado por Metadados"**. Diferente de sistemas que utilizam templates estáticos rígidos, o Sigma armazena as preferências estéticas de cada Loja (cores, fontes, margens, cabeçalhos, layouts) como um objeto JSON estruturado no banco de dados (`Lodge.document_settings`). 

Durante a geração do documento, o Engine funde três camadas:
1.  **Camada de Dados:** Informações transacionais da sessão (presenças, cargos, temas abordados, data, assinaturas).
2.  **Camada de Estilo:** Configurações visuais definidas pelo Webmaster, validadas pelo schema `DocumentSettings`.
3.  **Camada de Estrutura:** Templates base (Jinja2) modulares que interpretam os dados e aplicam os estilos via CSS injetado dinamicamente.

## 2. Regras de Negócio
Para garantir a consistência e a validade dos documentos, o módulo segue as seguintes regras estritas:

*   **Herança de Configuração (Fallback):** O sistema aplica configurações em cascata. Se uma Loja não define uma configuração específica, o sistema utiliza o padrão definido no Model Pydantic `DocumentStyles` para garantir a geração.
*   **Independência de Tipo Documental:** `Balaústre` (Ata), `Prancha` (Edital/Ofício) e `Convite` (Certificado) possuem configurações segregadas. Uma Loja pode configurar um estilo sóbrio para Atas e um estilo festivo para Certificados.
*   **Imutabilidade Lógica:** A geração do documento reflete o estado dos dados no momento da geração. Para fins de auditoria, documentos assinados digitalmente possuem um hash SHA-256 único e QR Code para validação externa.
*   **Isolamento de Tenant:** As configurações visuais são estritamente vinculadas ao ID da Loja, garantindo privacidade e personalização absoluta.

## 3. Funcionalidades e Possibilidades
O módulo oferece flexibilidade através de componentes configuráveis:

*   **Cabeçalhos Modulares:** Suporte a troca dinâmica de arquivos parciais (`partials`), permitindo layouts como "Clássico" (Brasão centralizado), "Moderno" (Minimalista), ou "Grid" (Informações laterais).
*   **Tipografia Dinâmica:** Fontes (serifadas, sans-serif, cursivas), tamanhos e espaçamentos (line-height) são injetados diretamente no CSS (`@page`), permitindo controle da densidade do texto.
*   **Layout Condicional:** Lógica de layout (`Standard` vs `Condensed`) para otimizar o uso de papel em documentos extensos.
*   **Controle de Alinhamento:** Opções granulares para alinhamento horizontal (Esquerda, Centro, Direita) do Título da Loja e do Subtítulo (Afiliação), permitindo adaptação a diferentes layouts de papel timbrado.
*   **Elementos Decorativos:** Bordas personalizáveis para o rodapé do cabeçalho (com controle de espessura, cor e estilo), numeração de páginas, marcas d'água e cor primária customizável.

## 4. Estrutura de Dados (Schema)
As configurações são armazenadas no formato JSON validado pelo seguinte esquema (simplificado):

```json
{
  "balaustre": {
    "header": "header_classico.html",
    "styles": {
      "page_size": "A4",
      "font_family": "Arial",
      "primary_color": "#000000"
    }
  },
  "prancha": { ... },
  "convite": { ... }
}
```

## 5. Próximos Passos (Roadmap de Engenharia)
*   **Snapshot de Versão:** Armazenamento das configurações utilizadas no momento da geração para reprodução histórica exata.
*   **Queue de Geração:** Processamento assíncrono (Celery/RabbitMQ) para documentos pesados em lote.
*   **Testes de Regressão Visual:** Validação automatizada de layouts para prevenir quebras visuais em updates do sistema.
