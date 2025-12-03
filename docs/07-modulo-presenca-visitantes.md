# Módulo de Presença e Visitantes

Este documento descreve a implementação do sistema de Check-in de Sessões e o Registro Global de Visitantes.

## 1. Check-in de Sessão (App)

O sistema permite que membros realizem check-in em sessões maçônicas utilizando seus dispositivos móveis, validando tanto a localização quanto um QR Code da Loja.

### Funcionalidades
*   **Validação de Geolocalização**: O usuário deve estar dentro de um raio configurável (padrão 200m) da Loja.
*   **Validação de QR Code**: A Loja possui um QR Code único que deve ser escaneado pelo membro.
*   **Janela de Tempo**: O check-in só é permitido quando a sessão está com status `EM_ANDAMENTO`.
*   **Automação**: O agendador (Scheduler) inicia sessões automaticamente 2 horas antes do horário e as encerra 2 horas depois.

### Fluxo do Usuário
1.  O membro acessa a sessão no App.
2.  Se a sessão estiver `EM_ANDAMENTO`, o botão "Check-in" aparece.
3.  O membro clica, permite acesso à câmera e localização.
4.  Aponta para o QR Code da Loja.
5.  O sistema valida e registra a presença.

### Configuração Técnica
*   **Backend**: `POST /masonic-sessions/{id}/check-in`
*   **Modelo**: `Lodge` possui `geofence_radius` e `qr_code_id`.

---

## 2. Registro Global de Visitantes

Para permitir que visitantes de outras lojas (mesmo não cadastradas no Sigma) registrem presença, foi criado um sistema de cadastro global integrado ao banco de dados `oriente_data`.

### Funcionalidades
*   **Cadastro Público**: Página acessível sem login (`/visitante/cadastro`).
*   **Base Unificada**: Busca lojas na base `oriente_data` (General List of Lodges).
*   **Entrada Manual**: Se a loja não constar na base, o visitante pode inserir os dados manualmente (Nome, Número, Potência).
*   **QR Code de Acesso**: Gera um QR Code contendo um token único e os dados do visitante.

### Fluxo do Visitante
1.  Acessa o link ou QR Code na portaria.
2.  Preenche Nome, CIM e Grau.
3.  Busca sua Loja de origem ou insere manualmente.
4.  Clica em "Gerar Passe".
5.  Apresenta o QR Code gerado ao Chanceler.

### Configuração Técnica
*   **Backend**: 
    *   Conexão secundária com `oriente_data` (MySQL).
    *   Tabela `global_visitors` para armazenar os cadastros.
    *   API `POST /visitors/register` para criar/atualizar visitantes.
    *   API `GET /external-lodges/search` para buscar lojas.
*   **Frontend**:
    *   Página `VisitorRegistrationPage`.
    *   Geração de QR Code com payload JSON (`type: VISITOR_CHECKIN`).

## 3. Próximos Passos (Pendente)

*   **Leitura de Visitante**: Implementar no terminal do Chanceler a leitura do QR Code de visitante (`VISITOR_CHECKIN`) para registrar a presença automaticamente na sessão local.
