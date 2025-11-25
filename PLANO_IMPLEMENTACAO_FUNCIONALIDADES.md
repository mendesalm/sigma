# Plano de Implementação de Funcionalidades (Baseado na Arquitetura Atual)

## 1. Introdução

Este documento detalha o plano para implementar as funcionalidades ausentes no backend, utilizando a arquitetura multitenant existente como base. A análise do backend atual confirma uma estrutura robusta com FastAPI, SQLAlchemy e um claro isolamento de dados por Loja (tenant).

**Princípio Orientador:** As novas funcionalidades serão implementadas como extensões do sistema atual, seguindo os padrões de código, modelos de dados e lógicas de serviço já estabelecidos. Modificações na estrutura existente serão evitadas, favorecendo a adição de novos módulos coesos.

## 2. Análise da Arquitetura Existente (Resumo)

- **Estrutura:** API em camadas (Rotas -> Serviços -> Modelos).
- **Tenancy:** O isolamento de dados é garantido por `ForeignKey` para `loja.id` nos modelos relevantes.
- **Autenticação:** Gerenciada por JWT. Uma dependência em `dependencies.py` decodifica o token e fornece o contexto do usuário atual, incluindo sua loja.
- **Lógica de Negócio:** Centralizada na camada de `services`, que é consumida pelas `routes`.

Este plano focará em preencher as lacunas de funcionalidade identificadas na análise do sistema legado.

## 3. Plano de Implementação em Fases

---

### Módulo de Gestão de Usuários

#### Princípios Arquiteturais

1.  **Segregação de Responsabilidades:** As funcionalidades de gerenciamento de Super Admins e Webmasters foram isoladas em seus próprios módulos de serviço e rotas, garantindo a organização do código.
2.  **Autenticação Contextual:** O fluxo de autenticação foi aprimorado para suportar usuários com múltiplas afiliações, permitindo a seleção de contexto no login e garantindo que o token JWT reflita o escopo de acesso do usuário.
3.  **Interface Unificada:** O frontend foi atualizado para fornecer interfaces de gerenciamento para Super Admins e Webmasters, permitindo ações como reset de senha.

#### Plano de Implementação Resumido

*   **Serviços:** Foram criados `super_admin_service.py` e `webmaster_service.py` para encapsular a lógica de negócio.
*   **Rotas:** Foram adicionados endpoints RESTful para CRUD de Super Admins e para gerenciamento de Webmasters.
*   **Autenticação:** O endpoint de login foi atualizado para identificar usuários com múltiplas afiliações e retornar os dados necessários para a seleção de contexto no frontend. Um novo endpoint foi criado para gerar um novo token após a seleção.
*   **Frontend:** Foram criadas/atualizadas as páginas de gerenciamento para Super Admins e Webmasters, e a lógica no `AuthContext` foi expandida para lidar com a seleção de afiliação.

---

### Módulo de Gestão de Sessões

#### Princípios Arquiteturais

1.  **Modularidade:** A funcionalidade é dividida em módulos de serviço distintos: `session_service`, `attendance_service`, e `document_generation_service`.
2.  **Eficiência e Assincronia:** Operações lentas, como a geração de PDFs, são executadas em segundo plano (*background tasks*), liberando a API para responder imediatamente.
3.  **Reutilização de Módulos:** A geração de documentos integra-se ao `document_service` já existente, centralizando a gestão de todos os arquivos.
4.  **Automação:** A mudança de status das sessões é automatizada via `scheduler`, reduzindo a necessidade de intervenção manual.
5.  **Segurança por Design:** As rotas são protegidas por dependências que verificam não apenas a autenticação (se o usuário está logado), mas também a autorização (se o usuário tem permissão para realizar a ação), como no caso do registro manual de presença.

#### Plano de Implementação Resumido

*   **Modelos de Dados:** Foram criados/atualizados os modelos `MasonicSession`, `SessionAttendance` e `Visit` para suportar o ciclo de vida da sessão, o check-in por QR Code e o registro de visitação cruzada.
*   **Serviços:** Foram implementados serviços para gerenciar o ciclo de vida da sessão (`session_service`), a presença (`attendance_service`) e a geração de documentos (`document_generation_service`).
*   **Automação:** Um agendador (`scheduler.py`) foi implementado para iniciar sessões automaticamente 2 horas antes do horário agendado.
*   **Rotas:** Foram criados endpoints para todas as operações, incluindo um endpoint seguro e específico para o check-in via QR Code (`POST /check-in/qr`).

---

## 4. Documentação Funcional

### 4.1. Módulo de Gestão de Usuários

#### Gerenciamento de Super Admins
- O sistema agora permite a criação, listagem, atualização e exclusão de usuários Super Admin através de uma interface dedicada no dashboard de gerenciamento.
- A funcionalidade de reset de senha foi implementada, permitindo que um Super Admin dispare o envio de uma nova senha temporária para o email de outro Super Admin.

#### Gerenciamento de Webmasters
- Uma nova página de gerenciamento de Webmasters foi adicionada, permitindo a listagem de todos os webmasters do sistema.
- A funcionalidade de reset de senha também está disponível para webmasters, seguindo o mesmo fluxo dos Super Admins.

#### Fluxo de Login para Múltiplas Afiliações
1.  **Detecção no Login:** Ao efetuar o login, o backend verifica se um membro possui associação com mais de uma loja ou obediência.
2.  **Seleção no Frontend:** Se múltiplas afiliações são detectadas, o frontend exibe uma página de seleção, permitindo que o usuário escolha em qual contexto deseja operar.
3.  **Atualização do Token:** Após a seleção, um novo token JWT é gerado, contendo o `lodge_id` ou `obedience_id` do contexto selecionado, garantindo o isolamento de dados nas requisições subsequentes.

### 4.2. Módulo de Gestão de Sessões

#### Concepção Geral e Regras de Negócio

O módulo gerencia todo o ciclo de vida de uma sessão maçônica, desde seu agendamento até a documentação pós-sessão, de forma automatizada e segura.

#### Conceitos Fundamentais

1.  **Sessão Maçônica (`MasonicSession`):** A entidade central, com um `status` que define seu estado ('AGENDADA', 'EM_ANDAMENTO', 'REALIZADA', 'CANCELADA').
2.  **Presença em Sessão (`SessionAttendance`):** O registro que vincula um usuário a uma sessão, seja como membro do quadro (`member_id`) ou visitante (`visitor_id`).
3.  **Visita (`Visit`):** Tabela que armazena o histórico de visitações entre lojas.
4.  **Documento (`Document`):** Modelo unificado para todos os arquivos, incluindo os PDFs gerados para as sessões, salvos em diretórios isolados por loja.

---

### 4.3. O Ciclo de Vida de uma Sessão: Um Exemplo Prático e Seguro

Vamos usar como exemplo a **"Sessão Magna de Iniciação"** da Loja **"Acácia do Cerrado nº 123"** (ID: 42), agendada para **28 de novembro de 2025, às 20:00**.

#### Passo 1: Agendamento da Sessão

*   **Ação:** Um usuário com permissão de 'webmaster' (ou outro cargo administrativo) agenda a nova sessão.
*   **Segurança:** A rota `POST /masonic-sessions` é protegida e exige um token de um usuário com permissões de gerenciamento.
*   **Regra de Negócio:** O sistema impede a criação de outra sessão para a Loja 42 na mesma data.
*   **Resultado:** Uma nova `MasonicSession` é criada com `status = 'AGENDADA'`.

#### Passo 2: Início Automático da Sessão

*   **Ação:** O agendador do sistema (`scheduler`) executa sua verificação periódica.
*   **Regra de Negócio:** À às **18:00** do dia 28/11/2025 (2 horas antes), a tarefa do agendador detecta que a sessão deve ser iniciada.
*   **Resultado:** O `status` da sessão é alterado para **'EM_ANDAMENTO'** e os registros de presença (`SessionAttendance`) com status 'Ausente' são criados para todos os membros da loja.

#### Passo 3: Registro de Presença (Check-in)

*   **Cenário A: Check-in Manual (pelo Secretário)**
    *   **Ação:** O Secretário marca um irmão como "Presente".
    *   **API Chamada:** `POST /masonic-sessions/{id_da_sessao}/attendance/manual`.
    *   **Segurança:** Esta rota é protegida pela dependência `get_session_manager`, garantindo que apenas usuários com cargo administrativo (como 'webmaster') possam realizar a ação.
    *   **Resultado:** A presença do irmão é atualizada.

