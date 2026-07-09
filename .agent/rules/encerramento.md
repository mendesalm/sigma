---
trigger: always_on
---

Sempre que o usuário informar que vai encerrar a sessão:
1. O agente irá fazer a atualização de toda a documentação, o commit das mudanças e o push no github.
2. O agente deverá criar/atualizar um documento chamado `handoff.md` na raiz do projeto (ou dentro de docs) detalhando o contexto atual, os problemas pendentes e o que deve ser observado ou continuado na próxima sessão.

No início de cada nova sessão, se houver um arquivo `handoff.md` no projeto, o agente deverá lê-lo proativamente para recuperar o contexto antes de prosseguir com as tarefas.