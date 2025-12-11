# Plano de Implementação: Check-in via App (Geo + QR Code)

## Status: Concluído (Fase 1 e 2)

### 1. Backend (Concluído)
- [x] Adicionar `geofence_radius` na tabela `lodges`.
- [x] Criar `geo_service.py` para cálculo de distância.
- [x] Atualizar `session_service.py` com `perform_check_in`.
- [x] Atualizar `scheduler.py` para automação de status.
- [x] Criar API `POST /check-in`.
- [x] Integração com banco `oriente_data` (MySQL).
- [x] API de Registro de Visitantes (`/visitors/register`).

### 2. Frontend (Concluído)
- [x] Instalar `@yudiel/react-qr-scanner`.
- [x] Criar componente `SessionCheckIn`.
- [x] Integrar na `SessionDetailsPage`.
- [x] Criar página pública `VisitorRegistrationPage`.
- [x] Implementar busca de lojas externas e entrada manual.

---

Este documento detalha o plano técnico para implementar a funcionalidade de check-in de presença nas sessões utilizando o aplicativo web (PWA) com validação dupla: Geolocalização e Leitura de QR Code da Loja.

## 1. Alterações no Banco de Dados

### 1.1. Tabela `lodges`
Adicionar campos para configuração da geolocalização e raio de aceitação.
- `geofence_radius`: Integer (em metros), default `200`. Permite ajustar a tolerância por loja.
- *Nota*: `latitude`, `longitude` e `qr_code_id` já existem no modelo.

### 1.2. Tabela `session_attendances`
Garantir que os campos de auditoria do check-in existam e sejam preenchidos corretamente.
- `check_in_method`: Enum já existente, garantir que suporte `APP_QR_GEO`.
- `check_in_latitude`: Float (já existe).
- `check_in_longitude`: Float (já existe).
- `check_in_timestamp`: DateTime (já existe como `check_in_datetime`).

## 2. Backend (Python)

### 2.1. Serviço de Geolocalização (`services/geo_service.py`)
- Implementar função `calculate_distance(lat1, lon1, lat2, lon2)` usando a fórmula de Haversine.
- Implementar função `is_within_radius(user_loc, lodge_loc, radius_meters)`.

### 2.2. Serviço de Sessão (`services/session_service.py`)
- Criar método `perform_check_in(session_id, member_id, qr_code_token, lat, lon)`.
- **Regras de Validação**:
    1.  **Sessão**: A sessão existe e está com status `AGENDADA` ou `EM_ANDAMENTO`.
    2.  **Janela de Tempo**: O horário atual está dentro de `start_time - 30min` e `end_time`.
    3.  **QR Code**: O token enviado corresponde ao `qr_code_id` da Loja vinculada à sessão.
    4.  **Geolocalização**: A distância entre `(lat, lon)` do usuário e da Loja é menor que `lodge.geofence_radius`.
    5.  **Duplicidade**: O membro ainda não fez check-in nesta sessão.

### 2.3. API Endpoints (`controllers/session_controller.py`)
- `POST /sessions/{id}/check-in`
    - **Payload**: `{ "qr_code_token": "uuid...", "latitude": -23.5..., "longitude": -46.6... }`
    - **Response**: 
        - 200 OK: `{ "status": "success", "message": "Presença confirmada" }`
        - 400 Bad Request: `{ "detail": "Fora do raio permitido (500m)" }` ou `{ "detail": "QR Code inválido" }`

## 3. Frontend (React)

### 3.1. Instalação de Dependências
- Instalar biblioteca de leitura de QR Code: `npm install @yudiel/react-qr-scanner` (ou similar moderna e leve).

### 3.2. Componente `SessionCheckIn`
- Criar página/modal acessível via "Minhas Sessões" ou Dashboard.
- **Estados da UI**:
    1.  **Solicitando Permissão**: Botão "Iniciar Check-in" que dispara o pedido de Câmera e GPS.
    2.  **Escaneando**: Mostra o feed da câmera com um overlay de mira.
    3.  **Processando**: Spinner enquanto envia para a API.
    4.  **Sucesso**: Tela verde com confirmação.
    5.  **Erro**: Tela vermelha com o motivo (ex: "Você está muito longe da Loja").

### 3.3. Lógica de Geolocalização
- Usar `navigator.geolocation.getCurrentPosition`.
- Tratar erros:
    - `PERMISSION_DENIED`: Mostrar instruções de como reativar.
    - `POSITION_UNAVAILABLE` / `TIMEOUT`: Permitir tentar novamente ou sugerir check-in manual com o Chanceler.

## 4. Operacional e Gestão

### 4.1. Geração de QR Code da Loja
- No painel do Venerável/Secretário (Gestão da Loja), adicionar botão "Imprimir QR Code de Presença".
- Gerar um PDF simples com o QR Code (contendo o UUID da loja) e instruções ("Escaneie aqui para confirmar presença").

### 4.2. Cadastro de Coordenadas
- Na edição da Loja, adicionar mapa (Google Maps ou OpenStreetMap) para pinçar a localização exata, ou botão "Usar minha localização atual" para facilitar o cadastro inicial.

## 5. Cronograma de Execução (Estimado)

1.  **Dia 1**: Backend (Modelos, GeoService, API Endpoint).
2.  **Dia 2**: Frontend (Componente de Scanner, Integração com GPS).
3.  **Dia 3**: Integração Frontend-Backend, Tratamento de Erros e Testes em Dispositivos Reais.
4.  **Dia 4**: Funcionalidade de Impressão do QR Code e Ajustes Finais.
