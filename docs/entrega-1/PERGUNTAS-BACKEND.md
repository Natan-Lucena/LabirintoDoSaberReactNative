# Entrega 1 — Perguntas ao time de backend

> Perguntas que fecham os gates G-05, G-06 e G-07 ([GATES](GATES.md)) e o pedido
> não bloqueante P4 (G-08). O app mobile consome a API como está documentada em
> [PROJECT, Parte II](../PROJECT.md#parte-ii--referência-global-da-api); nada aqui
> propõe mudança de contrato por conta própria. Cada resposta precisa ser registrada
> no histórico de GATES e no TRACKING antes de liberar as tarefas afetadas.

| #   | Gate | Bloqueia                                                             | Enviada em | Respondida em |
| --- | ---- | -------------------------------------------------------------------- | ---------- | ------------- |
| P1  | G-05 | T-404 (etapa Senha da recuperação)                                   | —          | —             |
| P2  | G-06 | T-703, T-704, T-802 (tela 05, início e player) — **caminho crítico** | —          | —             |
| P3  | G-07 | T-802 (envio de respostas)                                           | —          | —             |
| P4  | G-08 | Não bloqueia (melhoria de robustez)                                  | —          | —             |
| P5  | G-43 | INT-01 (evolução na ficha do paciente, REL-05)                       | —          | —             |

## Mensagem pronta para enviar

> Oi, pessoal! Estamos começando o app mobile do Labirinto do Saber e, ao conferir a
> referência da API, ficaram algumas dúvidas que bloqueiam a integração, mais um pedido opcional.
>
> **1. Recuperação de senha (`PUT /educator/generate-token` → `POST /educator/update-password`)**
> O `generate-token` envia um código por e-mail, mas o `update-password` recebe só
> `email` e `newPassword`, sem o código. Como o servidor garante que quem troca a senha
> recebeu o código?
>
> - Existe um campo (ex.: `token`) ou um endpoint de validação do código que não está
>   na documentação? Se existe, qual o nome, o formato e os erros?
> - Se não existe, hoje qualquer pessoa que saiba o e-mail de um educador consegue
>   trocar a senha dele. É um comportamento conhecido? Há previsão de correção?
>
> **2. Como a sessão se liga ao conteúdo (`POST /task-notebook-session/start`)**
> O `start` recebe só `studentId` e `name` e devolve a `TaskNotebookSession` sem
> tarefas, mas pode retornar `404 NOTEBOOK_NOT_FOUND`, e o `answer` retorna
> `TASK_NOT_IN_NOTEBOOK`. Então:
>
> - Como a sessão é associada a um caderno? Há um campo no body do `start` que não
>   está documentado (ex.: `notebookId`)?
> - Como o app obtém a lista de tarefas que a criança vai responder nessa sessão?
> - Dá para iniciar uma sessão a partir de um **grupo de tarefas** ou de **atividades
>   avulsas**, ou só de caderno? (A tela de início tem as opções Cadernos, Grupos e
>   Atividades.)
>
> **3. Unidade de `timeToAnswer` (`POST /task-notebook-session/answer`)**
>
> - O valor é em milissegundos ou em segundos? Inteiro ou pode ter casas decimais?
> - Os relatórios (`totalTimeSession`, `averageTimePerQuestion` etc.) usam a mesma unidade?
>
> **4. (Opcional, não bloqueia) Repetição segura de envios**
> Em rede ruim, um timeout não diz se o `start`, o `answer`, o `finish` ou o
> `observation` chegou ao servidor. Hoje reconciliamos pela listagem
> `GET /task-notebook-session/student/:studentId`, o que é uma heurística no caso do
> `start`. Vocês considerariam aceitar uma chave de idempotência (ex.: header
> `Idempotency-Key`) nesses endpoints, ou expor um `GET` de sessão individual?
>
> **5. Escala do `accuracy` na análise do aluno (`GET /task-notebook-session/analysis/student/:studentId`)**
>
> - `categories[*].accuracy` e `total.accuracy` vêm de 0 a 100 (percentual) ou de 0 a 1?
> - Os percentuais do relatório da sessão (`percentageByCategory`, `percentageByType`)
>   usam a mesma escala?
>
> Obrigado!

## Registro das respostas

Preencher com data, quem respondeu, resposta e o impacto no BACKLOG. Não copiar
credenciais nem dados reais.

- P1: sem resposta. A recuperação de senha não foi exercitada.
- P2: sem resposta do dono do backend. Observado em 2026-10-09: o `start` não devolve tarefas; o app usa o caderno escolhido localmente (G-06 aberto).
- P3: **respondida por observação do backend real em 2026-10-09** (não por resposta do dono). `timeToAnswer` e as médias do relatório vêm em milissegundos (ex.: `12679`, `6816.2`); `totalTimeSession` vem em segundos (`159.852`). G-07 resolvido.
- P4: sem resposta.
- P5: **respondida por observação em 2026-10-09.** `total.accuracy` e `categories[*].accuracy` são frações de 0 a 1 (`0.8`, `0.888…`); `percentageByCategory` e `percentageByType` do relatório da sessão são de 0 a 100. G-43 resolvido.
- P6 (nova, 2026-10-09): o Swagger público (`/api-docs/`) lista só 18 rotas e não inclui rotas que o app usa e que existem no deploy: `GET /educator/me`, `POST /ai-task/generate`, `POST /task/batch`, `GET /task-notebook-session/analysis/student/:id` (e `/ai`). Pedir ao dono para atualizar o Swagger. Outras rotas do app (`/appointment/*`, `/task-group/*`, `PUT /task-notebook/update`, `POST /task/upload-media`) responderam 401 sem token, mas **não foram exercitadas**.
