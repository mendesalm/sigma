# Implementação de Assinatura Digital e Validação de Documentos

Este documento descreve a implementação do sistema de assinatura eletrônica interna para documentos gerados pelo Sigma (especificamente Balaústres), garantindo integridade e autenticidade através de validação por QR Code.

## 1. Visão Geral

O sistema permite que documentos oficiais, como o Balaústre (Ata) de uma sessão, sejam "assinados" digitalmente pelo usuário responsável (ex: Secretário ou Venerável Mestre). Esta assinatura não utiliza certificados ICP-Brasil (e-CNPJ/e-CPF) por questões de custo e complexidade, optando por um modelo de **Assinatura Eletrônica Interna** com verificação pública.

### Fluxo de Assinatura
1.  O usuário finaliza a edição do documento no **Editor de Balaústre**.
2.  Ao clicar em **"Assinar"**, o sistema:
    *   Gera um **Hash Único** (SHA-256) para o documento.
    *   Cria um registro de assinatura no banco de dados, vinculando o documento, o usuário assinante e o carimbo de tempo.
    *   Gera um **QR Code** contendo a URL pública de validação (`/validate/{hash}`).
    *   Regenera o PDF final, embutindo o QR Code e os dados da assinatura no rodapé.
    *   Salva o documento como `BALAUSTRE_ASSINADO`.

### Fluxo de Validação
1.  Qualquer pessoa com acesso ao PDF (impresso ou digital) pode escanear o QR Code.
2.  O QR Code direciona para uma página pública do sistema (`/validate/{hash}`).
3.  O sistema verifica a existência do hash no banco de dados.
4.  Se válido, exibe um "Selo de Autenticidade" com os dados originais (Título, Loja, Assinante, Data).
5.  Se inválido, exibe um alerta de erro.

## 2. Arquitetura Técnica

### Backend (Python/FastAPI)

#### Modelo de Dados (`models.py`)
Foi criada a tabela `document_signatures` para armazenar os metadados da assinatura:
*   `document_id`: FK para o documento assinado.
*   `signature_hash`: Hash SHA-256 único.
*   `signed_by_id`: FK para o membro que assinou.
*   `signed_at`: Timestamp da assinatura.

#### Serviços (`DocumentGenerationService`)
*   **Geração de Hash:** Combina ID da sessão, UUID e Data Atual.
*   **Geração de QR Code:** Utiliza a biblioteca `qrcode` para gerar uma imagem em Base64 da URL de validação.
*   **Renderização:** O template `balaustre_template.html` foi atualizado para receber e exibir o bloco de assinatura condicionalmente.

#### Rotas (`session_routes.py` e `document_routes.py`)
*   `POST /masonic-sessions/{id}/sign-balaustre`: Endpoint protegido que orquestra o processo de assinatura e geração final.
*   `GET /documents/validate/{hash}`: Endpoint público que retorna os dados da assinatura se o hash for válido.

### Frontend (React/MUI)

#### Editor (`BalaustreEditor.tsx`)
*   Adicionado botão **"Assinar"** com ícone de verificação.
*   Implementada lógica de confirmação e chamada à API de assinatura.

#### Página de Validação (`DocumentValidation.tsx`)
*   Nova rota pública `/validate/:hash`.
*   Interface limpa e responsiva para exibir o status da validação.
*   Ícones visuais claros (Verde/Check para sucesso, Vermelho/Erro para falha).

## 3. Configuração

*   **URL de Validação:** Atualmente configurada para `http://localhost:5173`. Em produção, deve ser atualizada para o domínio real da aplicação no `DocumentGenerationService`.

## 4. Próximos Passos (Melhorias Futuras)
*   Implementar bloqueio de edição para documentos assinados (atualmente o PDF é gerado, mas o rascunho ainda pode ser editado, embora o hash mude se for assinado novamente).
*   Adicionar suporte para assinatura de múltiplos oficiais (ex: Secretário E Venerável).
*   Enviar cópia do documento assinado por e-mail automaticamente.
