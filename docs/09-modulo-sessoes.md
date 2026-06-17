# Módulo de Sessões Maçônicas

**Objetivo:** O Módulo de Sessões Maçônicas deve gerenciar o ciclo de vida de cada sessão maçônica, desde seu agendamento até o seu encerramento formal.

## Ciclo de Vida da Sessão

Uma sessão maçônica passará pelos seguintes estágios de status (conforme o ciclo de vida):
**Prevista -> Agendada -> Em Andamento -> Finalizada -> Encerrada**

Além destes, existem os status de exceção: **Cancelada** e **Suprimida**.

Abaixo está o detalhamento de cada status e suas regras de negócio associadas:

### 1. Prevista
Sessões projetadas automaticamente pelo motor de calendário anual para o futuro, que ainda aguardam a confirmação (geralmente feita pelo Chanceler ou Secretário ao confirmar o calendário do mês).

### 2. Agendada
Trata-se da confirmação de realização de uma sessão em data e hora definidas.
* **Agendamento Automático:** Ocorre com base nas configurações da loja (ex: "Toda sexta-feira às 19:30"). O sistema avalia as restrições de **férias/recesso da loja**, **feriados nacionais** e **feriados customizados** (ex: feriados maçônicos, como 20 de agosto e 17 de junho ou municipais) e define automaticamente a previsão. Esta funcionalidade de automação pode ser ativada ou desativada nas configurações da loja (pelo Webmaster/Venerável). O agendamento consolidado pode ser feito mensalmente ou anualmente.
* **Agendamento Manual/Excepcional:** O Secretário ou Chanceler tem a permissão de agendar manualmente sessões com data e hora flexíveis (ex: sessões eleitorais, magnas de iniciação fora do dia de costume) ou reagendar sessões existentes.

### 3. Em Andamento
Refere-se ao momento em que a sessão está efetivamente ocorrendo.
* **Janela Temporal:** Consiste em uma janela temporal que permite o registro de presença dos membros e o registro de visitantes.
* **Gatilhos:** A sessão pode entrar neste status automaticamente (iniciando 2 horas antes do horário previsto e terminando 2 horas após o início previsto) ou de forma manual (ativada pelo Secretário ou Chanceler).

### 4. Finalizada
Status alcançado automaticamente quando a sessão encerra sua janela temporal (ou é finalizada manualmente). A partir desse momento, não são permitidos novos registros de presença e visitação.

### 5. Encerrada
Sessão que completou totalmente seu ciclo de vida. Este status é alcançado exclusivamente após a inserção e aprovação/assinatura do **Balaústre** (Ata da sessão).

---

## Status de Exceção

* **Cancelada:** Aplicado a sessões que já estavam "Agendadas", mas que foram canceladas de forma explícita e manual pelo Secretário ou Chanceler.
* **Suprimida:** Aplicado de forma automática ou manual a sessões que conflitarem com períodos de **férias/recesso** ou **feriados**, indicando que naquele dia normal de reunião, a loja não trabalhará devido à data comemorativa ou recesso.

---

## Restrição de Acesso e Graus

### Classificação de Documentos e Sessões
Toda sessão e documento associado (como Balaústres e, futuramente, Pranchas e Circulares) deve receber uma classificação de **Grau** correspondente:
* **Aprendiz**
* **Companheiro**
* **Mestre**
* **Restrito** (Exclusivo da Diretoria) *(Futuro)*

### Regras de Autorização
* Membros comuns só podem baixar e visualizar documentos cujos graus sejam menores ou iguais aos seus graus maçônicos (ex: Um Companheiro pode ver Aprendiz e Companheiro, mas não Mestre).
* **Cargos de Acesso Global (Diretoria):** Independentemente do seu grau simbólico numérico, os membros que exercerem certos papéis globais têm acesso a qualquer grau (exceto se futuramente marcado como *Restrito* e o cargo não constar na lista da diretoria executiva). Os cargos globais são: Venerável Mestre, Secretário, Tesoureiro, Chanceler, Orador, 1º Vigilante, 2º Vigilante e Webmaster.

---

## Geração do Calendário e Agendamentos
* O agendamento é capaz de tratar lógicas complexas de recorrência como "Primeira e Terceira sexta-feira do mês", ou "Última quinta-feira do mês".
* A automação ignora reuniões que cairiam em dias marcados no **Controle de Recessos** ou no **Cadastro de Feriados** (Estaduais, Nacionais ou Maçônicos).
* Se uma data agendada for modificada manualmente por um Oficial, a sessão recebe um selo `is_manually_modified = True` para protegê-la de exclusões ou alterações indesejadas pelo motor automático nas gerações futuras.
