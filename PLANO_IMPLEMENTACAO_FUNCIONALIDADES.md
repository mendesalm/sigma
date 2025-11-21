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

## 4. Documentação Funcional: Módulo de Gestão de Sessões

### 4.1. Concepção Geral e Regras de Negócio

O módulo gerencia todo o ciclo de vida de uma sessão maçônica, desde seu agendamento até a documentação pós-sessão, de forma automatizada e segura.

#### Conceitos Fundamentais

1.  **Sessão Maçônica (`MasonicSession`):** A entidade central, com um `status` que define seu estado ('AGENDADA', 'EM_ANDAMENTO', 'REALIZADA', 'CANCELADA').
2.  **Presença em Sessão (`SessionAttendance`):** O registro que vincula um usuário a uma sessão, seja como membro do quadro (`member_id`) ou visitante (`visitor_id`).
3.  **Visita (`Visit`):** Tabela que armazena o histórico de visitações entre lojas.
4.  **Documento (`Document`):** Modelo unificado para todos os arquivos, incluindo os PDFs gerados para as sessões, salvos em diretórios isolados por loja.

---

### 4.2. O Ciclo de Vida de uma Sessão: Um Exemplo Prático e Seguro

Vamos usar como exemplo a **"Sessão Magna de Iniciação"** da Loja **"Acácia do Cerrado nº 123"** (ID: 42), agendada para **28 de novembro de 2025, às 20:00**.

#### Passo 1: Agendamento da Sessão

*   **Ação:** Um usuário com permissão de 'webmaster' (ou outro cargo administrativo) agenda a nova sessão.
*   **Segurança:** A rota `POST /masonic-sessions` é protegida e exige um token de um usuário com permissões de gerenciamento.
*   **Regra de Negócio:** O sistema impede a criação de outra sessão para a Loja 42 na mesma data.
*   **Resultado:** Uma nova `MasonicSession` é criada com `status = 'AGENDADA'`.

#### Passo 2: Início Automático da Sessão

*   **Ação:** O agendador do sistema (`scheduler`) executa sua verificação periódica.
*   **Regra de Negócio:** Às **18:00** do dia 28/11/2025 (2 horas antes), a tarefa do agendador detecta que a sessão deve ser iniciada.
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
