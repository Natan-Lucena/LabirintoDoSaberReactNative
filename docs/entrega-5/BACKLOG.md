# Entrega 5 — Backlog

> Tarefas refinadas da Entrega 5. Leia antes: [AGENTS.md](../../AGENTS.md),
> [PROJECT.md](../PROJECT.md), o [Roadmap da Entrega 5](ROADMAP.md), a
> [Especificação para o backend](ESPECIFICACAO-BACKEND.md) e o
> [CONTEXTO-SESSAO](../CONTEXTO-SESSAO.md). O estado de cada tarefa fica no
> [TRACKING](TRACKING.md). **As decisões G-61 a G-72 são propostas**: nenhuma ficha que dependa
> delas é disparada antes da confirmação do usuário.
>
> **Fonte do design:** o Figma Make das Entregas 2 a 4
> ([`L7sCNfMhrzOzhtlNpS3cHr`](https://www.figma.com/make/L7sCNfMhrzOzhtlNpS3cHr/Receive-.fig-files)):
> `ActivitiesScreen` (banco, jogo e "Forme a palavra"), `TeamScreen` (equipe e `onboarding`),
> `PatientsScreen`, `AgendaScreen`, `MoreScreen` e o sino do `AppHeader`. As descrições dos
> elementos vêm das fichas da [Entrega 2](../entrega-2/BACKLOG.md). O conector Figma não estava
> disponível no planejamento: o worker confere o código do Make antes de montar a tela. Telas
> sem desenho usam o design system de `src/components/ds` (G-18, G-38).
>
> **Contrato:** as fichas citam as rotas **propostas** na especificação do backend. Antes da
> implementação de cada leva, a API-06 registra o contrato real no `PROJECT.md` e as fichas são
> ajustadas, como na Entrega 4.

## 1. Convenções

As da [Entrega 4](../entrega-4/BACKLOG.md#1-convenções), com duas mudanças:

- **IDs:** os do mapa da Entrega 2 continuam (ATV-04a, ATV-05, EVO-03, EQP-01, EQP-02, AJD-01,
  QA-02 a QA-04); os novos são API-06, API-07, FEC-06, ATV-09, ATV-11, EQP-03, EQP-04, PAC-10,
  PAC-11, AGE-05, AGE-06, BLD-01, NOT-02, NAV-05 e QA-08. A ATV-04b junta as subtarefas "b"
  (Associe as cores) e "d" (Memória visual) do mapa. Critérios: `AC-<tarefa>-NN`.
- **Testes só do essencial** (pedido do usuário na Entrega 4): cada ficha lista poucos AC
  automatizados (`UT`/`CT`), só para regra de negócio, erro do servidor e navegação. O worker
  roda `typecheck` e `lint`; o CI roda a suíte inteira. O resto é `MAN` na QA-08 ou `REV`.
- **Verificação:** `UT`, `CT`, `E2E`, `CMD`, `MAN` e `REV`.
- **Uma tarefa = um PR**, a partir de `origin/main`. Testes em `__tests__/` ao lado do código,
  **nunca dentro de `app/`**.
- **API:** só rotas do contrato registrado (API-06). O que o design pede e a API não tem é
  omitido, sem campo inventado e sem guardar o dado só no aparelho.
- **Mocks:** todo endpoint novo ganha handler fiel em `src/mocks/handlers/`, teste de
  integração pelo `apiClient` real e seção no `src/mocks/README.md`.
- **Dependências:** só as autorizadas pelos gates: `expo-dev-client` e `expo-notifications`
  (G-67, BLD-01 e NOT-02) e `expo-video` (G-69, AJD-01). Nenhuma outra.
- **Dados:** sempre fictícios ("Paciente Teste…"); nada de conteúdo clínico em log, toast de erro
  ou mensagem de commit; nada de nome de paciente em push.
- **Classes de execução:** A (Opus: contrato e diagnóstico difícil), B (Codex, Terra ou Sonnet:
  tela ou módulo com contrato claro), C (Haiku: mecânico).
- **Verificação padrão** (código de saída 0):

  ```bash
  pnpm run typecheck
  pnpm run lint
  npx prettier --check <arquivos alterados>
  python scripts/check-docs.py
  ```

## 2. Histórias

As da [Entrega 2](../entrega-2/BACKLOG.md#3-histórias) continuam valendo. A Entrega 5 acrescenta:

| ID     | Como… quero… para…                                                                                              | Tarefas        |
| ------ | --------------------------------------------------------------------------------------------------------------- | -------------- |
| US5-01 | Como profissional, quero ver quais pacientes têm pendências e arquivar os que saíram, para focar em quem atendo | PAC-10, PAC-11 |
| US5-02 | Como profissional, quero agendar uma série de atendimentos de uma vez e ver o mês, para organizar a agenda      | AGE-05, AGE-06 |
| US5-03 | Como profissional convidada, quero criar minha conta com o código da clínica, para entrar na equipe sem ajuda   | EQP-03         |
| US5-04 | Como profissional, quero dividir o acompanhamento de um paciente com uma colega, para trabalharmos juntas       | EQP-04         |

| História | Tarefas na Entrega 5                     |
| -------- | ---------------------------------------- |
| US2-06   | EVO-03                                   |
| US2-10   | ATV-09, ATV-04a, ATV-04b, ATV-11, ATV-05 |
| US2-12   | EQP-01, EQP-02, EQP-03, EQP-04           |
| US2-13   | AJD-01                                   |
| US2-14   | BLD-01, NOT-02                           |
| US2-15   | NAV-05                                   |

## 3. Propriedade de arquivos compartilhados

Cada onda tem um único dono por arquivo; as tarefas seguintes partem da `main` já atualizada.

| Arquivo                                                              | Tarefas, na ordem                                  | O que cada uma muda                                                              |
| -------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/api/types.ts` e `src/api/errors.ts`                             | API-07 (uma vez por leva)                          | tipos e códigos de erro; nenhuma tarefa de tela altera                           |
| `src/api/endpoints/<domínio>.ts` e `src/mocks/handlers/<domínio>.ts` | API-07 cria a leitura; a tela acrescenta a escrita | `task-catalog`, `clinic`, `student-status`, `appointment-series`, `push`, `help` |
| `src/features/activities/engine/registry.ts`                         | ATV-04a → ATV-04b                                  | um tipo novo por tarefa                                                          |
| `src/features/activities/ActivitiesScreen.tsx`                       | ATV-09 → ATV-05                                    | filtros e recomendação; "Imprimir" no imprimível                                 |
| `src/features/sessions/player/**`                                    | EVO-03                                             | envio do resultado do jogo                                                       |
| `src/features/evolution/register/**`                                 | EVO-03                                             | seção "Atividades da sessão"                                                     |
| `app/(auth)/login.tsx` e `src/features/auth/LoginForm.tsx`           | EQP-03                                             | "Tenho um convite"                                                               |
| `src/features/profile/ProfileScreen.tsx`                             | EQP-02 → NOT-02                                    | papel no perfil e "Entrar numa equipe"; "Notificações"                           |
| `src/features/patients/detail/PatientDetailScreen.tsx`               | EQP-04 → PAC-10 → PAC-11                           | "Quem acompanha"; bloco de pendências; "Arquivar"                                |
| `src/features/patients/list/**`                                      | EQP-04 → PAC-10 → PAC-11                           | selo "Compartilhado"; status e "Pendências"; filtro "Arquivados"                 |
| `src/features/agenda/AgendaScreen.tsx`                               | AGE-05 → AGE-06                                    | visão mensal; selo da série                                                      |
| `src/features/agenda/form/**` e `src/features/agenda/detail/**`      | AGE-06 → PAC-11                                    | repetição e "este e os seguintes"; aviso de paciente arquivado                   |
| `src/features/resources/ResourcesScreen.tsx`                         | EQP-01 → AJD-01 → NAV-05                           | destino de Equipe; destino de Ajuda; remoção do "Em breve"                       |
| `app.json`, `package.json`, `pnpm-lock.yaml` e `eas.json` (novo)     | BLD-01 → NOT-02 → AJD-01                           | dev client e perfil EAS; `expo-notifications`; `expo-video`                      |
| `src/mocks/install.ts` e `src/mocks/README.md`                       | todas com handler novo                             | só acrescentar linhas e seções                                                   |

## 4. Tarefas

### 4.1 Bloco A — Base e pendências

#### API-06 — Contrato da Entrega 5 no PROJECT.md

**Refino:** [cards/API-06.md](cards/API-06.md)

- **Onda:** uma vez por leva do backend · **Classe:** A (orquestrador)
- **Dep.:** cada leva publicada pelo backend.
- **Escopo:**
  1. A cada leva: conferir o Swagger, registrar as rotas novas no `PROJECT.md` (Parte II, bloco
     "Entrega 5") e anotar as diferenças em relação à especificação num `BACKEND-ENTREGUE.md`
     desta pasta.
  2. Ajustar as fichas afetadas e registrar no [TRACKING](TRACKING.md).
- **Arquivos:** `docs/PROJECT.md`, `docs/entrega-5/BACKEND-ENTREGUE.md` (novo), as fichas deste
  backlog.
- **AC:**
  - AC-API-06-01 toda rota que uma ficha usa está no `PROJECT.md`, com corpo, resposta e erros. `REV`
  - AC-API-06-02 cada diferença entre a especificação e o entregue está registrada e refletida nas fichas. `REV`

#### API-07 — Tipos, endpoints de leitura e mocks do contrato novo

**Refino:** [cards/API-07.md](cards/API-07.md)

- **Onda:** E5-1, E5-5, E5-7 e E5-9 (uma parte por leva) · **Classe:** B
- **Dep.:** API-06 da leva. Pode começar pela especificação, com os mocks, e ser ajustada quando
  o contrato real sair.
- **Escopo, por leva:**
  1. Tipos em `src/api/types.ts`: atividades e resultado (leva 1); clínica, convite e
     compartilhamento (leva 2); status, overview e série (leva 3); push, preferências e ajuda
     (leva 4).
  2. Funções de **leitura** em `src/api/endpoints/<domínio>.ts` e chaves de query.
  3. Handlers de mock fiéis, com dados fictícios, incluindo os erros de cada rota; a
     biblioteca mock tem ao menos uma atividade de cada tipo novo.
  4. Teste de integração pelo `apiClient` real para cada rota nova (sucesso e erro principal).
  5. Códigos de erro novos em `normalizeApiError` com mensagem em português.
- **Fora do escopo:** telas e escritas usadas só por uma tela.
- **Arquivos:** `src/api/types.ts`, `src/api/errors.ts`,
  `src/api/endpoints/{task-catalog,clinic,student-status,appointment-series,push,help}.ts`,
  `src/mocks/handlers/*`, `src/mocks/install.ts`, `src/mocks/README.md` e os testes.
- **AC:**
  - AC-API-07-01 tipos e mocks seguem o contrato registrado, campo a campo. `REV`
  - AC-API-07-02 cada rota tem teste pelo `apiClient` real com sucesso e com o erro principal. `UT`
  - AC-API-07-03 os códigos de erro novos têm mensagem em português. `UT`

#### FEC-06 — Pendências das Entregas 3 e 4

**Refino:** [cards/FEC-06.md](cards/FEC-06.md)

- **Onda:** E5-8 · **Classe:** B · **Dep.:** backend PP-05 (leva 3).
- **Endpoints:** `PUT /student/update/:id`, `PUT /plan/:id`, `PUT /task/update`, com `null`
  para apagar (proposto na especificação §9).
- **Escopo:**
  1. **Apagar o responsável** no editar paciente: "Remover responsável" envia os três campos
     com `null`.
  2. **Limpar a próxima revisão e as notas** do plano no detalhe do plano.
  3. **Remover a imagem ou o áudio** de uma atividade salva no editar atividade (ATV-06);
     tirar a única mídia de uma atividade com mídia muda o tipo para texto, conforme a regra
     da API.
  4. Os defeitos da issue #168 ainda abertos no início da onda, se houver, listados no PR.
- **Fora do escopo:** RP-02 e a repetição das notificações (só backend, G-71 e G-72).
- **Arquivos:** `src/features/patients/form/**`, `src/features/plans/detail/**`,
  `src/features/content-create/task/**`, `src/api/endpoints/{student-update,plans,task-update}.ts`.
- **AC:**
  - AC-FEC-06-01 "Remover responsável" envia `null` nos três campos e a ficha fica sem responsável. `CT`
  - AC-FEC-06-02 limpar a próxima revisão envia `nextReviewAt: null`. `CT`
  - AC-FEC-06-03 remover a mídia mostra a atividade sem imagem e sem áudio no detalhe. `MAN`

### 4.2 Bloco B — Banco de atividades

#### ATV-09 — Banco com formato, habilidade e recomendação

**Refino:** [cards/ATV-09.md](cards/ATV-09.md)

- **Onda:** E5-2 · **Classe:** B · **Dep.:** API-07 (atividades); backend §2 (leva 1); G-64.
- **Figma:** `ActivitiesScreen` (`activity=false`): `.search-field` "Buscar por habilidade ou
  tema", `.filter-row` Todas / Interativas / Imprimíveis, `.activity-feature` "Recomendado
  para {paciente}" com "Iniciar atividade", "Atividades prontas" com "Ver todas" e
  `.activity-grid` com `.activity-thumb--mint`, `--peach`, `--lavender` e `--yellow`.
- **Endpoints:** `GET /task/catalog`, `GET /task/skills`, `GET /task/recommended`,
  `POST /task/:id/duplicate`.
- **Escopo:**
  1. Filtros Todas / Interativas / Imprimíveis e por habilidade, busca no servidor, lista
     paginada por cursor ("Ver todas").
  2. "Atividades prontas" (biblioteca) separadas das do educador; a miniatura usa o `tone`.
  3. "Recomendado para {paciente}" quando há paciente de contexto (vindo da ficha ou do
     próximo atendimento), com o motivo; "Iniciar atividade" abre o jogo.
  4. Atividade da biblioteca mostra "Duplicar para editar" no lugar de "Editar".
  5. Cadernos e grupos continuam acessíveis pelo filtro atual.
- **Fora do escopo:** os jogos novos (ATV-04a, ATV-04b) e o imprimível (ATV-05); o tipo
  desconhecido continua "indisponível".
- **Arquivos:** `src/features/activities/**` (menos `engine/`), `app/(tabs)/activities.tsx`,
  `src/features/content-detail/task/**` (só "Duplicar para editar").
- **AC:**
  - AC-ATV-09-01 os filtros e a busca vão como query para `GET /task/catalog`. `CT`
  - AC-ATV-09-02 a recomendada só aparece com paciente de contexto e mostra o motivo do servidor. `CT`
  - AC-ATV-09-03 atividade da biblioteca não mostra "Editar"; "Duplicar para editar" abre a cópia. `CT`

#### ATV-04a — Forme a palavra

**Refino:** [cards/ATV-04a.md](cards/ATV-04a.md)

- **Onda:** E5-2 · **Classe:** B · **Dep.:** API-07 (atividades); G-64.
- **Figma:** `.game-shell`, `.game-progress` "Atividade N de M", `.game-illustration`,
  `.word-slots` / `--success`, `.letter-pool`, `.success-message` e "Tentar novamente"
  ([ficha da Entrega 2](../entrega-2/BACKLOG.md#atv-04--tipos-de-atividade)).
- **Endpoint:** `GET /task/:id` (`content` do tipo `wordBuilder`).
- **Escopo:**
  1. Componente `WordBuilderActivity` registrado no motor para `wordBuilder`.
  2. Banco de letras com a palavra embaralhada e os `distractors`; tocar numa letra preenche o
     próximo espaço; tocar num espaço desfaz a partir dele.
  3. Dica com imagem e áudio (o `AudioPlayer` existente).
  4. Palavra completa e certa: `--success` e "Muito bem!"; errada: "Tentar novamente", contando
     erros e tentativas para o resultado (EVO-03).
- **Arquivos:** `src/features/activities/engine/word-builder/**` (novo),
  `src/features/activities/engine/registry.ts`.
- **AC:**
  - AC-ATV-04a-01 a palavra é aceita só com as letras na ordem certa; acentos contam. `UT`
  - AC-ATV-04a-02 tocar num espaço preenchido devolve ao banco a letra dele e as seguintes. `CT`
  - AC-ATV-04a-03 letras e espaços têm alvo ≥ 44 e rótulo acessível ("Letra A", "Espaço 2 de 4, vazio"). `CT`

#### ATV-04b — Associe as cores e Memória visual

**Refino:** [cards/ATV-04b.md](cards/ATV-04b.md)

- **Onda:** E5-3 · **Classe:** B · **Dep.:** ATV-04a (registro e casca do jogo); G-64.
- **Figma:** miniaturas "Associe as cores" e "Memória visual" do `.activity-grid`; a casca
  `.game-shell` da ATV-04a. Sem desenho próprio do tabuleiro (G-18).
- **Endpoint:** `GET /task/:id` (`colorMatch` e `memoryGame`).
- **Escopo:**
  1. `ColorMatchActivity`: tocar numa palavra e depois na cor; par certo fica marcado, errado
     conta erro. A cor nunca é a única pista: cada amostra tem o nome da cor no rótulo acessível.
  2. `MemoryGameActivity`: cartas viradas em grade; virar duas; par igual fica aberto; conta
     jogadas e erros.
  3. Os dois terminam com a mesma tela de sucesso e o resultado para a EVO-03.
- **Arquivos:** `src/features/activities/engine/{color-match,memory-game}/**` (novos),
  `src/features/activities/engine/registry.ts`.
- **AC:**
  - AC-ATV-04b-01 o par só é aceito quando a palavra e a cor são do mesmo `id`. `UT`
  - AC-ATV-04b-02 a memória termina quando todos os pares estão abertos e conta as jogadas. `UT`
  - AC-ATV-04b-03 os dois jogos são jogáveis do início ao fim no Expo Go (Android). `MAN`

#### ATV-11 — Criar e editar atividades dos tipos novos

**Refino:** [cards/ATV-11.md](cards/ATV-11.md)

- **Onda:** E5-3 · **Classe:** B · **Dep.:** ATV-09; backend §2 (leva 1).
- **Figma:** sem tela; mesmo padrão do formulário da ATV-06 (`.field`, `.segmented`,
  `.check-list`, `full-button`).
- **Endpoints:** `POST /task/create`, `PUT /task/update`, `GET /task/skills`,
  `POST /task/upload-media`.
- **Escopo:**
  1. No "Criar" do banco, escolher o tipo: Múltipla escolha (atual), Forme a palavra, Associe
     as cores, Memória visual ou Imprimível.
  2. Formulário por tipo, com os limites do contrato (palavra 2–12 letras; 2–6 pares; 2–8
     cartas; 1–20 itens do imprimível), habilidades, tema e cor da miniatura.
  3. Imagens e áudio pelo `MediaPicker` existente (ATV-08), enviados antes de salvar.
  4. Editar abre o mesmo formulário preenchido; o tipo não muda.
  5. `INVALID_CONTENT` marca o campo de `errors[].field`.
- **Fora do escopo:** IA para os tipos novos; atividades da biblioteca (só duplicando).
- **Arquivos:** `src/features/content-create/activity-types/**` (novo),
  `app/content/new-activity.tsx` (novo), `src/features/activities/components/CreateContentSheet.tsx`,
  `src/api/endpoints/task-create.ts`, `src/api/endpoints/task-update.ts`.
- **AC:**
  - AC-ATV-11-01 o corpo enviado tem `content.kind` igual ao tipo e respeita os limites antes do envio. `UT`
  - AC-ATV-11-02 `INVALID_CONTENT` com `field` marca o campo certo. `CT`

#### ATV-05 — Imprimíveis

**Refino:** [cards/ATV-05.md](cards/ATV-05.md)

- **Onda:** E5-4 · **Classe:** B · **Dep.:** ATV-09; G-66; G-34 e G-45 (PDF no Expo Go).
- **Figma:** miniatura "Complete a sequência · Imprimível" (`print`).
- **Endpoint:** `GET /task/:id` (`content` do tipo `printable`).
- **Escopo:**
  1. O detalhe do imprimível mostra a prévia e "Imprimir" e "Compartilhar".
  2. HTML gerado a partir do `content` (título, instruções, itens no `layout`, linhas de
     resposta) e PDF com `expo-print`, pelo mesmo caminho dos relatórios
     (`src/features/reports/sharePdf.ts`).
  3. Campo opcional "Nome da criança" preenchido no aparelho, só no PDF, sem envio ao servidor.
  4. O arquivo temporário é apagado depois de compartilhar.
- **Arquivos:** `src/features/activities/printable/**` (novo), `app/activities/print/[id].tsx`
  (novo), `src/features/activities/ActivitiesScreen.tsx` (destino do imprimível).
- **AC:**
  - AC-ATV-05-01 o HTML tem o título, as instruções e todos os itens, no layout do conteúdo. `UT`
  - AC-ATV-05-02 o PDF imprime e é compartilhado no Expo Go (Android). `MAN`

#### EVO-03 — Atividade durante a sessão

**Refino:** [cards/EVO-03.md](cards/EVO-03.md)

- **Onda:** E5-4 · **Classe:** B, com revisão A do fluxo de sessão · **Dep.:** ATV-04a,
  ATV-04b; backend §3 (leva 1); G-65.
- **Endpoints:** `POST /task-notebook-session/activity-result`,
  `GET /session-evolution/context/:sessionId` (`activityResults`).
- **Escopo:**
  1. No player da sessão, os jogos novos rodam pelo motor; ao terminar cada um, o app envia o
     resultado **uma vez** (G-08). `RESULT_ALREADY_EXISTS` é tratado como já registrado.
  2. A retomada da sessão não reenvia resultados já registrados.
  3. Na Evolução, a seção "Atividades da sessão" lista os jogos (título, concluído, tentativas
     e erros), só para leitura; o profissional usa no registro descritivo.
  4. O relatório da sessão mostra o `activitySummary`.
- **Fora do escopo:** transformar o resultado em critério automático (G-65); jogar fora da
  sessão com registro (sem paciente não há registro, G-35).
- **Arquivos:** `src/features/sessions/player/**`, `src/stores/session-flow.ts` (só o registro
  dos resultados enviados), `src/features/evolution/register/**` (só a seção),
  `src/features/reports/session/**` (só o resumo).
- **AC:**
  - AC-EVO-03-01 o resultado é enviado uma vez por atividade; falha mostra "Tentar novamente" sem reenvio automático. `CT`
  - AC-EVO-03-02 a Evolução mostra os resultados do contexto do servidor. `CT`
  - AC-EVO-03-03 o fluxo sessão → jogo → evolução funciona no emulador contra o backend real. `MAN`

### 4.3 Bloco C — Equipe

#### EQP-01 — Equipe e convites

- **Onda:** E5-5 · **Classe:** B · **Dep.:** API-07 (equipe); backend §4 (leva 2); G-62, G-63.
- **Figma:** `TeamScreen`: "Equipe e convites" com eyebrow "Gestão da clínica",
  `.invite-card` "Convide um profissional" com "Compartilhar link de convite", "Profissionais
  ativos" com a contagem e `.team-list` (avatar, nome, papel e `badge` "Ativo").
- **Endpoints:** `GET /clinic/`, `POST /clinic/`, `POST /clinic/invites`.
- **Escopo:**
  1. Sem equipe: estado vazio com "Criar equipe" (nome da clínica).
  2. Com equipe: cartão de convite (escolher o papel), que cria o convite e abre o `Share` com
     a `shareMessage` do servidor. O botão diz "Compartilhar convite" (não há link, G-63).
  3. Lista dos profissionais com papel e profissão; contagem.
  4. Em Recursos, "Equipe e convites" leva a esta tela.
- **Fora do escopo:** gestão (EQP-02), cadastro pelo convite (EQP-03).
- **Arquivos:** `app/team.tsx`, `src/features/team/**` (novos), `src/features/resources/ResourcesScreen.tsx`
  (só o destino), `src/api/endpoints/clinic.ts` (escritas).
- **AC:**
  - AC-EQP-01-01 o convite abre o `Share` com a mensagem do servidor, sem montar texto no app. `CT`
  - AC-EQP-01-02 lista e papéis vêm de `GET /clinic/`; sem equipe, aparece "Criar equipe". `CT`

#### EQP-02 — Permissões por papel

- **Onda:** E5-6 · **Classe:** B, com revisão A · **Dep.:** EQP-01.
- **Endpoints:** `PUT /clinic/`, `GET /clinic/invites`, `DELETE /clinic/invites/:id`,
  `PUT /clinic/members/:educatorId`, `DELETE /clinic/members/:educatorId`.
- **Escopo:**
  1. Um único `usePermissions` lê o papel de `GET /educator/me` (`clinic.role`).
  2. `ADMIN`: renomear, convites ativos com "Revogar", mudar papel e remover membro, com
     confirmação. `PROFESSIONAL`: só vê a lista e "Sair da equipe".
  3. `LAST_ADMIN` e `FORBIDDEN_ROLE` com mensagem.
  4. Banner de Recursos e perfil: "{profissão} · {papel}" ("Psicopedagoga · Administradora").
- **Arquivos:** `src/features/team/**`, `src/features/permissions/**` (novo),
  `src/features/profile/ProfileScreen.tsx` (só o papel), `src/features/resources/ResourcesScreen.tsx`
  (só o banner).
- **AC:**
  - AC-EQP-02-01 o papel `PROFESSIONAL` não vê convite nem gestão. `CT`
  - AC-EQP-02-02 a regra fica num único `usePermissions`. `UT`
  - AC-EQP-02-03 `LAST_ADMIN` mostra a mensagem e não muda a lista. `CT`

#### EQP-03 — Criar conta e entrar pelo convite

- **Onda:** E5-5 · **Classe:** B · **Dep.:** API-07 (equipe); backend §4.5 (leva 2); G-63.
- **Endpoints:** `GET /clinic/invites/preview/:code` (público), `POST /educator/register`
  (com `inviteCode`), `POST /educator/sign-in`, `POST /clinic/invites/accept`.
- **Escopo:**
  1. No login, "Tenho um convite": digitar o código (8 caracteres, maiúsculas, sem 0/O/1/I);
     a prévia mostra a clínica e o papel.
  2. Sem conta: formulário de cadastro (nome, e-mail, senha e confirmação, regras do
     `register`), que envia o `inviteCode`; depois entra com `sign-in` e abre a Início.
  3. Com conta: "Já tenho conta" volta ao login; no perfil, "Entrar numa equipe" pede o código
     e chama `accept`.
  4. `INVITE_INVALID`, `ALREADY_IN_CLINIC`, `EDUCATOR_ALREADY_EXISTS` e `TOO_MANY_REQUESTS` com
     mensagem; nenhuma senha em log.
- **Fora do escopo:** cadastro sem convite (continua fora do app).
- **Arquivos:** `app/(auth)/invite.tsx`, `app/(auth)/register.tsx`, `src/features/auth/invite/**`
  (novos), `app/(auth)/login.tsx`, `src/features/auth/LoginForm.tsx` (só o atalho),
  `src/features/profile/join-team/**` (novo), `src/api/endpoints/educator.ts` (cadastro).
- **AC:**
  - AC-EQP-03-01 o cadastro só é enviado depois de uma prévia válida, com o `inviteCode`. `CT`
  - AC-EQP-03-02 cada código de erro mostra a mensagem certa. `CT`
  - AC-EQP-03-03 senha e código não vão para log nem para o cache. `REV`

#### EQP-04 — Paciente compartilhado

- **Onda:** E5-6 · **Classe:** B · **Dep.:** EQP-01; backend §4.6 (leva 2); G-62. Dona da ficha
  e da lista de pacientes nesta onda.
- **Endpoints:** `GET /student/:id/shares`, `POST /student/:id/shares`,
  `DELETE /student/:id/shares/:educatorId`, `GET /student/` (`access`, `ownerName`).
- **Escopo:**
  1. Na ficha, "Quem acompanha": o dono e os colegas; o dono escolhe um membro da equipe para
     compartilhar e pode desfazer, com confirmação.
  2. Paciente compartilhado mostra o selo "Compartilhado por {dono}" na lista e na ficha, sem
     "Editar cadastro", "Compartilhar" e "Arquivar".
  3. Evoluções, planos e relatórios mostram "por {autor}" quando vier `authorName`.
  4. Um 403 depois de o acesso ser desfeito leva à lista com "Você não acompanha mais este
     paciente".
- **Arquivos:** `src/features/patients/detail/**`, `src/features/patients/list/**` (só o selo),
  `src/features/patients/shares/**` (novo), e os componentes de evolução, plano e relatório que
  exibem o autor (só a linha "por {autor}").
- **AC:**
  - AC-EQP-04-01 só o dono vê "Compartilhar" e "Desfazer". `CT`
  - AC-EQP-04-02 o paciente compartilhado aparece com o selo e sem as ações do dono. `CT`
  - AC-EQP-04-03 com dois educadores fictícios, o colega registra uma evolução e o dono a vê com "por {autor}". `MAN`

### 4.4 Bloco D — Pacientes e agenda

#### PAC-10 — Status e pendências dos pacientes

- **Onda:** E5-7 · **Classe:** B · **Dep.:** API-07 (pacientes); backend §5 (leva 3); G-70.
- **Figma:** `PatientsScreen`: eyebrow "N pacientes ativos", `.filter-row` Todos / Com sessão
  hoje / **Pendências**, `.patient-card` com "idade · status".
- **Endpoints:** `GET /student/overview`, `GET /student/`.
- **Escopo:**
  1. Cada cartão mostra "idade · {status}" com o `primaryStatus` do servidor ("PDI ativo",
     "Avaliação pendente", "Em revisão", "Sem plano").
  2. O filtro "Pendências" (sem "Em breve") mostra só os pacientes com `pendings`.
  3. Na ficha, bloco "Pendências" com atalho para cada uma: evolução pendente → EVO-01;
     revisão → detalhe do plano; rascunho → aplicação da escala; sem anamnese → anamnese.
  4. A contagem "N pacientes ativos" usa só os `ACTIVE`.
- **Arquivos:** `src/features/patients/list/**`, `src/features/patients/detail/**` (só o bloco).
- **AC:**
  - AC-PAC-10-01 o rótulo do status vem do `primaryStatus`; o app não calcula. `CT`
  - AC-PAC-10-02 "Pendências" filtra pelos `pendings` do servidor. `UT`
  - AC-PAC-10-03 cada pendência abre a tela certa com o paciente. `CT`

#### PAC-11 — Arquivar e reativar paciente

- **Onda:** E5-8 · **Classe:** B · **Dep.:** PAC-10; backend §5 (leva 3); G-70.
- **Endpoints:** `PUT /student/:id/status`, `GET /student/?status=ARCHIVED`.
- **Escopo:**
  1. Na ficha (dono), "Arquivar paciente" com confirmação; com `HAS_FUTURE_APPOINTMENTS`, a
     confirmação mostra "N atendimentos futuros serão cancelados" e reenvia com
     `cancelFutureAppointments: true` só depois do toque do usuário.
  2. Filtro "Arquivados" na lista, com "Reativar".
  3. Ações de criar (atendimento, sessão, plano, escala) somem para o arquivado;
     `STUDENT_ARCHIVED` vindo de outro caminho mostra mensagem.
- **Arquivos:** `src/features/patients/detail/**`, `src/features/patients/list/**`,
  `src/features/agenda/form/**` (só a mensagem).
- **AC:**
  - AC-PAC-11-01 arquivar com atendimentos futuros só cancela depois da segunda confirmação. `CT`
  - AC-PAC-11-02 o arquivado sai da lista e da contagem e volta ao reativar. `CT`

#### AGE-05 — Visão mensal da agenda

- **Onda:** E5-0 · **Classe:** B · **Dep.:** — (não depende do backend).
- **Protótipo:** tela 07 do protótipo ([`07-agenda.html`](../design/telas/07-agenda.html)):
  "Mini calendário mensal com ‹ ›, grade de 7 colunas, ponto nos dias com agendamento, dia
  selecionado destacado" ([DESIGN §2](../entrega-1/DESIGN.md#07--agenda-de-atendimentos-agenda)).
- **Endpoint:** `GET /appointment/?from&to` (já existe).
- **Escopo:**
  1. Alternar "Semana" / "Mês" no topo da Agenda (`.segmented`).
  2. O mês reaproveita o `MiniCalendar`, pede só o intervalo visível e marca os dias com
     atendimento `PENDING` ou `COMPLETED`.
  3. Tocar num dia volta à lista daquele dia; ‹ › trocam o mês.
- **Arquivos:** `src/features/agenda/AgendaScreen.tsx`, `src/features/agenda/month/**` (novo),
  `src/features/appointments/components/MiniCalendar.tsx`.
- **AC:**
  - AC-AGE-05-01 o mês pede `from` e `to` do primeiro ao último dia visível (São Paulo). `UT`
  - AC-AGE-05-02 o ponto só aparece nos dias com atendimento não cancelado. `CT`

#### AGE-06 — Atendimentos recorrentes

- **Onda:** E5-7 · **Classe:** B · **Dep.:** AGE-05; API-07 (agenda); backend §6 (leva 3); G-68.
- **Endpoints:** `POST /appointment/series`, `GET /appointment/series/:id`,
  `PUT /appointment/series/:id`, `POST /appointment/series/:id/cancel`.
- **Escopo:**
  1. No novo atendimento, "Repetir": Não repete / Semanal / Quinzenal e o número de vezes
     (2–26), com a prévia "8 atendimentos, até 12/02".
  2. Depois de criar, o aviso lista as ocorrências puladas por conflito.
  3. No detalhe de uma ocorrência: "Semanal · 3 de 8"; editar pergunta "Só este" ou "Este e
     os seguintes"; cancelar idem.
- **Arquivos:** `src/features/agenda/form/**`, `src/features/agenda/detail/**`,
  `src/features/agenda/AgendaScreen.tsx` (só o selo), `src/api/endpoints/appointment-series.ts`
  (escritas).
- **AC:**
  - AC-AGE-06-01 a prévia mostra o número de ocorrências e a última data antes de enviar. `UT`
  - AC-AGE-06-02 as ocorrências puladas aparecem no aviso com data e hora. `CT`
  - AC-AGE-06-03 "Este e os seguintes" chama a rota da série; "Só este" chama `PUT /appointment/:id`. `CT`

### 4.5 Bloco E — Push, ajuda e navegação

#### BLD-01 — Development build Android

- **Onda:** E5-0 · **Classe:** A (configuração) com C (execução) · **Dep.:** G-67;
  **autorização do usuário no momento** (build nativo); conta Expo do usuário.
- **Escopo:**
  1. Instalar `expo-dev-client` e criar `eas.json` com o perfil `development` (Android, APK).
  2. Build na nuvem pelo EAS (não local), com as credenciais FCM do projeto para o push.
  3. Registrar no `docs/bootstrap/COMPATIBILIDADE.md` as versões, o comando e como instalar o
     APK no emulador e no aparelho; o Expo Go continua sendo o padrão do dia a dia.
  4. Conferir que o app abre no development build contra o backend real.
- **Fora do escopo:** build de produção, loja, iOS (precisa de conta Apple; fica na QA-04).
- **Arquivos:** `package.json`, `pnpm-lock.yaml`, `app.json`, `eas.json` (novo),
  `docs/bootstrap/COMPATIBILIDADE.md`, `README.md` (seção curta).
- **AC:**
  - AC-BLD-01-01 `npx expo-doctor` e o CI continuam verdes com o dev client instalado. `CMD`
  - AC-BLD-01-02 o APK do development build abre o app no emulador Android. `MAN`

#### NOT-02 — Push das notificações e preferências

- **Onda:** E5-9 · **Classe:** B · **Dep.:** BLD-01; API-07 (push); backend §7 (leva 4); G-67.
- **Endpoints:** `POST /notification/push-token`, `DELETE /notification/push-token`,
  `GET /notification/preferences`, `PUT /notification/preferences`.
- **Escopo:**
  1. Depois do login, pedir a permissão com uma explicação antes do pedido do sistema; com a
     permissão, registrar o token.
  2. Tocar no push abre a lista de notificações ou o destino (`target`) com as regras da NOT-01.
  3. No Expo Go, o app detecta que não há push e não pede permissão (a lista continua).
  4. Perfil → "Notificações": ligar o push e cada tipo.
  5. No logout, apagar o token antes de limpar a sessão.
- **Arquivos:** `src/features/notifications/push/**`, `src/features/notifications/preferences/**`,
  `app/profile/notifications.tsx` (novos), `src/features/profile/ProfileScreen.tsx` (só o item),
  `src/features/auth/**` (só o logout), `package.json`, `pnpm-lock.yaml`, `app.json`.
- **AC:**
  - AC-NOT-02-01 o token só é registrado depois da permissão concedida; negada, nada é enviado. `CT`
  - AC-NOT-02-02 o logout apaga o token antes de limpar a sessão. `UT`
  - AC-NOT-02-03 o push chega ao development build Android e abre o destino. `MAN`

#### AJD-01 — Central de ajuda

- **Onda:** E5-9 · **Classe:** B · **Dep.:** API-07 (ajuda); backend §8 (leva 4); G-69.
- **Figma:** `TeamScreen` (`onboarding`): "Central de ajuda" com eyebrow "Aprenda no seu ritmo",
  `.video-feature` "COMECE POR AQUI · N MIN" e "Tutoriais essenciais" (`.tutorial-list`, itens
  numerados com duração).
- **Endpoint:** `GET /help/tutorials`.
- **Escopo:**
  1. Destaque e lista vindos da API, na ordem do servidor.
  2. Tocar abre o vídeo com `expo-video` (tela cheia, legendas se houver); sem vídeo, os passos
     em texto.
  3. Em Recursos, "Central de ajuda" leva a esta tela.
- **Arquivos:** `app/help.tsx`, `app/help/[id].tsx`, `src/features/help/**` (novos),
  `src/features/resources/ResourcesScreen.tsx` (só o destino), `package.json`,
  `pnpm-lock.yaml`, `app.json` (plugin do `expo-video`, se pedir).
- **AC:**
  - AC-AJD-01-01 a lista vem da API e o tutorial sem vídeo mostra os passos. `CT`
  - AC-AJD-01-02 o vídeo toca em tela cheia no Expo Go (Android). `MAN`

#### NAV-05 — App sem "Em breve"

- **Onda:** E5-10 · **Classe:** C · **Dep.:** EQP-01, AJD-01, PAC-10.
- **Escopo:** conferir que nenhum destino do app leva mais a "Em breve" (Recursos, Início,
  Pacientes); remover a rota `app/shell/coming-soon.tsx`, a `ComingSoonScreen` e os testes
  dela se ficarem sem uso; atualizar os testes de Recursos.
- **Arquivos:** `src/features/resources/**`, `app/shell/**`, `src/features/shell/**`.
- **AC:**
  - AC-NAV-05-01 a busca por "Em breve" e `coming-soon` no código não acha nada. `REV`
  - AC-NAV-05-02 todos os itens de Recursos navegam para telas reais. `CT`

### 4.6 Bloco F — Qualidade

#### QA-08 — Plano de testes manuais da Entrega 5

- **Onda:** E5-0 (esqueleto) e E5-11 (rodada) · **Classe:** B (escrita) e C (execução)
- **Dep.:** rodada depois de todas as tarefas de código; emulador com autorização do usuário.
- **Escopo:** roteiro no formato do [PLANO-TESTES da Entrega 4](../entrega-4/PLANO-TESTES.md):
  um caso por AC `MAN`, um por fluxo entre telas (banco → jogo; sessão → jogo → evolução;
  imprimível → PDF; convite → cadastro → equipe; compartilhar → colega registra evolução;
  série → editar "este e os seguintes"; arquivar → reativar; push → destino) e as conferências
  do backend (BE-AT, BE-RS, BE-EQ, BE-PA, BE-RC, BE-PU). Usa **duas contas de teste** e só
  pacientes fictícios.
- **Arquivos:** `docs/entrega-5/PLANO-TESTES.md`, `docs/entrega-5/testes/**`.
- **AC:**
  - AC-QA-08-01 todos os casos P1 passam no Android (emulador, backend real). `MAN`

#### QA-02 — E2E com Maestro

- **Onda:** E5-11 · **Classe:** B · **Dep.:** QA-08; autorização para instalar o Maestro.
- **Escopo:** os fluxos do mapa (login → iniciar sessão → salvar evolução; novo paciente →
  gerar PDI; aplicar escala → concluir; gerar relatório → compartilhar; novo atendimento) e
  dois da Entrega 5 (jogar "Forme a palavra"; criar série semanal), em `.maestro/`.
- **AC:** AC-QA-02-01 os sete fluxos passam no AVD Android. `E2E`

#### QA-03 — Acessibilidade

- **Onda:** E5-11 · **Classe:** B · **Dep.:** NAV-05.
- **Escopo:** TalkBack, fonte grande, contraste e alvos de 44 nas telas das Entregas 3 a 5,
  pelo roteiro [07-acessibilidade-qa03](../entrega-3/testes/07-acessibilidade-qa03.md), com
  atenção aos jogos (letras, cores e cartas).
- **AC:** AC-QA-03-01 o checklist fica sem bloqueio. `MAN`

#### QA-04 — Homologação em aparelhos

- **Onda:** E5-12 · **Classe:** B · **Dep.:** QA-08, QA-03, BLD-01.
- **Escopo:** Android físico com o development build (push incluído) e iOS (EAS, conta Apple),
  pelo roteiro [09-aparelhos-qa04](../entrega-3/testes/09-aparelhos-qa04.md).
- **AC:** AC-QA-04-01 a matriz tela × plataforma × aparelho fica registrada. `MAN`

## 5. Grafo de dependências

```
G-61 ─┬─ (todo o planejamento)
      │
backend leva 1 → API-06 → API-07 ─┬─ ATV-09 ─┬─ ATV-11
                                  │          └─ ATV-05 (G-66)
                                  └─ ATV-04a → ATV-04b → EVO-03 (G-65)
backend leva 2 → API-07 ─┬─ EQP-01 → EQP-02
                         │         └─ EQP-04
                         └─ EQP-03
backend leva 3 → API-07 ─┬─ PAC-10 → PAC-11
                         ├─ AGE-06 (← AGE-05)
                         └─ FEC-06
BLD-01 (autorização) ─┐
backend leva 4 → API-07 ─┴─ NOT-02
                         └─ AJD-01
EQP-01, AJD-01, PAC-10 → NAV-05 → QA-08 (rodada) → QA-02, QA-03 → QA-04 (← BLD-01)
AGE-05, QA-08 (esqueleto) e BLD-01: sem dependência do backend
```

## 6. Histórico

- 2026-11-24: criação no planejamento da Entrega 5, com 25 tarefas e as propostas G-61 a G-72.
- 2026-11-24: refino detalhado dos blocos A e B em `cards/` e [plano de execução](PLANO.md); as
  correções em relação a estas fichas estão no [PLANO §11](PLANO.md#11-ajustes-do-refino) e valem
  sobre o texto acima.
