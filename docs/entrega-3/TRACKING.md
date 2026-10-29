# Entrega 3 — Tracking

> Registro canônico do progresso da Entrega 3. O trabalho está no [BACKLOG](BACKLOG.md), e o
> plano e as decisões no [ROADMAP](ROADMAP.md). Atualize este arquivo a cada transição de
> tarefa (AGENTS §2). O histórico da V1 fica no
> [TRACKING da Entrega 2](../entrega-2/TRACKING.md).

## 0. Próximo passo global

Estado em 2026-10-29:

- **Na `main`:** NAV-03 (#78), AGE-01 (#79), FEC-02 (#80), ATV-02 (#81), FEC-03 (#82), a
  correção do teste da ATV-02 (#84) e o registro do backend (#85).
- **Backend entregue** (2026-10-29): planos, sugestões sob demanda (G-52), atendimento com
  status, tipo, duração e conflito, sessão ligada ao caderno (G-06), responsável, profissão,
  grupo por id e edição de anamnese. Troca de senha não entrou (G-05/G-49). Contrato e
  divergências do Swagger em [BACKEND-ENTREGUE](BACKEND-ENTREGUE.md); fichas reescritas.
- **Em andamento:** API-03 e PAC-08 com Claude Sonnet. O Codex e o OpenCode atingiram o limite
  de uso da conta OpenAI.
- **Próximo:** E3-3 (AGE-03, SES-05, PAC-07, REC-02, FEC-04) assim que a API-03 entrar.
- **Achado de segurança no backend:** respostas de aluno e do `update-educator` trazem senha de
  educador (BACKEND-ENTREGUE D1 e D3); o app não guarda esses campos (API-03, REC-02).

| #   | Ação                                                                                                                                                                | Responsável                     | Condição de conclusão                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------- |
| 1   | ~~Decidir G-47, G-49, G-50 e G-51~~ **aprovadas pelo usuário em 2026-10-28**                                                                                        | Usuário                         | Feito                                     |
| 2   | Enviar ao backend a [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md) (resumo e mensagem em [PEDIDOS-BACKEND §3](PEDIDOS-BACKEND.md#3-mensagem-pronta-para-enviar)) | Usuário                         | Resposta registrada em PEDIDOS-BACKEND §4 |
| 3   | ~~Onda E3-0 e tarefas sem dependência do backend~~ feitas (#78 a #82)                                                                                               | Orquestrador → workers          | PRs mergeados com CI verde                |
| 4   | ~~Ajustar fichas ao backend~~ feito em 2026-10-29; disparar E3-3 depois da API-03                                                                                   | Orquestrador → workers          | PRs mergeados com CI verde                |
| 5   | PLN-00: registrar o contrato de planos em PROJECT.md e `docs/contracts/planos.md`                                                                                   | Orquestrador, depois do backend | AC-PLN-00-01 e AC-PLN-00-02               |

## 1. Estados

`pronta` (dependências ok), `em andamento`, `bloqueada` (com motivo), `em revisão`,
`concluída` (aceite e verificações), `cancelada`.

## 2. Tarefas

| Tarefa                                             | Bloco | Onda  | Estado                   | Bloqueio / próximo passo                                                                                                                           | PR / evidência                                                                                                          |
| -------------------------------------------------- | ----- | ----- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| NAV-03 Limpeza da Entrega 1                        | B     | E3-0  | **concluída**            | MAN pendente (Início → Novo paciente / Ver ficha no Expo Go)                                                                                       | PR #78 → `8fc08b8`: 730 testes (763 − 33 dos arquivos removidos), typecheck, lint, export Android e CI com código 0     |
| FEC-02 Mocks desligados por padrão                 | A     | E3-0  | **concluída**            | —                                                                                                                                                  | PR #80 → `6706983`: testes de `env` e `install` (17), typecheck, lint, export Android e CI com código 0                 |
| PLN-00 Contrato de planos                          | C     | E3-0  | **concluída** (registro) | Backend entregou em 2026-10-29; contrato em [BACKEND-ENTREGUE](BACKEND-ENTREGUE.md). Registro rota a rota no PROJECT.md adiado a pedido do usuário | —                                                                                                                       |
| AGE-01 Tela Agenda                                 | B     | E3-1  | **concluída**            | MAN pendente no Expo Go. `/agenda/{id}` e `/agenda/new` só existem com a AGE-03 (cast `Href` até lá)                                               | PR #79 → `a27291d`: 7 testes novos, typecheck, lint, export Android e CI com código 0                                   |
| PAC-07 Editar paciente                             | B     | E3-3  | bloqueada                | API-03 (campos do responsável)                                                                                                                     | —                                                                                                                       |
| REC-02 Perfil e conta                              | B     | E3-3  | bloqueada                | API-03 (profissão); sem troca de senha (G-49)                                                                                                      | —                                                                                                                       |
| ATV-02 Detalhe da atividade no visual novo         | A     | E3-1  | **concluída**            | MAN pendente (AC-ATV-02-03: conferir no Expo Go contra o Make)                                                                                     | PR #81 → `5185600`: 738 testes (suíte completa com `--maxWorkers=1`), typecheck, lint, export Android e CI com código 0 |
| FEC-03 Grupo inacessível no caderno                | A     | E3-1  | **concluída**            | MAN pendente no Expo Go                                                                                                                            | PR #82 → `06d26f4`: 740 testes, typecheck, lint, export Android e CI com código 0                                       |
| API-03 Tipos e mocks do contrato novo              | A     | E3-2  | em andamento             | Retomada com Claude Sonnet (worktree e1): Codex e OpenCode atingiram o limite de uso                                                               | —                                                                                                                       |
| SES-05 Sessão ligada ao caderno (G-06)             | B     | E3-3  | bloqueada                | API-03                                                                                                                                             | —                                                                                                                       |
| FEC-04 Grupo de caderno pelo `GET /task-group/:id` | A     | E3-3  | bloqueada                | API-03                                                                                                                                             | —                                                                                                                       |
| AGE-03 Atendimento: novo, detalhe, editar          | B     | E3-3  | bloqueada                | API-03 (tipos com status, tipo e duração)                                                                                                          | —                                                                                                                       |
| PAC-08 Modelos de anamnese                         | B     | E3-2  | em andamento             | Retomada com Claude Sonnet (worktree e2): Codex e OpenCode atingiram o limite de uso                                                               | —                                                                                                                       |
| AGE-04 Iniciar sessão pelo atendimento             | B     | E3-4  | bloqueada                | AGE-03 e SES-05                                                                                                                                    | —                                                                                                                       |
| PAC-06 Anamnese do paciente                        | B     | E3-5  | bloqueada                | AGE-04, PAC-07 e PAC-08                                                                                                                            | —                                                                                                                       |
| PLN-01 Lista de planos                             | C     | E3-5  | bloqueada                | API-03, AGE-04 e REC-02 (arquivos compartilhados)                                                                                                  | —                                                                                                                       |
| FEC-01 Rotas da V1 contra o backend real           | A     | E3-4  | bloqueada                | FEC-02; autorização do usuário para o emulador                                                                                                     | —                                                                                                                       |
| PLN-02 Gerar plano com IA                          | C     | E3-6  | bloqueada                | PLN-01                                                                                                                                             | —                                                                                                                       |
| PAC-04 Aba Planos na ficha                         | C     | E3-7  | bloqueada                | PLN-01 e PAC-06                                                                                                                                    | —                                                                                                                       |
| PLN-03 Rascunho editável e salvar                  | C     | E3-7  | bloqueada                | PLN-02                                                                                                                                             | —                                                                                                                       |
| PLN-04 Detalhe do plano                            | C     | E3-8  | bloqueada                | PLN-03                                                                                                                                             | —                                                                                                                       |
| PLN-05 Sugestões da IA                             | C     | E3-9  | bloqueada                | PLN-04 (sugestões sob demanda, G-52)                                                                                                               | —                                                                                                                       |
| QA-06 Plano de testes da Entrega 3                 | D     | E3-10 | bloqueada                | Blocos A a C                                                                                                                                       | —                                                                                                                       |
| QA-02 E2E com Maestro                              | D     | E3-11 | bloqueada                | QA-06; instalar o Maestro (usuário)                                                                                                                | —                                                                                                                       |
| QA-03 Acessibilidade                               | D     | E3-11 | bloqueada                | QA-06                                                                                                                                              | —                                                                                                                       |
| QA-04 Homologação em aparelhos                     | D     | E3-11 | bloqueada                | QA-06; aparelho físico e Mac/iPhone                                                                                                                | —                                                                                                                       |

## 3. Checagem de sanidade do planejamento (2026-10-28)

Feita pelo orquestrador antes de abrir o PR deste planejamento, com um script que lê o
backlog, o tracking, o roadmap, o GATES e o contrato da API (`docs/PROJECT.md`) e confere a
`main`. O que ela verificou:

| #   | Verificação                                                                                                     | Resultado |
| --- | --------------------------------------------------------------------------------------------------------------- | --------- |
| S1  | Todo endpoint citado nas fichas existe no contrato (`docs/PROJECT.md`, Parte II)                                | ok        |
| S2  | Toda dependência aponta para uma tarefa ou gate existente, e o grafo não tem ciclo                              | ok        |
| S3  | Toda tarefa do backlog está no tracking e no roadmap, com a mesma onda                                          | ok        |
| S4  | Todo critério de aceite tem tipo de verificação (`UT`, `CT`, `E2E`, `CMD`, `MAN`, `REV`) e ID único             | ok        |
| S5  | Arquivos que as fichas mandam **alterar** existem; arquivos e rotas **novos** ainda não existem                 | ok        |
| S6  | Nenhuma onda tem duas tarefas alterando o mesmo arquivo (fora os arquivos de acréscimo do BACKLOG §3)           | ok        |
| S7  | Nenhuma tarefa depende de uma tarefa de onda igual ou posterior                                                 | ok        |
| S8  | Fatos de código citados no roadmap conferidos na `main` (`StudentStep` aceita `studentId`, não há "Sair", etc.) | ok        |

### 3.1 Resultado

**Primeira execução: 16 problemas.** Os reais foram corrigidos no documento antes do PR:

- S6: a PAC-04 e a PLN-02 alteravam a mesma camada de API de planos na onda E3-5. A PLN-01
  passou a criar as funções de leitura, e a PAC-04 ficou proibida de alterar esse arquivo.
- S5: a pasta da aba de planos da PAC-04 estava como "alterada"; é arquivo novo.
- S2: os gates G-47 a G-51 ainda não estavam no GATES.
- Revisão manual da propriedade de arquivos: AGE-04 e PAC-06 alteravam a ficha do paciente
  na mesma onda; a PAC-06 foi para a E3-4.

Os outros eram falsos positivos do script (arquivo na raiz do repositório; arquivo criado por
uma tarefa de onda anterior), corrigidos no próprio script.

**Execução final: código 0.**

```text
fichas: 23
S1 endpoints citados: 39, no contrato: 55
S4 critérios de aceite: 68
S8 fatos conferidos: 11

OK: S1 a S8 sem problemas
```

Também com código 0: `python scripts/check-docs.py`, `npx prettier --check` nos arquivos
alterados e `git diff --check`. O script fica fora do repositório (scratchpad do orquestrador);
a checagem deve ser refeita quando a PLN-00 mudar as fichas de planos.

**Execução de 2026-10-29 (fichas reescritas com o backend):** código 0, com 26 fichas, 61
endpoints conferidos contra o PROJECT.md e o **Swagger publicado** (70 rotas) e 88 critérios de
aceite. Antes, a checagem apontou na ficha da API-03 uma rota sem `:id` e dependências escritas
ao contrário (corrigidas), além de ajustes no próprio script (ondas com dois dígitos e tarefas
já concluídas).

## 4. Histórico

| Data       | Itens              | Registro                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-28 | Planejamento       | Roadmap, backlog (23 tarefas), pedidos ao backend e tracking da Entrega 3; G-47 a G-51 registrados (G-48 resolvido pelo usuário); checagem de sanidade S1 a S8 com código 0 (§3)                                                                                                                                                      |
| 2026-10-28 | Decisões e backend | Usuário aprovou G-47, G-49, G-50 e G-51 (NAV-03, FEC-02 e PAC-08 ficam prontas); PR #76 mergeado; especificação detalhada para o backend em [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md)                                                                                                                                         |
| 2026-10-28 | E3-0               | NAV-03 e FEC-02 disparadas com Codex (GPT-6-Sol, esforço médio), máx. 2 workers. Codex pelo Orca exige `--no-daemon` e um Enter após o despacho (ver CONTEXTO-SESSAO §4)                                                                                                                                                              |
| 2026-10-28 | NAV-03, AGE-01     | NAV-03 revisada e mergeada (PR #78); sobrou `first === "students"` em `useTabItems.ts` (código morto, fora da lista da ficha). AGE-01 disparada (Codex). A suíte completa num processo só não avança com dois workers rodando ao mesmo tempo; o worker usou `--shard=N/8`                                                             |
| 2026-10-28 | AGE-01, ATV-02     | AGE-01 revisada e mergeada (PR #79); a contagem do dia exclui os cancelados. ATV-02 disparada (Codex)                                                                                                                                                                                                                                 |
| 2026-10-28 | FEC-02, ATV-02     | FEC-02 mergeada (PR #80); `install.test.ts` alterado fora da lista para fixar `useMocks: "true"` (item 4 da ficha). Os dois workers Codex pararam com "Selected model is at capacity" (GPT-6-Sol) e foram retomados com uma mensagem. Memória livre de 1,2 a 1,7 GB: um worker por vez até folgar                                     |
| 2026-10-29 | ATV-02, FEC-03     | ATV-02 mergeada (PR #81; corpo do PR com acentos corrompidos, regra de UTF-8 reforçada na spec). O Codex voltou a parar por capacidade do modelo e foi retomado duas vezes. FEC-03 disparada                                                                                                                                          |
| 2026-10-29 | FEC-03             | FEC-03 mergeada (PR #82). Fim das tarefas que não dependem do backend; o resto aguarda o overview do usuário                                                                                                                                                                                                                          |
| 2026-10-29 | Backend            | Backend entregou planos, sugestões sob demanda e os pequenos pedidos (exceto troca de senha); registro e conferência com o Swagger em [BACKEND-ENTREGUE](BACKEND-ENTREGUE.md). Achado de segurança: respostas de aluno e do `update-educator` trazem senha de educador (D1, D3). Também corrigido o teste instável da ATV-02 (PR #84) |
| 2026-10-29 | Desenvolvimento    | Usuário pediu para seguir o desenvolvimento e adiar o registro detalhado no PROJECT.md. API-03 e PAC-08 disparadas (Codex). Tarefas novas: API-03, SES-05 e FEC-04                                                                                                                                                                    |
| 2026-10-29 | Fichas e limites   | Fichas reescritas com o contrato do backend; 26 tarefas; ondas E3-0 a E3-11; G-06 resolvido, G-52 registrado. Codex e OpenCode no limite de uso: API-03 e PAC-08 retomadas com Claude Sonnet sem perder o trabalho                                                                                                                    |
