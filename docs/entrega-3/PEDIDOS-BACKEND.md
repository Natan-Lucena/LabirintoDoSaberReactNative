# Entrega 3 — Pedidos ao backend

> Necessidades do app para negociar com o backend. **Não são contrato**: as rotas, os nomes e
> os formatos são decididos pelo backend e registrados em [PROJECT.md](../PROJECT.md) pela
> PLN-00 ([BACKLOG](BACKLOG.md#pln-00--contrato-do-domínio-de-planos)). Escrito em 2026-10-28.
> As perguntas abertas da Entrega 1 continuam em
> [PERGUNTAS-BACKEND](../entrega-1/PERGUNTAS-BACKEND.md).

## 1. Domínio: Planos com IA (PDI e PE)

Domínio escolhido pelo usuário para a Entrega 3 (G-48). Hoje **não existe nenhuma rota de
planos** no contrato.

### 1.1 Primeira leva (bloqueia PLN-01 a PLN-04 e PAC-04)

| #   | Necessidade           | O que o app precisa                                                                                                                                                                                                         | Tela           |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1   | Entidade plano        | Plano ligado a **um paciente** e ao educador, com: tipo (PDI ou PE), objetivo geral, lista de metas, vigência (início e fim), data da próxima revisão, estado (rascunho, ativo, encerrado) e datas de criação e atualização | todas          |
| 2   | Meta                  | Texto da meta e um estado ou progresso (por exemplo, não iniciada, em andamento, atingida, ou um percentual)                                                                                                                | PLN-04         |
| 3   | Listar planos         | Todos os planos do educador autenticado e os de um paciente, com o progresso já calculado (o app não calcula percentual)                                                                                                    | PLN-01, PAC-04 |
| 4   | Detalhar um plano     | Um plano por id, com as metas                                                                                                                                                                                               | PLN-04         |
| 5   | Gerar rascunho com IA | Entrada: paciente, tipo, foco (texto livre), dificuldades consideradas (lista de textos, hoje `Student.learningTopics`) e duração de referência (3 ou 6 meses). Saída: objetivo geral e metas, **sem salvar**               | PLN-02         |
| 6   | Salvar plano          | Criar o plano a partir do rascunho editado pelo profissional                                                                                                                                                                | PLN-03         |
| 7   | Atualizar plano       | Editar objetivo e metas, mudar o estado de uma meta e registrar uma revisão                                                                                                                                                 | PLN-04         |
| 8   | Erros                 | Códigos estáveis para: plano não encontrado, paciente não pertence ao educador, geração com IA indisponível ou lenta, validação                                                                                             | todas          |

Perguntas que o backend precisa responder junto:

- **PE da sessão:** o PE pede o atendimento ou a sessão de origem? Se sim, qual identificador
  (há o G-06 em aberto: a sessão não guarda o caderno, e o `start` não recebe o atendimento).
- **Tempo da geração:** qual o tempo esperado? O app usa 90 s para as rotas de IA (G-46).
- **Exclusão:** plano pode ser excluído ou só encerrado?

### 1.2 Segunda leva (bloqueia PLN-05)

| #   | Necessidade     | O que o app precisa                                                                         | Tela                     |
| --- | --------------- | ------------------------------------------------------------------------------------------- | ------------------------ |
| 9   | Sugestões da IA | Listar sugestões de ajuste dos planos do educador (texto, plano, meta), aceitar e descartar | PLN-05, cartão da Início |

## 2. Pequenos pedidos (não são domínio novo)

Melhoram telas da Entrega 3, mas **nenhuma tarefa depende deles**: sem resposta, a tela omite o
elemento.

| #   | Pedido                                                             | Por quê                                                                               | Tarefa         | Gate       |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | -------------- | ---------- |
| 10  | Vínculo sessão ↔ caderno (ou atendimento)                          | O player usa o caderno escolhido no app; o relatório não sabe qual conteúdo foi usado | SES-01, AGE-04 | G-06       |
| 11  | `PUT /appointment/:id` aceitar `status` (`COMPLETED`, `CANCELLED`) | Hoje só dá para **excluir** um atendimento; cancelar apaga o histórico                | AGE-03, AGE-04 | —          |
| 12  | Tipo e duração do atendimento                                      | O design mostra "Psicopedagogia · 50 min"                                             | AGE-01, AGE-03 | G-12       |
| 13  | Responsável do paciente (nome e telefone)                          | O contato usa o telefone do próprio paciente                                          | PAC-07         | —          |
| 14  | Papel/profissão do educador                                        | O design mostra "Psicopedagoga · Administradora" no perfil                            | REC-02         | —          |
| 15  | `update-password` autenticado (token do e-mail ou senha atual)     | Hoje a rota é pública e troca a senha só com o e-mail                                 | REC-02         | G-05, G-49 |
| 16  | `GET /task-group/:id` (ou grupos de um caderno)                    | Grupo de outro educador num caderno aparece como indisponível                         | FEC-03         | —          |
| 17  | Editar uma resposta de anamnese                                    | Hoje só há criação; uma correção exige nova resposta                                  | PAC-06         | —          |

## 3. Mensagem pronta para enviar

> Olá! Para a próxima entrega do app, queremos começar o domínio de **Planos (PDI e PE)**.
> Precisamos de: (1) a entidade plano ligada ao paciente, com tipo, objetivo geral, metas,
> vigência, próxima revisão e estado; (2) listar planos do educador e de um paciente, com o
> progresso já calculado; (3) detalhar um plano; (4) gerar um rascunho com IA a partir de
> paciente, tipo, foco, dificuldades e duração (3 ou 6 meses), sem salvar; (5) salvar o plano
> editado; (6) atualizar metas e registrar revisões; (7) códigos de erro estáveis.
> Também queremos saber se o PE precisa do atendimento ou da sessão, quanto tempo a geração
> leva e se um plano pode ser excluído. Numa segunda etapa, sugestões da IA (listar, aceitar,
> descartar). Se der, junto: `status` no `PUT /appointment/:id`, tipo e duração do
> atendimento, responsável do paciente e papel do educador.

## 4. Registro das respostas

| Data | Item | Resposta | Onde foi registrada |
| ---- | ---- | -------- | ------------------- |
| —    | —    | —        | —                   |
