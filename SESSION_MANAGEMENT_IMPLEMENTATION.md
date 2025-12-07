# Implementação do Gerenciamento de Sessões e Presença

Este documento detalha a implementação completa do módulo de Gerenciamento de Sessões Maçônicas no sistema Sigma, incluindo a estrutura hierárquica de tipos de sessão, controle de presença e gestão de documentos.

## 1. Visão Geral

O módulo de sessões foi projetado para cobrir todo o ciclo de vida de uma reunião maçônica:
1.  **Agendamento:** Criação da sessão com definição de data, horário e tipo.
2.  **Realização:** Controle de status (Agendada -> Em Andamento -> Realizada).
3.  **Presença:** Chamada de membros e registro de visitantes.
4.  **Documentação:** Geração e upload de Balaústres (atas) e Editais.

## 2. Estrutura Hierárquica de Sessões

Para garantir a conformidade com os ritos e regulamentos, as sessões são classificadas hierarquicamente em **Tipos** e **Subtipos**.

### Tipos de Sessão (`SessionTypeEnum`)
*   **Ordinária:** Sessões de rotina administrativa e econômica.
*   **Magna:** Sessões rituais solenes (Iniciação, Elevação, etc.).
*   **Extraordinária:** Sessões para fins específicos e não recorrentes (Eleições, Alteração de Estatuto).

### Subtipos (`SessionSubtypeEnum`)
Cada tipo possui um conjunto restrito de subtipos válidos. O sistema valida essa relação tanto no Frontend quanto no Backend.

| Tipo | Subtipos Exemplo |
| :--- | :--- |
| **Ordinária** | Regular, Administrativa, Finanças, Eleitoral |
| **Magna** | Iniciação, Elevação, Exaltação, Posse, Sagração de Templo |
| **Extraordinária** | Eleições de Grão-Mestre, Alteração de Estatuto, Mudança de Rito |

**Validação Técnica:**
No backend, um validador Pydantic (`validate_type_subtype_consistency`) impede a criação de sessões com combinações inválidas (ex: Sessão Ordinária de Iniciação).

## 3. Gestão de Presença (`Attendance`)

O controle de presença permite registrar quem participou da sessão, incluindo obreiros do quadro e visitantes.

### Funcionalidades
*   **Listagem Automática:** Ao visualizar a aba de presença, o sistema lista todos os membros ativos da loja.
*   **Status de Presença:**
    *   `Presente`
    *   `Ausente`
    *   `Justificado`
*   **Registro de Visitantes:**
    *   Cadastro rápido de visitantes com Nome, Loja de Origem, Email e CPF.
    *   Visitantes são salvos no banco de dados (`Visitor` model) para reutilização futura.
    *   Validação de CPF e Email no frontend.

### Endpoints
*   `GET /masonic-sessions/{id}/attendance`: Lista a presença da sessão.
*   `POST /masonic-sessions/{id}/attendance/manual`: Atualiza o status de um membro.
*   `POST /masonic-sessions/{id}/attendance/visitor`: Registra um visitante.

## 4. Gestão de Documentos

Documentos importantes, como o Balaústre (Ata) assinado, podem ser anexados à sessão.

### Funcionalidades
*   **Upload de Documentos:** Permite enviar arquivos (PDF, Imagens) vinculados à sessão.
*   **Download:** Acesso rápido aos documentos anexados.
*   **Tipos de Documento:** Balaústre, Edital, Geral.

### Integração
O modelo `Document` possui uma chave estrangeira `session_id`, permitindo que múltiplos documentos sejam associados a uma única sessão.

## 5. Implementação Técnica

### Backend (Python/FastAPI)
*   **Models:** `MasonicSession`, `SessionAttendance`, `Visitor`, `Document`.
*   **Schemas:** `MasonicSessionCreate`, `SessionAttendanceResponse`, `VisitorCreate`.
*   **Services:** Lógica de negócios encapsulada em `session_service.py`.
*   **Tests:** `tests/test_session_management.py` cobre a validação hierárquica e criação de sessões.

### Frontend (React/MUI)
*   **`SessionForm.tsx`:** Formulário dinâmico que filtra os subtipos com base no tipo selecionado.
*   **`SessionDetailsPage.tsx`:** Página principal da sessão com abas para Geral, Participantes e Documentos.
*   **`AttendanceTab.tsx`:** Componente dedicado à gestão da lista de presença.

## 6. Editor de Balaústre e Geração de Documentos

Foi implementado um editor rico para a criação e personalização de Balaústres (Atas), permitindo a edição do texto e a inserção de dados dinâmicos.

### Funcionalidades
*   **Editor Rich Text (ReactQuill):** Permite a edição livre do texto do balaústre.
*   **Formulário de Dados Dinâmicos:** Interface que simula o documento físico para preenchimento de variáveis (Data, Horário, Oficiais, Seções da Ata).
    *   Preenchimento automático de dados da Loja (Nome, Número, Oriente).
    *   Campos formatados para melhor experiência do usuário.
*   **Personalização Visual:** Drawer lateral para ajuste de estilos (bordas, cores, logo).
*   **Geração de PDF:** O backend utiliza `Playwright` para gerar PDFs fiéis ao layout HTML editado.

### Componentes Chave
*   `BalaustreEditor.tsx`: Página principal do editor.
*   `BalaustreDocumentForm.tsx`: Formulário visual para input de dados estruturados.
*   `DocumentGenerationService`: Serviço de backend responsável pela renderização de templates Jinja2 e conversão para PDF.
*   **Automação:**
    *   Cálculo automático do **Tronco de Beneficência** baseado nas transações financeiras da sessão.
    *   Preenchimento automático do **Expediente** com avisos e circulares publicados no período.

## 8. Assinatura Digital e Validação

Implementado sistema de assinatura eletrônica interna para Balaústres.
*   **Assinatura:** Geração de hash único e QR Code embutido no PDF.
*   **Validação:** Página pública para verificação de autenticidade via QR Code.
*   **Detalhes:** Consulte `DIGITAL_SIGNATURES_IMPLEMENTATION.md`.

## 9. Controle de Acesso e Permissões

A gestão de presença possui regras estritas de acesso baseadas em cargos:
*   **Secretário:** Visualização apenas (Read-Only). Não pode alterar status de presença ou registrar visitantes.
*   **Chanceler:** Permissão total para gerenciar presença e visitantes.
*   **Webmaster/SuperAdmin:** Permissão total.

## 10. Exercício Maçônico e Numeração

O sistema implementa o conceito de "Exercício Maçônico" (`Administration`) para organizar as sessões por gestão.
*   **Numeração Sequencial:** As sessões são numeradas sequencialmente dentro de cada exercício (1, 2, 3...).
*   **Automação:** Ao criar uma sessão, o sistema detecta o exercício atual e sugere o próximo número.
*   **Override Manual:** É possível definir manualmente o número da sessão para casos de legado ou ajustes.

## 11. Títulos de Loja Dinâmicos

O sistema suporta títulos de loja personalizados (ex: ARLS, ARBLS) que são formatados dinamicamente nos documentos gerados (ex: A∴R∴B∴L∴S∴).

## 12. Próximos Passos

*   Criar relatórios estatísticos de frequência dos membros.
*   Expandir a geração de documentos para outros tipos (ex: Certificados de Presença).
*   Implementar envio automático de atas por e-mail.
