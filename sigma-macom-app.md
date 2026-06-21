# Plano de Implantação: App Mobile Σ Maçom

Este documento define a arquitetura, estrutura e o planejamento das tarefas para a construção do aplicativo móvel Σ Maçom, destinado aos membros do quadro.

## 🔴 Plano Aprovado
O plano foi revisado e as seguintes decisões arquiteturais foram firmadas:
1. **Framework:** React Native com Expo (TypeScript).
2. **Estado:** Zustand + SecureStore para persistência e segurança.
3. **Navegação:** Drawer Navigator (Menu Lateral).
4. **Estilização:** TailwindCSS via NativeWind.

## 1. Overview
O aplicativo **Σ Maçom** permitirá que os irmãos interajam diretamente com o backend do sistema Sigma, oferecendo as seguintes features baseadas nas últimas APIs construídas:
*   Geração do QR Code pessoal (com JWT assinado e encapsulado) para leitura no Totem da Loja.
*   Leitor de QR Code (câmera do celular) para check-in com validação de geolocalização.
*   Envio e visualização de Justificativas de Faltas.
*   Dashboard individual (gamificação) com taxa de assiduidade e conquistas.

**Project Type:** MOBILE
**Primary Agent:** `mobile-developer`

## 2. Success Criteria
*   [ ] O app compila e roda tanto no Android quanto no iOS (via Expo Go / Simuladores).
*   [ ] O JWT e dados sensíveis são armazenados em contêineres seguros (Keychain / Keystore).
*   [ ] O usuário consegue efetuar login e gerar seu QR code offline (após o primeiro login).
*   [ ] As requisições de rede possuem tratamento para cenários de queda de internet.
*   [ ] A UI respeita a área de toque (Fitts' Law) com botões de no mínimo 48px de altura.

## 3. Tech Stack Proposta
*   **Framework:** React Native + Expo
*   **Linguagem:** TypeScript
*   **Navegação:** React Navigation v6 (Drawer Navigator + Stack Navigator)
*   **Estado Global:** Zustand
*   **Estilização:** NativeWind (Tailwind CSS para RN)
*   **Segurança (Storage):** `expo-secure-store`
*   **Câmera e QR Code:** `expo-camera` / `react-native-qrcode-svg`

## 4. File Structure (Inicial)

```text
mobile/
├── App.tsx
├── app.json
├── package.json
├── babel.config.js
├── src/
│   ├── api/               # Instância do Axios, interceptadores (injetando JWT)
│   ├── assets/            # Imagens, fontes
│   ├── components/        # Componentes reutilizáveis (Button, Input, QRCodeDisplay)
│   ├── constants/         # Cores, URLs, Configurações
│   ├── navigation/        # Rotas principais (AuthStack, MainTab)
│   ├── screens/           # Telas (Login, Home/Checkin, Justifications, Stats)
│   ├── store/             # Zustand stores (useAuth, useSession)
│   ├── types/             # Definições de TypeScript
│   └── utils/             # Formatadores, helpers lógicos, SecureStore wrapper
```

## 5. Task Breakdown

### Phase 1: Setup e Fundação
*   **Task 1.1:** Inicializar projeto Expo RN (`npx create-expo-app mobile -t expo-template-blank-typescript`).
*   **Task 1.2:** Configurar NativeWind, React Navigation e SafeAreaContext.
*   **Task 1.3:** Implementar o utilitário de `SecureStore` e a store do Zustand (`useAuth`).
*   **Task 1.4:** Configurar a instância do Axios com interceptor para injetar o token JWT nas chamadas.

### Phase 2: Autenticação
*   **Task 2.1:** Criar tela de Login (UI/UX).
*   **Task 2.2:** Integrar Login com a API `/auth/login` e salvar o JWT de forma segura.

### Phase 3: Presenças e Check-in
*   **Task 3.1:** Implementar tela inicial (Home) exibindo o QR Code do usuário (gerado a partir de seus dados básicos e o JWT).
*   **Task 3.2:** Integrar permissão de Câmera (`expo-camera`) e implementar a view de leitura de QR Code para Lojas que não possuem Totem.
*   **Task 3.3:** Obter a localização do usuário (`expo-location`) e enviar o payload para a API de self check-in.

### Phase 4: Faltas e Dashboard
*   **Task 4.1:** Criar listagem e formulário de justificação de faltas integrada com `/absences/{session_id}/justifications`.
*   **Task 4.2:** Criar tela de Dashboard/Gamificação chamando a API `/analytics/attendance/member` para exibir assiduidade.

## 6. Phase X: Verification Plan
*   **Lint e Tipagem:** Rodar `npx tsc --noEmit` e `npm run lint`.
*   **Testes de Integração Backend:** Testar login, geração e leitura de QR codes contra a API rodando localmente.
*   **Auditoria de UX:** Verificar contraste de cores, botões com tamanho touch amigável (mínimo 44pt/48dp) e ausência de uso de `ScrollView` para listas dinâmicas (utilizar sempre `FlatList` com `memo`).
*   **Compilação:** Rodar `npx expo start` para verificar sucesso sem fatal errors.