*   **Cenário B: Check-in por QR Code (Membro da Loja)**
    *   **Ação:** Um irmão da Loja 42 (user_id: 101) escaneia o QR Code da loja. O app envia os dados e o token de autenticação do irmão.
    *   **API Chamada:** `POST /check-in/qr` com `{ "user_id": 101, "lodge_id": 42, ... }`.
    *   **Segurança e Validações:**
        1.  **Autenticidade:** O sistema valida o token JWT.
        2.  **Identidade:** Confirma que o `user_id` no payload (101) é o mesmo do usuário dono do token. Um usuário não pode fazer check-in por outro.
        3.  **Sessão Ativa:** Encontra a sessão com `status = 'EM_ANDAMENTO'` para a Loja 42.
        4.  **Tempo e Local:** Valida se o check-in ocorre na janela de tempo correta e dentro do raio de tolerância geográfico da loja.
    *   **Resultado:** O `SessionAttendance` do irmão é atualizado para `'Presente'` com `check_in_method = 'QR_CODE'`.

*   **Cenário C: Check-in por QR Code (Visitante)**
    *   **Ação:** Um irmão da Loja "Estrela do Oriente nº 456" (user_id: 202) escaneia o mesmo QR Code.
    *   **Validações:** As validações de segurança, tempo e local são as mesmas. Na etapa de vínculo, o sistema identifica que o `user_id` 202 **não** pertence à Loja 42.
    *   **Resultado:**
        1.  Sua presença é registrada como **visitante** na sessão da Loja 42.
        2.  **Registro de Visitação Cruzada:** O sistema cria um novo registro na tabela `Visit`, documentando que o irmão 202 da sua loja de origem visitou a Loja 42.

#### Passo 4: Finalização e Documentação

*   **Ação:** Um administrador finaliza a sessão.
*   **API Chamada:** `POST /masonic-sessions/{id_da_sessao}/end`.
*   **Segurança:** Rota protegida por permissão.
*   **Resultado:**
    1.  O `status` da sessão muda para **'REALIZADA'**.
    2.  **Automação:** Uma tarefa em segundo plano (`BackgroundTask`) é disparada para gerar o Balaústre em PDF.
    3.  O PDF é salvo no diretório seguro da loja (`storage/1/42/documents/`) e associado à sessão através da tabela `Document`.

Este fluxo detalhado garante um processo robusto, seguro e altamente automatizado.

## 5. Correções e Melhorias Implementadas (Nov. 2025)

Esta seção detalha as correções e melhorias realizadas para estabilizar o sistema e aprimorar a experiência do desenvolvedor.

### 5.1. Refatoração de Estilo e Frontend

Uma refatoração completa da estilização do frontend foi realizada para garantir consistência visual, adesão ao tema escuro e aproveitamento total da largura da página.

*   **Tema Exclusivo Dark Mode:** O arquivo `frontend/src/theme.ts` foi atualizado para exportar exclusivamente um tema escuro baseado no Material-UI.
*   **Aplicação Global do Tema:** O componente `ThemeProvider` e o `CssBaseline` do Material-UI foram integrados em `frontend/src/main.tsx`, garantindo que o tema seja aplicado globalmente e os estilos base sejam normalizados.
*   **Layout Adaptativo e Responsivo:**
    *   **`DashboardLayout.tsx`:** O layout principal do dashboard foi reescrito usando componentes do Material-UI (`Box`, `Drawer`, `List`, `ListItem`), substituindo o CSS customizado e garantindo um layout full-width e responsivo.
    *   **`Header.tsx`:** O componente de cabeçalho foi refatorado para utilizar `AppBar`, `Toolbar` e `Typography` do Material-UI, integrando-o perfeitamente ao novo layout do dashboard.
    *   **`Footer.tsx`:** O componente de rodapé foi simplificado, utilizando `Box` e `Typography` do Material-UI, e sua integração ao layout foi ajustada.
    *   **`WebmasterDashboardLayout.tsx`:** Similar ao `DashboardLayout`, foi refatorado para usar componentes do Material-UI, corrigindo problemas de layout e dependências de CSS.
