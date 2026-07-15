# Contexto Atual
O projeto passou por uma refatoração completa do sistema de temas (Light Mode / Dark Mode) focado exclusivamente na área deslogada (`LandingPage`).
Anteriormente, elementos como animações em Canvas (`HeroBackground`, `FeaturesBackground`), ícones SVG, e layouts (`Header`) estavam com estilos *hardcoded* projetados apenas para fundos escuros (tema cyber/neon). 
Nesta sessão, integramos todos os componentes ao contexto `useTheme()` do Material-UI. O modo claro foi otimizado para possuir contrastes mais severos, utilizando variações de Azul-marinho e tons pálidos de Azul Céu, melhorando a leitura global, removendo efeitos "borrados" por causa do brilho excessivo (`textShadow`/`dropShadow` de cores claras), e escurecendo logotipos de forma dinâmica.

# O que foi feito nesta sessão
1. **Backup da Base de Dados**: Efetuados Dumps completos das bases `sigma_db` e `oriente_data` antes de um encerramento previsto do servidor VPS atual. Os dumps estão salvos em pastas na raiz de `backend/`.
2. **Refatoração Dinâmica (Canvas)**: Implementação do observador de tema no hook `useEffect` dos componentes de animação de fundo (Hero/Features).
3. **Estilos Responsivos**: 
   - A `SigmaAnimatedLogo` ganhou uma classe `cyber-light` adaptada para fundos brancos.
   - Os SVGs que usavam *fill* pálido agora possuem filtro `brightness(0.6)` na `LandingPage` quando estão em modo claro.
   - Menu e tipografias de botões da Navbar (`Header`) e caixas de assinatura ganharam contrastes maiores no modo claro.
   - O botão do controle de temas no `Header` foi substituído por um componente `Switch` nativo do MUI.
4. **Resolução de Contrastes na UI**: Todos os painéis de planos, CTAs, e sombras espalhadas na Landing Page funcionam e interagem de forma fluida sem necessidade de recarregamento, suportando 100% o modo claro (Light mode).

# Problemas Pendentes / Próximos Passos
- **Módulos do Sistema Logado (Dashboards)**: 
  - Até o momento, trabalhamos apenas na casca/apresentação (Landing Page e autenticação).
  - O próximo passo vital é iniciar o desenvolvimento dos módulos de CRUD.
  - Começar pelos módulos primordiais: **Chancelaria** (Gestão de Membros/Obreiros) e **Secretaria** (Gestão de Eventos, Atas e Sessões).
- **Migração do Banco de Dados**:
  - Os dumps SQL foram criados localmente nesta sessão, porém o cliente alertou que o VPS onde o banco de dados está será encerrado. É preciso garantir futuramente a importação correta desses dumps (`sigma_db` e `oriente_data`) na nova arquitetura de persistência, se já houver uma definida.

# Notas para a Próxima Sessão
- Ler e dar prosseguimento ao *CRUD* de **Chancelaria**. Verificar no backend os endpoints relativos à gestão de membros antes de plugar a interface.
- Certificar-se de manter o padrão arquitetônico e visual: As páginas internas deverão usar o tema "holográfico" conforme instrução do usuário anteriormente. A `LandingPage` foi a única a receber a base "aço carbono/cyber" de forma estrita.
