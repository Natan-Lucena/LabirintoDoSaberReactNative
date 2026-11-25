# ATV-09 — Banco com formato, habilidade e recomendação

> Refino da ficha
> [ATV-09 do BACKLOG](../BACKLOG.md#atv-09--banco-com-formato-habilidade-e-recomendação),
> escrito em 2026-11-24 a partir do código da `main` (`3588b78`). Plano da entrega em
> [PLANO](../PLANO.md). Rotas propostas na
> [especificação §2.4](../ESPECIFICACAO-BACKEND.md#24-rotas-sugeridas); a API-06 confirma.

| Campo           | Valor                                                                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onda            | E5-2                                                                                                                                                                                           |
| Classe / modelo | B — Codex (preferido) ou Sonnet; esforço médio-alto (tela grande, troca de paginação do cliente para o servidor)                                                                               |
| Estimativa      | G · 10 h de worker                                                                                                                                                                             |
| Dependências    | API-07 leva 1 (`task-catalog.ts`, tipos, mocks); G-61, G-64                                                                                                                                    |
| Backend         | Leva 1 (§2). **Mock-first, mas só vai para a `main` depois da leva 1 publicada** (chama rotas que hoje não existem)                                                                            |
| Dona nesta onda | `src/features/activities/**` (menos `engine/` e `printable/`), `app/(tabs)/activities.tsx`, `app/activities/catalog.tsx`, `src/features/content-detail/task/**`, o atalho na ficha do paciente |
| Libera          | ATV-05 (destino do imprimível e "Imprimir" no detalhe)                                                                                                                                         |

## 1. Objetivo e valor

História **US2-10**. Hoje o banco só filtra por Atividades/Grupos/Cadernos e categoria, com
paginação no cliente e só as atividades do próprio educador. O design propõe um **banco
pedagógico**: buscar por habilidade ou tema, separar interativas de imprimíveis, ver as
**atividades prontas** da plataforma e, quando há um paciente em foco, a **recomendação** com o
motivo ("Consciência fonológica · dificuldade mapeada"). O profissional encontra o que usar no
atendimento sem montar tudo do zero.

## 2. Referência de design

Figma Make `ActivitiesScreen` (`activity=false`), descrito na
[ficha ATV-01 da Entrega 2](../../entrega-2/BACKLOG.md#atv-01--banco-de-atividades):

- "Atividades" com eyebrow "Banco pedagógico" (o `AppHeader` atual já usa título e subtítulo);
- `.search-field` "Buscar por habilidade ou tema" (o `SearchField` atual);
- `.filter-row` Todas / Interativas / Imprimíveis (o `FilterRow` atual, com outras opções);
- `.activity-feature`: eyebrow "Recomendado para {paciente}", título, motivo, botão "Iniciar
  atividade" e a arte `.letter-art`;
- "Atividades prontas" com "Ver todas" (o `SectionTitle` atual);
- `.activity-grid` com miniaturas `--mint`, `--peach`, `--lavender`, `--yellow`.

O que muda em relação ao app: a miniatura deixa de vir da categoria (`CATEGORY_STYLE` do
`ActivityCard`) e passa a vir do `tone`; entram o destaque recomendado, a seção "Minhas
atividades" e o "Carregar mais" no lugar da paginação numerada. Lacuna do conector Figma: ver
[ATV-04a §2](ATV-04a.md#2-referência-de-design).

Tons → tokens existentes de `src/theme`: `mint` → `color.brand[100]`, `peach` → `color.peach`,
`lavender` → `color.lavender`, `yellow` → `color.yellow` (os mesmos fundos do `ActivityCard`).
Ícone da miniatura pelo tipo (`FigmaIcon`): imprimível `print`; jogos `play`; quiz `book`. Com
`thumbnailUrl`, a imagem ocupa a miniatura.

## 3. Fluxo do usuário

**Entradas**

| De onde                          | Como                                                                                                               | Paciente de contexto                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Aba Atividades, Início, Recursos | `/(tabs)/activities` ou `/activities` (como hoje)                                                                  | o do próximo atendimento de hoje, se houver |
| Ficha do paciente (novo atalho)  | botão "Atividades para {primeiro nome}" → `router.push({ pathname: "/(tabs)/activities", params: { studentId } })` | o `studentId` da rota                       |

**Tela principal** (`ActivitiesScreen`), de cima para baixo:

1. `SearchField` "Buscar por habilidade ou tema".
2. `FilterRow` de formato: **Todas · Interativas · Imprimíveis · Cadernos · Grupos**.
3. Linha com dois `SelectField` (em `FieldGrid`): "Habilidade" (opções de `GET /task/skills`,
   mais "Todas") e "Categoria" (as quatro de hoje, mais "Todas").
4. Com paciente de contexto: chip "Para: {primeiro nome}" com "✕" (limpa o contexto só nesta
   tela) e o **destaque recomendado** (§3.1).
5. Seção **"Atividades prontas"** (`source=LIBRARY`, até 4 cartões) com "Ver todas" →
   `/activities/catalog?source=LIBRARY` + os filtros atuais.
6. Seção **"Minhas atividades"** (`source=EDUCATOR`, 20 por página) com "Carregar mais" quando
   houver `nextCursor`.
7. Chip **Cadernos** ou **Grupos**: as seções 4–6 dão lugar à lista atual de cadernos ou grupos
   (`useActivitiesQuery`, `filterByKind`, `filterBySearch`, `Pagination`), sem mudança de
   comportamento.
8. Tocar num cartão → `taskDestination(summary)` (§7, passo 4): detalhe
   `/content/task/[id]` (a ATV-05 troca o destino do imprimível).
9. `Fab` "Criar" e `CreateContentSheet`: sem mudança (a ATV-11 muda a rota `new-task`).

**3.1 Recomendado para {paciente}**

- Primeira atividade de `GET /task/recommended?studentId=` em destaque: eyebrow "Recomendado para
  {primeiro nome}", título, `reason` do servidor e "Iniciar atividade" → `/activities/[id]`
  (interativa) ou `taskDestination` (imprimível).
- As outras (até 5) numa linha horizontal "Outras para {primeiro nome}" com `CatalogTaskCard`
  compactos.
- Lista vazia: texto "Ainda não há recomendação para {primeiro nome}." (sem botão).

**Ver todas** (`/activities/catalog`, tela nova `CatalogListScreen`): `AppHeader` "Atividades
prontas" (ou "Minhas atividades" com `source=EDUCATOR`), os mesmos filtros de formato e
habilidade já preenchidos pelos parâmetros, grade com "Carregar mais".

**Detalhe** (`TaskDetailScreen`, `/content/task/[id]`):

- Mostra os selos de categoria, tipo e formato e as habilidades (`Badge` por `skills[].label`;
  `Task.skills` traz códigos — o rótulo vem de `GET /task/skills`) e o tema.
- Seção "Alternativas" só nos tipos de múltipla escolha.
- "Jogar" quando `isActivityTypePlayable(type)` (já existe).
- **Atividade da biblioteca** (`source === "LIBRARY"`): sem "Editar Atividade" e sem "Excluir
  Atividade"; aparece **"Duplicar para editar"** → `POST /task/:id/duplicate` →
  `router.replace("/content/task/{novoId}")` e toast "Cópia criada. Agora você pode editá-la.".
- "Editar Atividade" só para os tipos de múltipla escolha até a ATV-11 entrar (o editor dos
  tipos novos é dela).

## 4. Estados

| Estado                       | Comportamento e texto                                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carregando (primeira vez)    | `ActivityIndicator` + "Carregando atividades" (como hoje); cada seção com o seu indicador depois disso                                                   |
| Erro do catálogo             | Na seção: "Não foi possível carregar as atividades." + "Tentar novamente" (botão do padrão atual)                                                        |
| Erro das habilidades         | O `SelectField` "Habilidade" fica desabilitado com "Habilidades indisponíveis"; o resto funciona                                                         |
| Erro da recomendação         | O destaque some, sem mensagem; `404 STUDENT_NOT_FOUND` ou `403` limpam o contexto                                                                        |
| Vazio (com filtro ou busca)  | "Nenhuma atividade encontrada" + "Ajuste a busca ou os filtros selecionados."                                                                            |
| Vazio (sem filtro, "Minhas") | "Você ainda não criou atividades." + "Toque em + para criar ou duplique uma atividade pronta."                                                           |
| `INVALID_CURSOR`             | Mensagem do `normalizeApiError` (API-07: "Não foi possível carregar mais itens. Atualize a lista.") e a lista recomeça do início                         |
| Offline                      | Cache persistido mostra o último resultado; "Carregar mais" e "Duplicar" usam `withOfflineGuard` ("Sem conexão")                                         |
| Duplicar — erro              | `403`: "Você não tem acesso a esta atividade."; `404 TASK_NOT_FOUND`: "Atividade não encontrada."; outros: "Não foi possível duplicar. Tente novamente." |
| Sucesso de duplicar          | Toast "Cópia criada. Agora você pode editá-la." no detalhe da cópia                                                                                      |

## 5. Contrato de dados

| Método e rota              | Função (arquivo)                                                      | Query key                                          | Observação                                                                                         |
| -------------------------- | --------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `GET /task/catalog`        | `listTaskCatalog(params)` (`task-catalog.ts`, API-07)                 | `["task", "catalog", params]` (`useInfiniteQuery`) | `search?`, `format?`, `type?`, `skill?`, `category?`, `source?`, `limit?`, `cursor?`; query na URL |
| `GET /task/skills`         | `listTaskSkills()` (API-07)                                           | `["task", "skills"]`, `staleTime` 24 h             | catálogo fixo                                                                                      |
| `GET /task/recommended`    | `listRecommendedTasks(studentId)` (API-07)                            | `["task", "recommended", studentId]`               | 0–6 itens, com `reason`                                                                            |
| `POST /task/:id/duplicate` | `duplicateTask(id)` (**esta tarefa** acrescenta em `task-catalog.ts`) | —                                                  | `201 Task` (`source: EDUCATOR`)                                                                    |
| `GET /task/:id`            | `getTaskById` (existente)                                             | `["task", id]`                                     | detalhe                                                                                            |

- As chaves ficam sob o prefixo `["task", …]` de propósito: as invalidações que já existem
  (`invalidateQueries({ queryKey: ["task"] })` no criar, editar e excluir) passam a atualizar o
  catálogo sem mudança.
- Depois de duplicar: `invalidateQueries({ queryKey: ["task"] })`.
- Parâmetros de busca vão **na URL** (o adaptador de mocks lê `searchParams`, não
  `config.params`; ver `withQuery` em `src/api/endpoints/evolution.ts`).
- Campos novos de `Task` são opcionais no TypeScript até a API-06 (API-07); use os auxiliares
  `taskFormat(task)` e `taskSource(task)` da API-07 (ausente = `INTERACTIVE`/`EDUCATOR`).
- Paciente de contexto sem parâmetro: o próximo atendimento `PENDING` de hoje que ainda não
  terminou, a partir da query `["appointment"]` (`listAppointments`) e do
  `selectTodayAppointments` de `src/features/home/selectors.ts`; o nome vem de `useStudents`
  (`src/features/students/useStudents.ts`).

## 6. Regras de negócio e casos de borda

1. **Busca no servidor**: `search` só vai quando tiver ≥ 2 caracteres depois do `trim`, com
   espera de 300 ms após a digitação; trocar a busca ou um filtro recomeça a lista.
2. **Formato**: "Interativas" → `format=INTERACTIVE`; "Imprimíveis" → `format=PRINTABLE`;
   "Todas" → sem `format`. Habilidade → `skill=<code>`; categoria → `category=`.
3. **Recomendação só com paciente de contexto** e sempre com o `reason` do servidor; o app não
   calcula recomendação.
4. **Biblioteca é só leitura**: nunca mostra "Editar" nem "Excluir"; se um `403
LIBRARY_TASK_READ_ONLY` vier mesmo assim, mostra a mensagem do `normalizeApiError`.
5. **Cadernos e grupos** continuam como hoje (lista e detalhe), pelos chips "Cadernos" e
   "Grupos".
6. **Tipo desconhecido** (versão antiga do app ou tipo futuro): aparece no catálogo, abre o
   detalhe sem "Jogar" (o registro já trata).
7. O chip "Para: {nome}" com "✕" limpa só o estado da tela (`router.setParams({ studentId:
undefined })`); voltar à aba não restaura o contexto da rota anterior.
8. Primeiro nome = primeira palavra de `Student.name` ("Paciente Teste A" → "Paciente").

## 7. Plano de implementação

1. `src/api/endpoints/task-catalog.ts`: acrescentar `duplicateTask(id): Promise<Task>`;
   `src/mocks/handlers/task-catalog.ts`: handler `POST /task/:id/duplicate` (cópia com novo id,
   `source: "EDUCATOR"`; `404` para id desconhecido) + teste pelo `apiClient` real.
2. `src/features/activities/useCatalog.ts` (novo): `useTaskCatalog(filters)`
   (`useInfiniteQuery`), `useTaskSkills()`, `useRecommendedTasks(studentId?)`,
   `useActivityContextStudent(studentIdParam?)` (rota → próximo atendimento de hoje → nenhum).
3. Componentes novos em `src/features/activities/components/`: `CatalogTaskCard.tsx` (tom,
   ícone, título, "{habilidade} · {Interativa|Imprimível}"), `RecommendedCard.tsx`
   (`.activity-feature`), `CatalogSection.tsx` (título, grade, vazio, erro, "Carregar mais").
4. `src/features/activities/navigation.ts` (novo): `taskDestination(item)` → hoje sempre o
   detalhe; `playDestination(id)` → `/activities/[id]`. A ATV-05 só altera este arquivo para o
   imprimível.
5. `ActivitiesScreen.tsx`: novos `KIND_OPTIONS` (§3), `SelectField`s, contexto do paciente,
   seções; manter o ramo atual de Cadernos/Grupos com `useActivitiesQuery`. A rota
   `app/(tabs)/activities.tsx` lê `studentId` com `useLocalSearchParams` e repassa.
6. `app/activities/catalog.tsx` + `src/features/activities/CatalogListScreen.tsx` (novos);
   `SafeAreaView` com `edges={["left","right","bottom"]}` e `AppHeader`, como o
   `ActivityPlayScreen`.
7. `TaskDetailScreen.tsx`: selos de formato e habilidades, alternativas só no quiz, ramo da
   biblioteca com "Duplicar para editar" (`useMutation` + `withOfflineGuard`), "Editar" só para
   múltipla escolha.
8. `src/features/patients/detail/PatientDetailScreen.tsx`: **só** o botão "Atividades para
   {primeiro nome}" (`DsButton` `variant="secondary"`), junto às ações da ficha.
9. Testes: atualizar `__tests__/ActivitiesScreen.test.tsx` ao layout novo (sem apagar os casos de
   Cadernos/Grupos) e os AC abaixo.

## 8. Arquivos

- **Permitidos:** `src/features/activities/**` (menos `engine/` e `printable/`),
  `app/(tabs)/activities.tsx`, `app/activities/catalog.tsx` (novo),
  `src/features/content-detail/task/**`,
  `src/features/patients/detail/PatientDetailScreen.tsx` (só o botão),
  `src/api/endpoints/task-catalog.ts` (só `duplicateTask`), `src/mocks/handlers/task-catalog.ts`
  (só o `duplicate`), `src/mocks/README.md` (só a linha do `duplicate`), testes ao lado.
- **Proibidos:** `src/api/types.ts`, `src/api/errors.ts` (API-07), `engine/**` (ATV-04a/b),
  `src/features/content-create/**` (ATV-11), `src/features/sessions/**` (EVO-03),
  `package.json`.

## 9. Critérios de aceite

| ID           | Critério                                                                                                             | Verif. |
| ------------ | -------------------------------------------------------------------------------------------------------------------- | ------ |
| AC-ATV-09-01 | Filtros e busca vão como query para `GET /task/catalog` (formato, habilidade, categoria, `search` só com ≥ 2 letras) | `CT`   |
| AC-ATV-09-02 | A recomendada só aparece com paciente de contexto e mostra o `reason` do servidor                                    | `CT`   |
| AC-ATV-09-03 | Atividade da biblioteca não mostra "Editar" nem "Excluir"; "Duplicar para editar" abre o detalhe da cópia            | `CT`   |
| AC-ATV-09-04 | "Carregar mais" pede a página seguinte com o `nextCursor` e some quando não há mais                                  | `CT`   |
| AC-ATV-09-05 | Cadernos e grupos continuam navegáveis pelos chips                                                                   | `REV`  |

## 10. Como testar manualmente (Victor)

Expo Go Android, backend real depois da leva 1 (antes, modo mock).

1. Atividades: aparecem "Atividades prontas" e "Minhas atividades", com miniaturas coloridas.
2. Toque em "Imprimíveis": só aparecem imprimíveis. "Interativas": só jogos e quiz.
3. Busque "silaba" (sem acento): aparecem atividades com "Sílaba" no título ou na habilidade.
4. Escolha uma habilidade no seletor: a lista muda.
5. "Ver todas" em "Atividades prontas" → role e toque "Carregar mais" até acabar.
6. Abra uma atividade pronta: não há "Editar"/"Excluir"; "Duplicar para editar" abre a cópia,
   que tem "Excluir".
7. Pacientes → "Paciente Teste A" → "Atividades para Paciente": aparece "Recomendado para
   Paciente" com o motivo; "Iniciar atividade" abre o jogo. Toque "✕" no chip: o destaque some.
8. "Cadernos" e "Grupos" continuam abrindo os detalhes de antes.

## 11. Riscos e perguntas em aberto

- **Merge só depois da leva 1**: antes dela, `GET /task/catalog` não existe e o banco quebraria
  contra o backend real (mocks desligados por padrão desde G-51). O PR fica em rascunho até a
  integração (PLANO §4).
- **Recomendação depende de `learningTopics`** do paciente (AT-08); paciente sem dificuldades
  mapeadas e sem sessões pode vir sem recomendação — é o estado vazio, não erro.
- **Conteúdo da biblioteca** (AT-06) depende de quem produz (pergunta 8 da especificação §12);
  sem seed, "Atividades prontas" fica vazia: a seção mostra "Ainda não há atividades prontas." e
  não some.
- O `ActivitiesScreen.test.tsx` atual (169 linhas) testa a paginação no cliente; parte dele muda.

## 12. Fora do escopo

Os jogos (ATV-04a/b), o editor dos tipos novos (ATV-11), o imprimível e o "Imprimir" (ATV-05),
trocar o paciente de contexto por um seletor, IA para recomendar, favoritos.