*   **Páginas Principais Refatoradas:**
    *   **`LandingPage.tsx`:** A página inicial foi completamente reescrita com componentes do Material-UI (`Box`, `Container`, `Typography`, `Grid`, `Paper`, `AppBar`, `Toolbar`, `Button`), garantindo um design full-width, responsivo e aderente ao tema escuro. Adição do logotipo Sigma centralizado acima dos títulos na seção hero.
    *   **`LoginPage.tsx`:** A página de login foi refatorada para usar componentes do Material-UI (`Container`, `Box`, `Typography`, `TextField`, `Button`, `Link`, `CircularProgress`, `FormControlLabel`, `Checkbox`, `Alert`), resolvendo problemas de alinhamento e estilização.
*   **Limpeza de Código:** Todos os arquivos `.css` customizados associados aos componentes refatorados (`DashboardLayout.css`, `Header.css`, `Footer.css`, `LandingPage.css`, `LoginPage.css`) foram removidos para evitar conflitos e manter a consistência com a abordagem do Material-UI.
*   **Correção de Alinhamento Global:** Ajustes foram feitos em `frontend/src/index.css` para remover estilos `body` conflitantes, permitindo que a centralização de componentes (como o formulário de login) funcione corretamente via Material-UI.

### 5.2. Correções na Lógica do Backend e Autenticação

Diversos ajustes foram realizados no backend para resolver problemas de autenticação, permissões e manipulação de dados.

*   **Inconsistência na Validação JWT (`401 Unauthorized`):**
    *   **Problema:** A `SECRET_KEY` estava sendo gerada dinamicamente a cada reinício do servidor, tornando os tokens JWT inválidos após um reload, resultando em erros `401 Unauthorized` (Signature verification failed).
    *   **Solução:** Foi implementado um mecanismo para carregar a `SECRET_KEY` de um arquivo `.env` (utilizando `python-dotenv`) na inicialização do `main.py`. Isso garante que uma chave estática seja utilizada consistentemente, permitindo a validação correta dos tokens JWT.
*   **Erro de Permissão para Super Admins (`403 Forbidden`):**
    *   **Problema:** Super Admins autenticados recebiam `403 Forbidden` ao tentar criar obediências devido a um erro de digitação (`user_type` vs `role`) no payload do JWT.
    *   **Solução:** A dependência `get_current_super_admin` em `backend/routes/obedience_routes.py` foi corrigida para verificar a chave `role` no payload do token, concedendo acesso adequado aos Super Admins.
*   **Erro na Criação de Webmaster (`TypeError`):**
    *   **Problema:** Ao criar uma nova obediência, o sistema tentava criar um `Webmaster` associado usando um argumento `name` inválido para o modelo `Webmaster`.
    *   **Solução:** A função `_create_webmaster_user` em `backend/services/auth_service.py` foi ajustada para usar os argumentos corretos (`username`, `email`) ao instanciar o modelo `Webmaster`, resolvendo o `TypeError`.
*   **Erro de Hashing de Senha (`AttributeError`):
    *   **Problema:** A função `_create_webmaster_user` chamava `password_utils.get_password_hash`, que não existia.
    *   **Solução:** A chamada foi corrigida para `password_utils.hash_password`, a função correta de hashing.
*   **Tratamento de Entrada Duplicada (`500 Internal Server Error` -> `409 Conflict`):**
    *   **Problema:** A tentativa de criar uma obediência com um nome já existente resultava em um `sqlalchemy.exc.IntegrityError`, que não era tratado e resultava em um `500 Internal Server Error` no backend, travando o frontend.
    *   **Solução:** Um bloco `try-except` foi adicionado à função `create_obedience` em `backend/services/obedience_service.py` para capturar `IntegrityError`. Agora, ao detectar uma entrada duplicada pelo `name`, o backend retorna um `HTTPException` com `status.HTTP_409_CONFLICT` e uma mensagem clara: "Já existe uma obediência com este nome.", fornecendo feedback adequado ao frontend.

## 6. Próximos Passos
[Mantenha esta seção atualizada com as próximas tarefas planejadas.]