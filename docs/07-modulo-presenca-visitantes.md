# Módulo de Presença e Visitantes

Este documento descreve a implementação arquitetural e as regras de negócio do sistema de Check-in de Sessões e do Registro Global de Visitantes. O sistema visa garantir segurança, auditoria e facilidade no registro de frequência, atuando com três formas principais de check-in: **Tradicional (Manual)**, **Self Check-in via Mobile (QR Code)** e **Self Check-in via Totem Fixo**.

---

## 1. Regras Gerais de Check-in e Permissões

O acesso e a edição do livro de presenças variam de acordo com o papel do usuário e o status da Sessão Maçônica.

### 1.1 Permissões por Papel
*   **Chanceler (e Secretário):** Podem registrar ou alterar as presenças dos Irmãos do Quadro e Visitantes exclusivamente nas sessões que estiverem com os status **`EM_ANDAMENTO`** ou **`REALIZADA`**.
*   **Webmaster:** Possui a permissão especial de corrigir a frequência de sessões passadas que já se encontram no status **`ENCERRADA`**. Contudo, qualquer modificação em sessões encerradas exige obrigatoriamente um **Motivo (Reason)** e aciona a criação de um log imutável no sistema de auditoria (`AttendanceAuditLog`).

### 1.2 Janela de Tempo Configurável
Lojas possuem autonomia para definir a "Janela de Check-in" de suas sessões (através dos atributos `checkin_window_start_minutes` e `checkin_window_end_minutes`). Exemplo: Uma janela de -30 minutos a +120 minutos permite registros de frequência desde meia hora antes do início até o final da sessão.

---

## 2. Métodos de Check-in Disponíveis

### 2.1 Check-in Tradicional (Manual)
O registro padrão, onde o membro ou visitante assina o livro físico e o Chanceler transcreve os dados para o sistema durante (ou logo após) a sessão. Sujeito às restrições de permissões explicadas acima.

### 2.2 Self Check-in Fixo (Totem)
Para lojas que dispõem de um tablet/dispositivo na entrada do templo (Totem).
*   **Mecânica:** O Maçom abre o app **Σ Maçom**, que gera um QR Code pessoal contendo seus dados e um Token JWT assinado pelo backend. O Totem realiza a leitura desse código.
*   **Processamento Backend:** A API (`POST /check-in/totem`) localiza a sessão ativa da Loja atrelada ao Totem, decodifica o JWT validando a identidade do membro e realiza o registro imediato, sem necessidade de validar a geolocalização do usuário (visto que o Totem já é fixo e autêntico à Loja).

### 2.3 Self Check-in Mobile (App Σ Maçom)
Utilizado em locais sem o Totem, onde o próprio membro utiliza a câmera de seu celular para comprovar que está na loja.
*   **Mecânica:** A Loja imprime um QR Code afixado no mural ou mesa. O membro, usando o app, lê esse QR Code.
*   **Validações Múltiplas:** O sistema verifica não apenas a validade do QR Code, mas também a **Geolocalização** (raio configurável, ex: 200m) e se a sessão está no horário da **Janela de Tempo**.

---

## 3. Gestão e Registro de Visitantes

Visitantes de outras lojas ou potências possuem um fluxo híbrido que avalia o nível de confiança (Trust Level) de seus dados.

### 3.1 Níveis de Confiança (Trust Level)
O banco de dados categoriza a idoneidade da visita através da coluna `trust_level` em `visitors`:
*   **`Certificado`**: O visitante é originário de uma Loja que já faz parte do ecossistema Sigma (o `origin_lodge_id` corresponde a um ID válido no sistema). Confiança máxima validada digitalmente.
*   **`Verificado`**: O visitante inseriu os dados de sua Loja manualmente (Nome, Número e Obediência), e essa Loja não existe no banco de dados interno. A veracidade dependerá do processo convencional de telhamento.

### 3.2 Solicitação Automática de Criação de Loja
Caso um visitante (através do app ou do Totem) realize um check-in alegando pertencer a uma Loja ainda não cadastrada, o Sigma cria uma **`LodgeCreationRequest`** vinculando os dados informados. 
Essa requisição fica sob status "PENDENTE" na fila administrativa dos SuperAdmins, permitindo que novas lojas sejam catalogadas, enriquecendo o banco de dados e preparando o terreno para que, nas próximas visitas de membros daquela Loja, eles sejam elevados ao nível `Certificado`.

---

## 4. Endpoints e Arquitetura Chave

*   `POST /check-in/qr`: Endpoint para o Self Check-in via App (Mobile -> Backend).
*   `POST /check-in/totem`: Endpoint para o Totem Fixo ler o JWT do visitante/membro (Totem -> Backend).
*   `POST /masonic-sessions/{session_id}/attendance`: Registro manual tradicional (Painel -> Backend).
*   **Modelos e Enums Relevantes:**
    *   `MasonicSession`, `Visitor`, `SessionAttendance`.
    *   `AttendanceAuditLog` (Auditoria e conformidade).
    *   `LodgeCreationRequest` (Expansão do banco de dados).

---

## 5. Evoluções Recentes do Módulo

O módulo foi recentemente atualizado para englobar novas funcionalidades de gestão, resiliência e painéis analíticos:

### 5.1 Modo Offline e Sincronização em Lote
Lojas que enfrentam instabilidade de internet podem utilizar o Totem em modo offline. O aplicativo registrará as leituras de QR Code localmente e, quando a conexão for reestabelecida, enviará um array de leituras para o endpoint `POST /check-in/totem/bulk`. O backend utilizará o `timestamp_local` de cada batida de cartão para registro retroativo, ignorando temporariamente a expiração padrão do JWT.

### 5.2 Gestão de Faltas e Justificativas
Irmãos ausentes agora podem enviar justificativas digitais (modelo `AbsenceJustification`).
O Chanceler ou Venerável aprova ou rejeita a solicitação. Ao ser **aprovada**, o sistema registra/atualiza automaticamente o status da presença daquele membro para `Justificado` na sessão correspondente.

### 5.3 Dashboards e Gamificação
Endpoints criados (`/analytics/attendance/`) para calcular e gerar relatórios visuais:
*   **Estatísticas da Loja:** Curvas de média de presença nas últimas sessões, auxiliando o Venerável na gestão do engajamento.
*   **Estatísticas do Membro:** Taxa de assiduidade do Maçom, gerando conquistas como *"Assiduidade Perfeita"* para engajamento e gamificação.

### 5.4 Integração Dinâmica com o Balaústre
O sistema de atas (Balaústre) foi otimizado para gerar rascunhos de forma extremamente granular e organizada. O endpoint fornece a lista nominal do dia separada hierarquicamente:
*   Irmãos do quadro ordenados alfabeticamente e agrupados pelo seu grau (Aprendiz, Companheiro, Mestre).
*   Visitantes mapeados por suas Lojas de origem.
*   Lista dos Irmãos que obtiveram Faltas Justificadas aprovadas.

### 5.5 Alertas na Porta (Restrições e Inadimplência)
O retorno padrão do check-in ou marcação de presença foi estendido para incluir a chave `alerts`. Se um membro constar com status Inativo, Suspenso ou Irregular na loja daquela sessão, um alerta silencioso é enviado para que o Totem ou App do Chanceler exiba uma indicação visual.
