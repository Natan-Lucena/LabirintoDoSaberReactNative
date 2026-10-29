# Entrega 3 — Tracking

> Registro canônico do progresso da Entrega 3. O trabalho está no [BACKLOG](BACKLOG.md), e o
> plano e as decisões no [ROADMAP](ROADMAP.md). Atualize este arquivo a cada transição de
> tarefa (AGENTS §2). O histórico da V1 fica no
> [TRACKING da Entrega 2](../entrega-2/TRACKING.md).

## 0. Próximo passo global

Estado em 2026-10-28:

- Planejamento da Entrega 3 escrito: roadmap, backlog com 23 tarefas, pedidos ao backend e a
  checagem de sanidade do §3. **Nenhuma tarefa começou.**
- A `main` está em `a687576` (PR #75, V1 integrada), sem PR aberto.

| #   | Ação                                                                                                                                                                | Responsável                     | Condição de conclusão                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------- |
| 1   | ~~Decidir G-47, G-49, G-50 e G-51~~ **aprovadas pelo usuário em 2026-10-28**                                                                                        | Usuário                         | Feito                                     |
| 2   | Enviar ao backend a [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md) (resumo e mensagem em [PEDIDOS-BACKEND §3](PEDIDOS-BACKEND.md#3-mensagem-pronta-para-enviar)) | Usuário                         | Resposta registrada em PEDIDOS-BACKEND §4 |
| 3   | Onda E3-0: NAV-03 e FEC-02 (prontas)                                                                                                                                | Orquestrador → workers          | PRs mergeados com CI verde                |
| 4   | Onda E3-1: AGE-01, PAC-07, REC-02, ATV-02 e FEC-03                                                                                                                  | Orquestrador → workers          | PRs mergeados com CI verde                |
| 5   | PLN-00: registrar o contrato de planos em PROJECT.md e `docs/contracts/planos.md`                                                                                   | Orquestrador, depois do backend | AC-PLN-00-01 e AC-PLN-00-02               |

## 1. Estados

`pronta` (dependências ok), `em andamento`, `bloqueada` (com motivo), `em revisão`,
`concluída` (aceite e verificações), `cancelada`.

## 2. Tarefas

| Tarefa                                     | Bloco | Onda | Estado    | Bloqueio / próximo passo                       | PR / evidência |
| ------------------------------------------ | ----- | ---- | --------- | ---------------------------------------------- | -------------- |
| NAV-03 Limpeza da Entrega 1                | B     | E3-0 | pronta    | G-47 aprovada                                  | —              |
| FEC-02 Mocks desligados por padrão         | A     | E3-0 | pronta    | G-51 aprovada                                  | —              |
| PLN-00 Contrato de planos                  | C     | E3-0 | bloqueada | Resposta do backend                            | —              |
| AGE-01 Tela Agenda                         | B     | E3-1 | pronta    | —                                              | —              |
| PAC-07 Editar paciente                     | B     | E3-1 | pronta    | —                                              | —              |
| REC-02 Perfil e conta                      | B     | E3-1 | pronta    | Sem troca de senha (G-49)                      | —              |
| ATV-02 Detalhe da atividade no visual novo | A     | E3-1 | pronta    | —                                              | —              |
| FEC-03 Grupo inacessível no caderno        | A     | E3-1 | pronta    | —                                              | —              |
| AGE-03 Atendimento: novo, detalhe, editar  | B     | E3-2 | bloqueada | AGE-01                                         | —              |
| PAC-08 Modelos de anamnese                 | B     | E3-2 | pronta    | G-50 aprovada; onda E3-2                       | —              |
| AGE-04 Iniciar sessão pelo atendimento     | B     | E3-3 | bloqueada | AGE-03                                         | —              |
| PAC-06 Anamnese do paciente                | B     | E3-4 | bloqueada | AGE-04 e PAC-08                                | —              |
| PLN-01 Lista de planos                     | C     | E3-4 | bloqueada | PLN-00                                         | —              |
| FEC-01 Rotas da V1 contra o backend real   | A     | E3-4 | bloqueada | FEC-02; autorização do usuário para o emulador | —              |
| PLN-02 Gerar plano com IA                  | C     | E3-5 | bloqueada | PLN-01                                         | —              |
| PAC-04 Aba Planos na ficha                 | C     | E3-5 | bloqueada | PLN-01, PAC-06                                 | —              |
| PLN-03 Rascunho editável e salvar          | C     | E3-6 | bloqueada | PLN-02                                         | —              |
| PLN-04 Detalhe do plano                    | C     | E3-7 | bloqueada | PLN-03                                         | —              |
| PLN-05 Sugestões da IA                     | C     | E3-8 | bloqueada | PLN-04; segunda leva do backend                | —              |
| QA-06 Plano de testes da Entrega 3         | D     | E3-8 | bloqueada | Blocos A a C                                   | —              |
| QA-02 E2E com Maestro                      | D     | E3-9 | bloqueada | QA-06; instalar o Maestro (usuário)            | —              |
| QA-03 Acessibilidade                       | D     | E3-9 | bloqueada | QA-06                                          | —              |
| QA-04 Homologação em aparelhos             | D     | E3-9 | bloqueada | QA-06; aparelho físico e Mac/iPhone            | —              |

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

## 4. Histórico

| Data       | Itens              | Registro                                                                                                                                                                                      |
| ---------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-28 | Planejamento       | Roadmap, backlog (23 tarefas), pedidos ao backend e tracking da Entrega 3; G-47 a G-51 registrados (G-48 resolvido pelo usuário); checagem de sanidade S1 a S8 com código 0 (§3)              |
| 2026-10-28 | Decisões e backend | Usuário aprovou G-47, G-49, G-50 e G-51 (NAV-03, FEC-02 e PAC-08 ficam prontas); PR #76 mergeado; especificação detalhada para o backend em [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md) |
