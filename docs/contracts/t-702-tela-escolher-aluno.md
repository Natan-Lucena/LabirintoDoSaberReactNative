# Contrato T-702 — Tela 04: escolher aluno

## 1. Objetivo e escopo

Implementar a tela 04 (`sessaoAluno`, DESIGN §2, `docs/design/telas/04-sessao-aluno.html`)
que lista os alunos do educador (`GET /student/`, dados mockados via T-601/G-29),
permite busca local por nome e seleção única, e grava o aluno escolhido no store
de fluxo de sessão (T-701) antes de navegar para a tela 05.

**Não objetivos:** implementar a tela 05 (T-703, aqui só um placeholder de rota
quando exigido pelo `typedRoutes`); editar `src/mocks/**` (T-601); ligar o acesso
a partir da Home (T-603); chamadas de API além de `listStudents` (T-305).

## 2. Decisões aprovadas

- G-14 (resolvido): `Student` não tem campo de nível — a linha de nível do
  protótipo é omitida (AC-702-06). Texto exibido: `"{idade} anos • {gênero em pt-BR}"`,
  com `gender: "male"` → `"Masculino"`, `"female"` → `"Feminino"`. Avatar usa
  `photoUrl` quando presente; iniciais do nome (via `Avatar`, T-203) quando `null`.
- G-29: dados mockados nesta fase (`EXPO_PUBLIC_USE_MOCKS`, camada da T-601); esta
  tarefa não implementa nem lê `src/mocks/**` diretamente — consome `listStudents`
  (T-305) através do `apiClient`, que já resolve mock vs. rede.
- AC-702-04 foi removida do backlog (G-09 revisto): nenhuma tela abre a 04 com
  aluno pré-selecionado; o ID não é reaproveitado.
- Rota `app/session/content.tsx` (tela 05, T-703) ainda não existe. Como
  `typedRoutes: true` (`app.json`) exige que a rota exista para o `router.push`
  tipar, esta tarefa cria um placeholder mínimo reaproveitando `ComingSoonScreen`
  ("Em breve"), que a T-703 substitui.
- **Ajuste aprovado pelo orquestrador (2026-09-25):** DESIGN §5 mostra
  `StepIndicator` de passo único na tela 04 (as 3 etapas são só da tela 01).
  Usa-se `totalSteps: 1, currentStep: 1`, sem `labels` inventados, envolvido
  por um contêiner acessível com `accessibilityLabel="Passo 1"` que esconde o
  `StepIndicator` interno da árvore de acessibilidade
  (`accessibilityElementsHidden`/`importantForAccessibility="no-hide-descendants"`
  no nó interno) — evita duplicar/alterar o rótulo fixo "Etapa X de N" do
  componente do T-203 (fora de escopo editar).
- **Ajuste aprovado pelo orquestrador (2026-09-25):** "Voltar" também chama
  `useSessionFlowStore().cancel()` (permitido em `idle`, T-701) antes de
  `router.back()`, para não deixar aluno persistido que reapareça no próximo
  acesso à tela 04.
- `app/session/_layout.tsx` é um `Stack` simples (mesmo padrão de
  `app/(auth)/_layout.tsx`), fora do grupo `(tabs)`, sem tab bar. O header do
  fluxo de sessão fica por conta de cada tela (usa `AppHeader`, T-203) — decisão
  registrada aqui pois o design mostra header nas telas 04/05 mas sem menu/avatar
  de navegação entre abas; nesta tarefa o header usa `onMenuPress`/`onAvatarPress`
  abrindo "Em breve" (mesmo padrão de `(tabs)/_layout.tsx`), sem duplicar lógica
  de abas.

## 3. Comportamento observável e critérios de aceite

- **AC-702-01** A tela busca `listStudents()` ao montar; o campo "Buscar
  Aluno..." filtra a lista carregada localmente por `name`, comparação
  case-insensitive e sem diferenciar acentos (normalização NFD). — `CT`
- **AC-702-02** Tocar em um `StudentRow` seleciona aquele aluno (borda turquesa
  - ícone de check) e desseleciona qualquer outro; `accessibilityState.selected`
    reflete o estado; só um aluno selecionado por vez. — `CT`
- **AC-702-03** Botão "Próximo Passo" fica desabilitado (`accessibilityState.disabled`)
  sem seleção; com seleção, chama `selectStudent(student)` da store T-701 e navega
  para `/session/content`. Botão "Voltar" sai do fluxo de sessão (`router.back()`). — `CT`
- **AC-702-05** Estados de carregando (`LoadingState`), vazio (`EmptyState`, sem
  alunos cadastrados) e erro (`ErrorState`, com nova tentativa que refaz o
  `refetch`) são exibidos conforme o resultado da query. — `CT`
- **AC-702-06** A linha do aluno nunca exibe nível; mostra apenas nome e
  "idade • gênero" em pt-BR. — `CT`

## 4. Interfaces

### `src/features/students/useStudents.ts`

```ts
export function useStudents(): UseQueryResult<Student[], ApiError>;
```

- `useQuery({ queryKey: ["student"], queryFn: listStudents })` (chave de domínio
  conforme convenção do T-304 §4, `["student", ...]`; aqui sem id pois é a lista).
- Não define `retry`/`networkMode` locais — herda o `QueryClient` global (T-304).

### `src/features/students/StudentRow.tsx`

```ts
export interface StudentRowProps {
  student: Student;
  selected: boolean;
  onPress: (student: Student) => void;
}
export function StudentRow(props: StudentRowProps): ReactElement;
```

- Usa `Card` (`onPress`, `selected`) com `Avatar` (`uri: student.photoUrl ?? undefined`,
  `name: student.name`), nome e a linha "idade • gênero" (função pura exportada
  `formatStudentSubtitle(student: Student): string`, mapa `GENDER_LABEL_PT_BR:
Record<Gender, string>` exportado para reuso/teste).
- Ícone de check visível apenas quando `selected` (elemento decorativo,
  `accessibilityElementsHidden`); a seleção em si é comunicada por
  `accessibilityState.selected` do `Card`.

### `src/features/sessions/StudentStep.tsx`

```ts
export function StudentStep(): ReactElement;
```

- Orquestra `useStudents()`, estado local de busca (`useState<string>`) e de
  seleção (`useState<Student | null>`), filtro local por
  `normalizeForSearch(name).includes(normalizeForSearch(query))`
  (`normalizeForSearch` exportada: `NFD` + remove diacríticos + `toLowerCase`).
- Renderiza `Screen` → marcador de passo único (`StepIndicator` com
  `totalSteps: 1, currentStep: 1`, envolvido por contêiner acessível
  `accessibilityLabel="Passo 1"`, ver decisão acima), título, `SearchField`,
  lista (`FlatList` de `StudentRow`) ou `LoadingState`/`EmptyState`/`ErrorState`,
  `FooterActions` (`primaryLabel: "Próximo Passo"`,
  `primaryDisabled: !selectedStudent`).
- Ao confirmar: `useSessionFlowStore().selectStudent(selectedStudent)` (T-701,
  chamada assíncrona — aguarda antes de navegar) então
  `router.push("/session/content")`. Ao voltar: chama
  `useSessionFlowStore().cancel()` e depois `router.back()`.

### Rotas

- `app/session/_layout.tsx`: `<Stack screenOptions={{ headerShown: false }} />`
  (cada tela desenha seu próprio `AppHeader` dentro do `Screen`, mesmo padrão do
  `(auth)` — decisão registrada acima).
- `app/session/student.tsx`: `export default function StudentRoute() { return <StudentStep />; }`.
- `app/session/content.tsx` (placeholder): reaproveita `ComingSoonScreen` com
  `title="Nome e conteúdo"`, substituído pela T-703.

## 5. Plano de testes

| Arquivo                                                | Cobre                                                                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/students/__tests__/useStudents.test.tsx` | Query usa `listStudents`, chave `["student"]`, propaga `ApiError`.                                                                                                  |
| `src/features/students/__tests__/StudentRow.test.tsx`  | Render de nome/idade/gênero pt-BR, ausência de nível, `accessibilityState.selected`, avatar por `photoUrl`/iniciais.                                                |
| `src/features/sessions/__tests__/StudentStep.test.tsx` | AC-702-01 (busca sem acento/maiúscula), AC-702-02 (seleção única), AC-702-03 (botão desabilitado, grava no store, navega), AC-702-05 (loading/empty/error + retry). |

Mock de `@/api/endpoints/student` (`listStudents`) e de `@/stores/session-flow`
(`useSessionFlowStore`) nos testes de `StudentStep`; mock de `expo-router`
(`useRouter`) para capturar `push`/`back`. Não usa `src/mocks/**` (T-601, fora
de escopo).

## 6. Tabela de tarefas

| Arquivo                                                                         | Dono            | Depende de |
| ------------------------------------------------------------------------------- | --------------- | ---------- |
| `app/session/_layout.tsx`, `app/session/student.tsx`, `app/session/content.tsx` | Executor Sonnet | T-501      |
| `src/features/students/{useStudents.ts,StudentRow.tsx}`                         | Executor Sonnet | T-305      |
| `src/features/sessions/StudentStep.tsx`                                         | Executor Sonnet | T-701      |
| Testes correspondentes em `__tests__/`                                          | Executor Sonnet | —          |

Modelo/esforço: Sonnet, médio (classe B). Fase 1 e 2 no mesmo executor.

## 7. Comandos de validação

- Fase 1: `pnpm exec vitest run src/features/students/__tests__ src/features/sessions/__tests__/StudentStep.test.tsx`
  (esperado: falhas por comportamento ausente); `pnpm run typecheck` (esperado: 0).
- Fase 2: os mesmos testes (esperado: verde); `pnpm run test`; `pnpm run typecheck`;
  `pnpm run lint`; `pnpm exec prettier --check` nos arquivos tocados;
  `python scripts/check-docs.py`; `git diff --check`;
  `npx expo export --platform android --output-dir dist-android` (apagar depois).

## 8. Pendências

- Header da tela 04 dentro do fluxo de sessão: reaproveita `AppHeader` com
  `onMenuPress`/`onAvatarPress` abrindo "Em breve", igual às abas — não há tela
  de menu/perfil própria do fluxo de sessão nesta entrega.
- `app/session/content.tsx` é placeholder; T-703 substitui integralmente.

## Histórico

- 2026-09-25: contrato criado pelo executor Sonnet para a fase 1 (contrato +
  testes + vermelho) da T-702, após leitura de AGENTS §4/§6, BACKLOG (T-702,
  T-703), GATES (G-14, G-29), DESIGN §2 (04), contratos T-202, T-203, T-205,
  T-304, T-305, T-701, T-501, e código existente em `src/components/**`,
  `src/api/endpoints/student.ts`, `src/api/types.ts`, `src/stores/session-flow.ts`,
  `app/(tabs)/_layout.tsx`, `app/(auth)/_layout.tsx`, `src/features/shell/ComingSoonScreen.tsx`.
