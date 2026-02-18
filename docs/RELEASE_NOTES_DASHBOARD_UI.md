Enhance Dashboard UI: Widget layout, colors, and sidebar updates

## Visão Geral
Esta atualização foca na otimização do layout do painel de controle (Dashboard) da loja, ajustando a distribuição dos widgets para ocupar toda a altura da tela sem necessidade de rolagem vertical. Além disso, foram feitas alterações visuais no menu lateral e nos widgets para garantir consistência de design (cor dourada e nomenclaturas).

## Alterações Realizadas

### Frontend
- **LodgeDashboard.tsx**:
    - **Layout Responsivo:** O container principal agora tem altura fixa (`100vh - 80px`), eliminando a rolagem da página inteira.
    - **Datas Comemorativas:** O widget agora preenche o espaço vertical restante na coluna esquerda e possui rolagem interna.
    - **Mural de Avisos:** Renomeado de "Mural da Loja". Agora preenche o espaço vertical restante na coluna direita e possui rolagem interna.
    - **Escala Ágape:** Título alterado para a cor dourada (`COLORS.gold`), padronizando com os demais widgets.
    - **Calendário:**
        - Ocupa 100% da altura da coluna central.
        - O título do mês no calendário agora é dourado.
        - A grade de dias preenche o espaço disponível verticalmente.
    - **Redução de Espaçamento:** O `spacing` do Grid container foi reduzido de 3 para 2, otimizando o uso do espaço.

- **LodgeDashboardLayout.tsx**:
    - **Menu Lateral:**
        - Item "Home" renomeado para "Dashboard".
        - A cor dos rótulos (labels) dos ícones foi alterada para dourado (`#D4AF37`) para combinar com os títulos dos widgets.

## Resultados Esperados
- O Dashboard deve se ajustar perfeitamente à tela em resoluções padrão de desktop, sem barra de rolagem na página principal.
- As listas longas (mural, datas) devem rolar internamente dentro de seus respectivos widgets.
- Identidade visual mais coesa com o uso consistente da cor dourada em títulos e menus.

## Próximos Passos
- Monitorar o comportamento responsivo em telas menores (tablets/laptops com baixa resolução).
- Validar se a altura fixa não corta conteúdo crítico em resoluções muito baixas.
