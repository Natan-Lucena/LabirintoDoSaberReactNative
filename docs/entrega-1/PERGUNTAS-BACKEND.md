# Entrega 1 — Perguntas ao time de backend

> Perguntas que fecham os gates G-05, G-06 e G-07 ([GATES](GATES.md)) e o pedido
> não bloqueante P4 (G-08). O app mobile consome a API como está documentada em
> [PROJECT, Parte II](../PROJECT.md#parte-ii--referência-global-da-api); nada aqui
> propõe mudança de contrato por conta própria. Cada resposta precisa ser registrada
> no histórico de GATES e no TRACKING antes de liberar as tarefas afetadas.

| # | Gate | Bloqueia | Enviada em | Respondida em |
|---|---|---|---|---|
| P1 | G-05 | T-404 (etapa Senha da recuperação) | — | — |
| P2 | G-06 | T-703, T-704, T-802 (tela 05, início e player) — **caminho crítico** | — | — |
| P3 | G-07 | T-802 (envio de respostas) | — | — |
| P4 | G-08 | Não bloqueia (melhoria de robustez) | — | — |

## Mensagem pronta para enviar

> Oi, pessoal! Estamos começando o app mobile do Labirinto do Saber e, ao conferir a
> referência da API, ficaram 3 dúvidas que bloqueiam telas, mais um pedido opcional.
>
> **1. Recuperação de senha (`PUT /educator/generate-token` → `POST /educator/update-password`)**
> O `generate-token` envia um código por e-mail, mas o `update-password` recebe só
> `email` e `newPassword`, sem o código. Como o servidor garante que quem troca a senha
> recebeu o código?
> - Existe um campo (ex.: `token`) ou um endpoint de validação do código que não está
>   na documentação? Se existe, qual o nome, o formato e os erros?
> - Se não existe, hoje qualquer pessoa que saiba o e-mail de um educador consegue
>   trocar a senha dele. É um comportamento conhecido? Há previsão de correção?
>
> **2. Como a sessão se liga ao conteúdo (`POST /task-notebook-session/start`)**
> O `start` recebe só `studentId` e `name` e devolve a `TaskNotebookSession` sem
> tarefas, mas pode retornar `404 NOTEBOOK_NOT_FOUND`, e o `answer` retorna
> `TASK_NOT_IN_NOTEBOOK`. Então:
> - Como a sessão é associada a um caderno? Há um campo no body do `start` que não
>   está documentado (ex.: `notebookId`)?
> - Como o app obtém a lista de tarefas que a criança vai responder nessa sessão?
> - Dá para iniciar uma sessão a partir de um **grupo de tarefas** ou de **atividades
>   avulsas**, ou só de caderno? (A tela de início tem as opções Cadernos, Grupos e
>   Atividades.)
>
> **3. Unidade de `timeToAnswer` (`POST /task-notebook-session/answer`)**
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
> Obrigado!

## Registro das respostas

Preencher com data, quem respondeu, resposta e o impacto no BACKLOG. Não copiar
credenciais nem dados reais.

- P1:
- P2:
- P3:
- P4:
