# Entrega 4 — Backlog

> Tarefas refinadas da Entrega 4. Leia antes: [AGENTS.md](../../AGENTS.md),
> [PROJECT.md](../PROJECT.md), o [Roadmap da Entrega 4](ROADMAP.md), a
> [Especificação para o backend](ESPECIFICACAO-BACKEND.md) e o
> [CONTEXTO-SESSAO](../CONTEXTO-SESSAO.md). O estado de cada tarefa fica no
> [TRACKING](TRACKING.md).
>
> **Fonte do design:** o Figma Make das Entregas 2 e 3
> ([`L7sCNfMhrzOzhtlNpS3cHr`](https://www.figma.com/make/L7sCNfMhrzOzhtlNpS3cHr/Receive-.fig-files)):
> `EvolutionScreen`, `AssessmentsScreen`, `ReportsScreen` e o sino do `AppHeader`. As descrições
> dos elementos vêm das fichas da [Entrega 2](../entrega-2/BACKLOG.md); o worker confere o código
> do Make com o conector Figma antes de montar a tela. Telas sem desenho usam o design system de
> `src/components/ds` (G-18, G-38).
>
> **Contrato:** as fichas citam as rotas **propostas** na especificação do backend. Antes da
> implementação de cada tarefa, a API-04 registra o contrato real no `PROJECT.md` e as fichas
> são ajustadas, como na Entrega 3 (PLN-00).

## 1. Convenções

As da [Entrega 3](../entrega-3/BACKLOG.md#1-convenções), sem mudança:

- **IDs:** os do mapa da Entrega 2 continuam (EVO-01, AVA-01, REL-01…); os novos são API-04,
  API-05, FEC-05, AUT-01, REC-03, EVO-04, EVO-05, PAC-09, NAV-04 e QA-07. Critérios:
  `AC-<tarefa>-NN`.
- **Verificação:** `UT`, `CT`, `E2E`, `CMD`, `MAN` e `REV`.
- **Ciclo:** ler a ficha → escrever os testes dos AC → ver o vermelho → implementar → validar →
  abrir o PR. Testes em `__tests__/` ao lado do código, **nunca dentro de `app/`**.
- **Uma tarefa = um PR**, a partir de `origin/main`.
- **API:** só rotas do contrato registrado (API-04). O que o design pede e a API não tem é
  omitido, sem campo inventado e sem guardar o dado só no aparelho.
- **Mocks:** todo endpoint novo ganha handler fiel em `src/mocks/handlers/`, teste de
  integração pelo `apiClient` real e seção no `src/mocks/README.md`.
- **Dependências:** nenhuma nova. `expo-print`, `expo-sharing` e `expo-file-system` já estão
  instalados.
- **Dados clínicos:** nada de evolução, resposta de escala, anamnese ou relatório em log, toast
  de erro ou mensagem de commit.
- **IA:** timeout de 90 s (`AI_TIMEOUT_MS`, G-46), carregamento visível, erro com "Tentar
  novamente" e **sem reenvio automático**.
- **Classes de execução:** A (Opus: contrato e diagnóstico difícil), B (Codex, Terra ou Sonnet:
  tela ou módulo com contrato claro), C (Haiku: mecânico).
- **Verificação padrão** (código de saída 0):

  ```bash
  pnpm run typecheck
  pnpm run lint
  pnpm run test
  npx prettier --check <arquivos alterados>
  python scripts/check-docs.py
  ```

## 2. Histórias

As da [Entrega 2](../entrega-2/BACKLOG.md#3-histórias) continuam valendo. A Entrega 4 acrescenta:

| ID     | Como… quero… para…                                                                                              | Tarefas        |
| ------ | --------------------------------------------------------------------------------------------------------------- | -------------- |
| US4-01 | Como profissional, quero recuperar e trocar minha senha com segurança, para que ninguém mais acesse minha conta | AUT-01, REC-03 |
| US4-02 | Como profissional, quero ser lembrada das evoluções pendentes e das revisões de plano, para não perder prazos   | NOT-01, EVO-05 |

| História | Tarefas na Entrega 4                   |
| -------- | -------------------------------------- |
| US2-05   | PAC-05, PAC-09                         |
| US2-06   | EVO-01, EVO-02, EVO-04, EVO-05         |
| US2-09   | AVA-01, AVA-02, AVA-03, AVA-04, AVA-05 |
| US2-11   | REL-01, REL-02, REL-03                 |
| US2-14   | NOT-01 (sem push, G-59)                |
| US2-15   | NAV-04                                 |

## 3. Propriedade de arquivos compartilhados

Cada onda tem um único dono por arquivo; as tarefas seguintes partem da `main` já atualizada.

| Arquivo                                                              | Tarefas, na ordem                                                      | O que cada uma muda                                                       |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/api/types.ts`                                                   | API-05 (uma vez por leva)                                              | tipos de cada domínio; nenhuma tarefa de tela altera                      |
| `src/api/endpoints/<domínio>.ts` e `src/mocks/handlers/<domínio>.ts` | API-05 cria a leitura; a tarefa de tela acrescenta as escritas que usa | um arquivo por domínio: `evolution`, `scales`, `reports`, `notifications` |
| `src/stores/session-flow.ts` e `src/features/sessions/finish/**`     | EVO-01                                                                 | fim da sessão leva à Evolução (G-56)                                      |
| `src/features/home/HomeScreen.tsx`                                   | FEC-05 → EVO-05 → NOT-01 → NAV-04                                      | destaque; "Registrar evolução"; sino; "Aplicar escala"                    |
| `src/features/patients/detail/PatientDetailScreen.tsx`               | EVO-02 → EVO-05 → PAC-05 → PAC-09                                      | "Evolução recente"; atalho; aba Avaliações; "Ver síntese"                 |
| `src/features/agenda/**`                                             | FEC-05 → EVO-05                                                        | destaque e contagem; "Registrar evolução" no atendimento concluído        |
| `src/features/resources/ResourcesScreen.tsx`                         | NAV-04                                                                 | destinos de Evolução, Avaliações e Relatórios                             |
| `src/components/ds/AppHeader.tsx`                                    | NOT-01                                                                 | contador no sino                                                          |
| `src/features/profile/ProfileScreen.tsx`                             | REC-03                                                                 | "Trocar senha"                                                            |
| `src/mocks/install.ts` e `src/mocks/README.md`                       | todas com handler novo                                                 | só acrescentar linhas e seções                                            |

## 4. Tarefas

### 4.1 Bloco A — Base, conta e pendências

#### API-04 — Contrato da Entrega 4 no PROJECT.md

- **Onda:** E4-0 (planos) e uma vez por leva do backend · **Classe:** A (orquestrador)
- **Dep.:** cada leva publicada pelo backend.
- **Escopo:**
  1. Registrar no `PROJECT.md` (Parte II) o contrato de **planos e sugestões** entregue na
     Entrega 3 (pendência da PLN-00), a partir do [BACKEND-ENTREGUE](../entrega-3/BACKEND-ENTREGUE.md)
     e do Swagger.
  2. A cada leva: conferir o Swagger, registrar as rotas novas, anotar as diferenças em relação
     à especificação num `BACKEND-ENTREGUE.md` desta pasta e ajustar as fichas afetadas.
- **Arquivos:** `docs/PROJECT.md`, `docs/entrega-4/BACKEND-ENTREGUE.md` (novo), as fichas deste
  backlog.
- **AC:**
  - AC-API-04-01 toda rota que uma ficha usa está no `PROJECT.md`, com corpo, resposta e erros. `REV`
  - AC-API-04-02 cada diferença entre a especificação e o entregue está registrada e refletida nas fichas. `REV`

#### API-05 — Tipos, endpoints de leitura e mocks do contrato novo

- **Onda:** E4-1, E4-4, E4-8 e E4-9 (uma parte por leva) · **Classe:** B
- **Dep.:** API-04 da leva. Pode começar pela especificação, com os mocks, e ser ajustada quando
  o contrato real sair.
- **Escopo, por leva:**
  1. Tipos em `src/api/types.ts` (evolução e senha; escalas; relatórios; notificações).
  2. Funções de **leitura** em `src/api/endpoints/<domínio>.ts` e chaves de query.
  3. Handlers de mock fiéis, com dados fictícios, incluindo os erros de cada rota.
  4. Teste de integração pelo `apiClient` real para cada rota nova.
  5. Códigos de erro novos em `normalizeApiError` (`src/api/errors.ts`) com mensagem em
     português.
- **Fora do escopo:** telas e escritas usadas só por uma tela (ficam com a tarefa da tela).
- **Arquivos:** `src/api/types.ts`, `src/api/errors.ts`, `src/api/endpoints/{evolution,scales,reports,notifications}.ts`,
  `src/mocks/handlers/*`, `src/mocks/install.ts`, `src/mocks/README.md` e os testes.
- **AC:**
  - AC-API-05-01 tipos e mocks seguem o contrato registrado, campo a campo. `UT` + `REV`
  - AC-API-05-02 cada rota tem teste pelo `apiClient` real com sucesso e com o erro principal. `UT`
  - AC-API-05-03 os códigos de erro novos têm mensagem em português. `UT`

#### FEC-05 — Pendências da Entrega 3

- **Onda:** E4-0 · **Classe:** B · **Dep.:** — (não depende do backend)
- **Escopo:**
  1. **E-09:** o avatar da escolha de paciente na sessão mostra a foto, como na lista de
     pacientes.
  2. **Destaque que não atualiza:** o "Próximo atendimento" da Início e o "Atendimento atual"
     da Agenda são recalculados quando a tela volta ao foco e a cada minuto com a tela aberta.
  3. **E-11:** remover os avisos de API obsoleta que aparecem no log do Metro (identificar
     cada um e trocar pela API indicada).
  4. **E-10:** decidido manter a contagem atual (sem os cancelados); nada muda no código.
- **Fora do escopo:** S-01, S-03, S-06 e S-07, que estão com o outro dev (issue #129).
- **Arquivos:** `src/features/sessions/StudentStep.tsx`, `src/features/home/HomeScreen.tsx`,
  `src/features/home/selectors.ts`, `src/features/agenda/**` (só destaque e contagem) e os
  arquivos apontados pelos avisos.
- **AC:**
  - AC-FEC-05-01 o paciente com foto aparece com a foto na escolha da sessão. `CT`
  - AC-FEC-05-02 com o relógio avançado além do fim do atendimento, o destaque passa ao próximo sem reabrir a tela. `CT`
  - AC-FEC-05-03 o Metro abre o app sem os avisos de API obsoleta listados no PR. `MAN`

#### AUT-01 — Recuperação de senha com código

- **Onda:** E4-2 · **Classe:** B · **Dep.:** API-05 (senha); backend §2.1 (leva 1); G-05.
- **Endpoints:** `PUT /educator/generate-token`, `POST /educator/verify-token`,
  `POST /educator/update-password` (com `token`).
- **Escopo:**
  1. "Esqueci a senha" em três passos: e-mail → código de 6 dígitos (badge "Código verificado"
     do design, C-05) → nova senha e confirmação.
  2. A mensagem do envio é a mesma exista ou não a conta (SN-02).
  3. Erros com mensagem: código inválido, vencido, muitas tentativas e senha igual à anterior;
     "Reenviar código" com espera de 60 s.
  4. Sucesso volta ao login com aviso "Senha alterada. Entre com a nova senha."
- **Arquivos:** `app/(auth)/forgot-password.tsx`, `src/features/auth/password-reset/**` (novo),
  `src/api/endpoints/educator.ts` (funções de senha).
- **AC:**
  - AC-AUT-01-01 a troca só é enviada com o código verificado. `CT`
  - AC-AUT-01-02 cada código de erro mostra a mensagem certa. `CT`
  - AC-AUT-01-03 o reenvio fica desabilitado por 60 s. `CT`
  - AC-AUT-01-04 nenhuma senha ou código vai para log ou cache. `REV`

#### REC-03 — Trocar senha no perfil

- **Onda:** E4-2 · **Classe:** B · **Dep.:** API-05 (senha); backend §2.2 (leva 1); G-49.
- **Endpoint:** `PUT /educator/change-password`.
- **Escopo:** "Trocar senha" no perfil abre um formulário com senha atual, nova e confirmação
  (6 a 100 caracteres, mostrar/ocultar). Sucesso grava o **token novo** devolvido (SN-08) e mostra
  confirmação; senha atual errada marca o campo.
- **Arquivos:** `src/features/profile/ProfileScreen.tsx`, `src/features/profile/change-password/**`
  (novo), `app/profile/change-password.tsx` (novo).
- **AC:**
  - AC-REC-03-01 sucesso troca o token guardado e o app continua logado. `CT`
  - AC-REC-03-02 `INVALID_CURRENT_PASSWORD` marca o campo da senha atual. `CT`
  - AC-REC-03-03 a confirmação diferente impede o envio. `CT`

### 4.2 Bloco B — Evolução da sessão

#### EVO-01 — Evolução da sessão

- **Onda:** E4-2 · **Classe:** B, com revisão A do fluxo de sessão
- **Figma:** `EvolutionScreen` (ver [ficha da Entrega 2](../entrega-2/BACKLOG.md#evo-01--evolução-da-sessão)).
- **Dep.:** API-05 (evolução); backend §3 (leva 1); G-56, G-57.
- **Endpoints:** `GET /session-evolution/context/:sessionId`, `POST /session-evolution/`.
- **Escopo:**
  1. Ao finalizar a sessão, o fluxo vai para a **Evolução** no lugar da observação (G-56). O
     passo `awaitingObservation` do `session-flow` passa a significar "aguardando evolução"; a
     retomada depois de fechar o app continua funcionando.
  2. A tela abre com o contexto do servidor: paciente e data, "PE · {tema}" com duração e nº de
     critérios, e os critérios sugeridos.
  3. Cada critério: resultado (Atingido, Parcial, Não atingido, Não observado), tentativas e
     acertos opcionais ("8 de 10 tentativas") e nota curta. O profissional pode remover um
     critério sugerido ou incluir um livre.
  4. "Atualizar prontuário": para cada critério ligado a uma meta, a opção de mudar o estado da
     meta (vira `goalUpdates`).
  5. Sem plano: aviso com o atalho "Criar PE" (PLN-02 com o paciente e a data) e só o registro
     descritivo.
  6. "Salvar e atualizar prontuário" envia uma vez; depois, o painel "Evolução registrada" com
     "Ver prontuário" e "Voltar ao início".
  7. Sair com alteração não salva pede confirmação; o Voltar do Android segue a mesma regra.
- **Fora do escopo:** sugestão da IA (EVO-04); editar evolução (EVO-02).
- **Arquivos:** `src/stores/session-flow.ts`, `src/features/sessions/finish/**`,
  `app/session/finish.tsx`, `src/features/evolution/register/**` (novo),
  `app/evolution/[sessionId].tsx` (novo), `src/api/endpoints/evolution.ts` (escrita).
- **AC:**
  - AC-EVO-01-01 os critérios vêm do contexto do servidor; sem plano, aparece o aviso com "Criar PE". `CT`
  - AC-EVO-01-02 salvar envia critérios, registro e `goalUpdates` uma única vez; o botão fica desabilitado durante o envio. `CT`
  - AC-EVO-01-03 `successes` maior que `attempts` é bloqueado antes do envio. `UT`
  - AC-EVO-01-04 sair com alteração não salva pede confirmação. `CT`
  - AC-EVO-01-05 fechar o app na Evolução e reabrir volta para a Evolução da mesma sessão. `UT`
  - AC-EVO-01-06 `EVOLUTION_ALREADY_EXISTS` leva ao registro existente, sem duplicar. `CT`

#### EVO-02 — Prontuário e hub de evolução

- **Onda:** E4-3 · **Classe:** B · **Dep.:** EVO-01.
- **Endpoints:** `GET /session-evolution/`, `GET /session-evolution/:id`,
  `PUT /session-evolution/:id`, `GET /session-evolution/pending`.
- **Escopo:**
  1. **Prontuário do paciente:** histórico cronológico das evoluções (data, plano, "N de M
     critérios atingidos", trecho do registro), mais recente primeiro.
  2. **Detalhe:** critérios, registro, sugestão e metas atualizadas; "Editar" reabre o
     formulário da EVO-01 preenchido.
  3. **Hub "Evolução da sessão"** (destino de Recursos): "Sessões sem evolução" (pendentes) e
     "Evoluções recentes" de todos os pacientes.
  4. Na ficha, a seção "Evolução recente" passa a mostrar as **duas últimas evoluções** com "Ver
     prontuário"; o acerto das sessões continua na aba de relatórios do aluno.
- **Arquivos:** `src/features/evolution/records/**`, `src/features/evolution/hub/**` (novos),
  `app/evolution/index.tsx`, `app/evolution/record/[id].tsx`, `app/patients/[id]/records.tsx`
  (novos), `src/features/patients/detail/PatientDetailScreen.tsx` (só a seção).
- **AC:**
  - AC-EVO-02-01 a evolução salva aparece no topo do prontuário e da ficha. `CT`
  - AC-EVO-02-02 editar envia a lista completa de critérios e reflete no detalhe. `CT`
  - AC-EVO-02-03 a sessão some de "Sessões sem evolução" depois de registrada. `CT`

#### EVO-04 — Sugestão para a próxima sessão (IA)

- **Onda:** E4-7 · **Classe:** B · **Dep.:** EVO-01; backend §3.6 (leva 3).
- **Endpoint:** `POST /session-evolution/next-session-suggestion`.
- **Escopo:** bloco `.ai-context` "Sugestão para a próxima sessão" na Evolução, com "Gerar
  sugestão". O texto gerado entra num campo editável e é salvo em `nextSessionSuggestion`. Na
  próxima sessão do paciente, a sugestão da última evolução aparece na montagem da sessão.
- **Arquivos:** `src/features/evolution/register/**` (bloco), `src/features/sessions/ContentStep.tsx`
  (só a exibição).
- **AC:**
  - AC-EVO-04-01 a geração mostra carregamento, resultado ou erro, sem reenvio automático. `CT`
  - AC-EVO-04-02 o texto editado é o que vai no salvamento. `CT`
  - AC-EVO-04-03 a montagem da próxima sessão do paciente mostra a última sugestão. `CT`

#### EVO-05 — Entradas para registrar a evolução

- **Onda:** E4-3 · **Classe:** B · **Dep.:** EVO-02.
- **Escopo:** "Registrar evolução" onde a sessão termina sem evolução:
  1. no detalhe do atendimento `COMPLETED` cuja sessão não tem evolução;
  2. na agenda de hoje da Início, no atendimento concluído sem evolução;
  3. na ficha do paciente, quando há sessão pendente.
- **Arquivos:** `src/features/agenda/detail/**`, `src/features/home/HomeScreen.tsx`,
  `src/features/patients/detail/PatientDetailScreen.tsx` (só o atalho).
- **AC:**
  - AC-EVO-05-01 o atalho só aparece para sessão finalizada sem evolução e abre a EVO-01 da sessão certa. `CT`

### 4.3 Bloco C — Avaliações e escalas

#### AVA-01 — Hub de avaliações

- **Onda:** E4-4 · **Classe:** B · **Dep.:** API-05 (escalas); backend §4 (leva 2); G-55.
- **Figma:** `AssessmentsScreen` (`started=false`): "Nova aplicação" com "Escolher escala",
  "Modelos disponíveis" (nº de itens e tempo, "Aplicar escala") e "Aplicações recentes" com a
  faixa em `badge`.
- **Endpoints:** `GET /scale-template/`, `GET /scale-application/`.
- **Arquivos:** `app/assessments/index.tsx`, `src/features/assessments/hub/**` (novos).
- **AC:**
  - AC-AVA-01-01 modelos e aplicações vêm da API. `CT`
  - AC-AVA-01-02 a cor do `badge` segue a `severity` da faixa; o texto é o `label` do servidor. `CT`
  - AC-AVA-01-03 rascunhos aparecem com "Continuar". `CT`

#### AVA-02 — Aplicar escala

- **Onda:** E4-5 · **Classe:** B · **Dep.:** AVA-01.
- **Figma:** `AssessmentsScreen` (`started=true`): `.form-progress` "N de M", `.instruction` e
  `.question-card` com `.scale-option`.
- **Endpoints:** `GET /scale-template/:id`, `POST /scale-application/`,
  `PUT /scale-application/:id/answers`.
- **Escopo:** escolher o paciente (ou vir com ele pela ficha); uma pergunta por vez, com as
  opções da escala; a resposta é salva no servidor ao avançar; voltar e mudar uma resposta;
  `DRAFT_ALREADY_EXISTS` retoma o rascunho existente.
- **Arquivos:** `app/assessments/apply/[templateId].tsx`, `src/features/assessments/apply/**`
  (novos), `src/api/endpoints/scales.ts` (escritas).
- **AC:**
  - AC-AVA-02-01 as opções vêm da escala, na ordem do servidor. `CT`
  - AC-AVA-02-02 o progresso avança a cada resposta salva. `CT`
  - AC-AVA-02-03 sem paciente, pede para escolher antes de começar. `CT`
  - AC-AVA-02-04 falha ao salvar uma resposta não avança e oferece "Tentar novamente". `CT`

#### AVA-03 — Escore, insight e conclusão

- **Onda:** E4-5 (insight na E4-7) · **Classe:** B · **Dep.:** AVA-02; G-60.
- **Figma:** `.score-preview` ("Pontuação parcial", N/M, faixa e o aviso clínico),
  `.ai-insight` "Insight preliminar", "Salvar rascunho" e "Concluir escala".
- **Endpoints:** `POST /scale-application/:id/complete`, `POST /scale-application/:id/insight`.
- **Escopo:** o escore e a faixa mostrados são os da última resposta do servidor; faixa parcial
  marcada "parcial"; "Concluir escala" só com todos os itens; o insight é gerado pelo botão.
- **Arquivos:** `src/features/assessments/apply/**` (escore e conclusão).
- **AC:**
  - AC-AVA-03-01 escore, faixa e insight vêm do servidor; o app não calcula. `CT` + `REV`
  - AC-AVA-03-02 o aviso clínico aparece sempre. `CT`
  - AC-AVA-03-03 concluir trava a edição e leva à AVA-04; `SCALE_INCOMPLETE` leva ao primeiro item faltante. `CT`
  - AC-AVA-03-04 o insight segue a regra de IA do §1, e falhar não impede concluir. `CT`

#### AVA-04 — Resultado da aplicação

- **Onda:** E4-6 · **Classe:** B · **Dep.:** AVA-03.
- **Endpoint:** `GET /scale-application/:id`.
- **Escopo:** escore total e por subescala, faixa, insight, data, aviso clínico e as respostas
  item a item (recolhíveis); "Gerar insight" se ainda não houver.
- **Arquivos:** `app/assessments/results/[id].tsx`, `src/features/assessments/result/**` (novos).
- **AC:**
  - AC-AVA-04-01 mostra escore, subescalas, faixa, insight, data e respostas. `CT`

#### AVA-05 — Rascunhos

- **Onda:** E4-6 · **Classe:** B · **Dep.:** AVA-03.
- **Endpoints:** `GET /scale-application/?status=DRAFT`, `DELETE /scale-application/:id`.
- **Escopo:** "Salvar rascunho" sai da aplicação com as respostas já salvas; reabrir retoma na
  primeira pergunta sem resposta; "Descartar rascunho" com confirmação.
- **AC:**
  - AC-AVA-05-01 reabrir retoma na primeira pergunta sem resposta. `CT`
  - AC-AVA-05-02 descartar pede confirmação e remove da lista. `CT`

#### PAC-05 — Ficha: Avaliações

- **Onda:** E4-6 · **Classe:** B · **Dep.:** AVA-01; dona da ficha nesta onda.
- **Figma:** aba `avaliacoes`: `InfoCard` da escala ("Ver resultado"), `InfoCard` "Anamnese"
  ("Ver síntese") e "Nova avaliação".
- **Endpoints:** `GET /scale-application/?studentId=`, `GET /anamnese/responses/student/:studentId`.
- **Arquivos:** `src/features/patients/detail/PatientDetailScreen.tsx` (aba nova),
  `src/features/patients/detail/assessments/**` (novo).
- **AC:**
  - AC-PAC-05-01 lista as aplicações e a anamnese do paciente. `CT`
  - AC-PAC-05-02 "Ver resultado" leva à AVA-04, "Ver síntese" à PAC-09 e "Nova avaliação" à AVA-02 com o paciente. `CT`

#### PAC-09 — Síntese da anamnese (IA)

- **Onda:** E4-7 · **Classe:** B · **Dep.:** PAC-05; backend §5 (leva 3).
- **Endpoints:** `POST /anamnese/responses/:responseId/summary`, `GET /anamnese/responses/:responseId`.
- **Escopo:** tela "Síntese da anamnese" com o texto, a data e "Gerar síntese" / "Gerar de
  novo"; com `summaryOutdated`, aviso "A anamnese mudou depois desta síntese".
- **Arquivos:** `app/patients/[id]/anamnese-summary.tsx`, `src/features/anamnese/summary/**` (novos).
- **AC:**
  - AC-PAC-09-01 sem síntese, mostra "Gerar síntese"; com síntese, o texto e a data. `CT`
  - AC-PAC-09-02 `summaryOutdated` mostra o aviso. `CT`

### 4.4 Bloco D — Relatórios

#### REL-01 — Configurar relatório

- **Onda:** E4-8 · **Classe:** B · **Dep.:** API-05 (relatórios); backend §6 (leva 4); G-58.
- **Figma:** `ReportsScreen`: `.privacy-note` "Relatórios seguros por padrão", Paciente, Tipo,
  Período, "Incluir no documento" e "Gerar síntese".
- **Endpoints:** `GET /report/options`, `POST /report/`.
- **Escopo:** tipos, seções, audiências e períodos vêm de `options`; as seções sensíveis vêm
  desmarcadas para família e escola (RP-01) e mostram um aviso se marcadas; a geração mostra o
  carregamento (até 90 s) e o erro, sem reenvio.
- **Arquivos:** `app/reports/index.tsx` (substitui o destino atual de Recursos),
  `src/features/reports/configure/**` (novo).
- **AC:**
  - AC-REL-01-01 tipos, seções e períodos vêm da API. `CT`
  - AC-REL-01-02 as seções permitidas mudam com o tipo. `CT`
  - AC-REL-01-03 `REPORT_EMPTY_PERIOD` e `SECTION_NOT_ALLOWED` mostram mensagem. `CT`

#### REL-02 — Prévia, PDF e envio

- **Onda:** E4-8 · **Classe:** B · **Dep.:** REL-01; G-34, G-45, G-58.
- **Figma:** `.report-preview` ("Relatório pronto", "PDF · N páginas"), `.paper-preview`,
  "Imprimir" e "Enviar".
- **Endpoint:** `POST /report/:id/share`.
- **Escopo:** gerar o HTML do relatório a partir do `content` (só as seções presentes) e o PDF
  com `expo-print`; imprimir e compartilhar pelo mesmo caminho dos PDFs atuais
  (`src/features/reports/sharePdf.ts`); registrar cada impressão ou envio; apagar o arquivo
  temporário depois; `synthesisFailed` mostra o relatório sem a síntese, com aviso.
- **Arquivos:** `src/features/reports/document/**` (novo), `src/features/reports/sharePdf.ts`
  (só se precisar de opção nova).
- **AC:**
  - AC-REL-02-01 o HTML só tem as seções do `content`; nenhum campo de contato ou documento. `UT`
  - AC-REL-02-02 o PDF imprime e é compartilhado no Expo Go (Android). `MAN`
  - AC-REL-02-03 o arquivo temporário é apagado depois do compartilhamento. `UT`
  - AC-REL-02-04 nenhum dado do relatório vai para log. `REV`

#### REL-03 — Histórico de relatórios

- **Onda:** E4-9 · **Classe:** B · **Dep.:** REL-02.
- **Endpoints:** `GET /report/`, `GET /report/:id`, `DELETE /report/:id`.
- **Escopo:** lista por paciente e geral (tipo, período, data, último envio); reabrir gera o PDF
  do mesmo conteúdo; reenviar; excluir com confirmação.
- **Arquivos:** `app/reports/history.tsx`, `src/features/reports/history/**` (novos).
- **AC:**
  - AC-REL-03-01 lista os relatórios com reabrir, reenviar e excluir. `CT`
  - AC-REL-03-02 reabrir mostra o mesmo conteúdo da geração (RP-03). `CT`

### 4.5 Bloco E — Notificações e navegação

#### NOT-01 — Notificações no app

- **Onda:** E4-9 · **Classe:** B · **Dep.:** API-05 (notificações); backend §7 (leva 5); G-59.
- **Figma:** `IconButton` `bell` no `AppHeader`; lista sem desenho (G-18).
- **Endpoints:** `GET /notification/`, `GET /notification/unread-count`,
  `POST /notification/:id/read`, `POST /notification/read-all`.
- **Escopo:** contador no sino (atualizado ao abrir o app e ao voltar ao foco); lista paginada
  com não lidas em destaque; tocar marca como lida e navega ao destino; destino inexistente
  mostra "não está mais disponível"; "Marcar todas como lidas". **Sem push** (G-59).
- **Arquivos:** `src/components/ds/AppHeader.tsx` (contador), `app/notifications.tsx`,
  `src/features/notifications/**` (novos), `src/features/home/HomeScreen.tsx` (`onBellPress`).
- **AC:**
  - AC-NOT-01-01 o sino mostra o contador de não lidas, com rótulo acessível ("3 notificações não lidas"). `CT`
  - AC-NOT-01-02 tocar numa notificação marca como lida e navega ao destino. `CT`
  - AC-NOT-01-03 "Marcar todas como lidas" zera o contador. `CT`

#### NAV-04 — Recursos e atalhos para os domínios novos

- **Onda:** E4-10 · **Classe:** C · **Dep.:** EVO-02, AVA-01, REL-03.
- **Escopo:** em Recursos, "Evolução da sessão" → hub da EVO-02, "Avaliações e escalas" →
  AVA-01, "Relatórios" → REL-01 (com acesso ao histórico); na Início, "Aplicar escala" → AVA-01.
  Equipe e Central de ajuda continuam em "Em breve". Se a tela de relatórios da V1
  (`app/(tabs)/reports.tsx`) ficar sem uso, removê-la (a do relatório da sessão continua).
- **Arquivos:** `src/features/resources/ResourcesScreen.tsx`, `src/features/home/HomeScreen.tsx`,
  `app/(tabs)/reports.tsx`, `app/(tabs)/_layout.tsx`.
- **AC:**
  - AC-NAV-04-01 nenhum item de domínio entregue leva a "Em breve". `CT`
  - AC-NAV-04-02 nenhuma rota fica órfã (busca por referências no PR). `REV`

### 4.6 Bloco F — Qualidade

#### QA-07 — Plano de testes manuais da Entrega 4

- **Onda:** E4-0 (esqueleto) e E4-11 (rodada) · **Classe:** B (escrita) e C (execução)
- **Dep.:** rodada depois de todas as tarefas de código; emulador com autorização do usuário.
- **Escopo:** roteiro no formato do [PLANO-TESTES da Entrega 3](../entrega-3/PLANO-TESTES.md):
  um caso por AC `MAN`, um por fluxo entre telas (sessão → evolução → prontuário; ficha →
  escala → resultado; relatório → PDF → envio; sino → destino; esqueci a senha → login) e as
  conferências do backend (BE-SN, BE-EV, BE-AV, BE-RP, BE-NT). Inclui o reteste do fluxo de
  sessão inteiro, que muda com a EVO-01.
- **Arquivos:** `docs/entrega-4/PLANO-TESTES.md`, `docs/entrega-4/testes/**`.
- **AC:**
  - AC-QA-07-01 todos os casos P1 passam no Android (emulador, backend real). `MAN`

#### QA-02 — E2E com Maestro

- **Onda:** E4-11 · **Classe:** B · **Dep.:** QA-07; autorização para instalar o Maestro.
- **Escopo:** os cinco fluxos do mapa: login → Início → iniciar sessão → salvar evolução; novo
  paciente → gerar PDI → salvar; aplicar escala → concluir; gerar relatório → compartilhar;
  novo atendimento. Só com "Paciente Teste…".
- **AC:** AC-QA-02-01 os cinco fluxos passam no AVD Android. `E2E`

#### QA-03 — Acessibilidade

- **Onda:** E4-11 · **Classe:** B · **Dep.:** NAV-04.
- **Escopo:** TalkBack, fonte grande, contraste e alvos de 44 nas telas das Entregas 3 e 4,
  pelo roteiro [07-acessibilidade-qa03](../entrega-3/testes/07-acessibilidade-qa03.md),
  ampliado com as telas novas.
- **AC:** AC-QA-03-01 o checklist fica sem bloqueio. `MAN`

#### QA-04 — Homologação em aparelhos

- **Onda:** E4-12 · **Classe:** B · **Dep.:** QA-07, QA-03.
- **Escopo:** Android físico e iOS (EAS, conta Apple), com o roteiro
  [09-aparelhos-qa04](../entrega-3/testes/09-aparelhos-qa04.md).
- **AC:** AC-QA-04-01 a matriz tela × plataforma × aparelho fica registrada. `MAN`

## 5. Grafo de dependências

```
G-54 ─┬─ (todo o planejamento)
      │
backend leva 1 → API-04 → API-05 ─┬─ AUT-01, REC-03
                                  └─ EVO-01 → EVO-02 → EVO-05
backend leva 2 → API-05 → AVA-01 → AVA-02 → AVA-03 → AVA-04, AVA-05
                          AVA-01 → PAC-05
backend leva 3 → EVO-04 (← EVO-01); PAC-09 (← PAC-05); insight da AVA-03
backend leva 4 → API-05 → REL-01 → REL-02 → REL-03
backend leva 5 → API-05 → NOT-01
EVO-02, AVA-01, REL-03 → NAV-04 → QA-07 (rodada) → QA-02, QA-03 → QA-04
FEC-05 e API-04 (planos): sem dependência
```

## 6. Histórico

- 2026-11-12: criação pelo orquestrador, depois da apresentação da Entrega 3, com 25 tarefas e
  as propostas G-54 a G-60.
