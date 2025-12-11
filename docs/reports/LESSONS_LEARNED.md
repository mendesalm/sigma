# Lições Aprendidas (Nov. 2025)

Este documento sumariza as principais lições aprendidas e os desafios superados durante a fase de refatoração de estilo do frontend e depuração de funcionalidades do backend.

## 1. Frontend: Refatoração de Estilo para Material-UI e Tema Dark

*   **Desafio:** O frontend apresentava inconsistências visuais, não utilizava a largura total da página e carecia de um tema unificado.
*   **Solução:** Foi realizada uma refatoração completa para adotar o Material-UI como framework de UI e implementar um tema dark exclusivo. Isso envolveu:
    *   Migração de componentes HTML/CSS customizados para componentes Material-UI (`AppBar`, `Drawer`, `Box`, `Container`, `Typography`, `TextField`, `Button`, `Grid`, `Paper`, etc.).
    *   Centralização da configuração de tema em `theme.ts` para exportar apenas o tema dark.
    *   Inclusão do `ThemeProvider` e `CssBaseline` em `main.tsx` para aplicação global do tema e normalização de estilos.
    *   Ajustes nos componentes de layout (`DashboardLayout`, `Header`, `Footer`, `WebmasterDashboardLayout`) e nas páginas principais (`LandingPage`, `LoginPage`) para garantir que os componentes utilizem a largura total e sejam responsivos.
    *   Remoção de arquivos CSS customizados obsoletos para evitar conflitos e simplificar a manutenção.
*   **Lição Aprendida:** A adoção de um framework de UI como o Material-UI e o uso consistente de suas ferramentas de estilização (e.g., `sx` prop) é fundamental para construir interfaces consistentemente, responsivas e facilmente manuteníveis. A integração do `ThemeProvider` e `CssBaseline` na raiz da aplicação é crucial para a correta aplicação do tema.

## 2. Backend: Depuração e Estabilização de Funcionalidades Essenciais

A depuração de erros no backend revelou pontos importantes sobre a configuração do ambiente, validação de tokens JWT e tratamento de erros de banco de dados.

*   **Inconsistência na Validação JWT (`401 Unauthorized`):**
    *   **Desafio:** Tokens JWT tornavam-se inválidos após cada reinício do servidor, resultando em erros `401 Unauthorized` devido a `SECRET_KEY` dinâmica.
    *   **Solução:** A `SECRET_KEY` foi movida para uma variável de ambiente (`.env` file) e a biblioteca `python-dotenv` foi integrada ao `main.py` para carregamento consistente da chave na inicialização do backend. Adição de logs de depuração detalhados para o processo de decodificação do token foi essencial para identificar a causa raiz.
    *   **Lição Aprendida:** A `SECRET_KEY` para JWTs deve ser estática e consistentemente carregada em ambientes de desenvolvimento e produção. O uso de arquivos `.env` e `python-dotenv` é uma prática recomendada para gerenciar configurações sensíveis.

*   **Erro de Permissão para Super Admins (`403 Forbidden`):**
    *   **Desafio:** Super Admins recebiam `403 Forbidden` ao tentar criar obediências.
    *   **Solução:** Corrigida a inconsistência entre a chave (`"role"`) usada para definir o tipo de usuário no payload JWT e a chave (`"user_type"`) esperada pela dependência de autorização do backend.
    *   **Lição Aprendida:** Garanta que as chaves utilizadas para armazenar e recuperar informações críticas (como roles/user types) em payloads JWT sejam consistentes em todo o sistema.

*   **Erro na Criação de Webmaster (`TypeError` e `AttributeError`):**
    *   **Desafio:** Falha na criação de objetos `Webmaster` devido a argumentos inválidos e chamada de função de hashing de senha inexistente.
    *   **Solução:** O código de criação de `Webmaster` e a chamada de hashing de senha em `auth_service.py` foram ajustados para utilizar os atributos e funções corretos do modelo `Webmaster` e da `password_utils`.
    *   **Lição Aprendida:** Validação rigorosa dos argumentos passados para construtores de modelos ORM e chamadas de função é essencial para evitar `TypeErrors` e `AttributeErrors`.

*   **Tratamento de Entrada Duplicada (`IntegrityError` -> `409 Conflict`):**
    *   **Desafio:** Tentativas de criar registros com nomes duplicados em colunas únicas resultavam em `500 Internal Server Error`, sem feedback útil ao usuário.
    *   **Solução:** Implementado um bloco `try-except` em `obedience_service.py` para capturar `sqlalchemy.exc.IntegrityError` e retornar um `HTTPException` com `409 Conflict` e uma mensagem específica ("Já existe uma obediência com este nome."), fornecendo feedback claro ao frontend.
    *   **Lição Aprendida:** Erros de integridade do banco de dados (como violações de chave única) devem ser capturados e traduzidos para respostas HTTP apropriadas e mensagens amigáveis para o usuário, melhorando a UX e a estabilidade da aplicação.

## 3. Considerações Gerais

*   **Comunicação Clara e Feedback:** A importância de logs detalhados (frontend e backend) e feedback claro ao usuário (via mensagens de erro na UI) foi evidenciada como crítica para o processo de depuração e para a experiência geral do usuário.
*   **Gestão de Dependências:** A necessidade de garantir que todas as dependências do projeto (e.g., `geopy`, `python-dotenv`) estejam corretamente instaladas e carregadas no ambiente virtual ativo é fundamental para a inicialização e execução bem-sucedida da aplicação.
