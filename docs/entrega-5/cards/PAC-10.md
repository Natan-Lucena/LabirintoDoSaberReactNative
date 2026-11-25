# PAC-10 — Status e pendências dos pacientes

| Campo             | Valor                                                                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Bloco / onda      | D — Pacientes e agenda · E5-7 (paralela à AGE-06; arquivos disjuntos)                                                                        |
| Classe / modelo   | B · Codex (ou Terra/Sonnet), esforço médio                                                                                                   |
| Estimativa        | M · 4–6 h de worker                                                                                                                          |
| Dependências      | API-07 (pacientes: `PatientOverview`, `getStudentOverview`); backend leva 3 (§5); G-70; EQP-04 na `main` (dona anterior da lista e da ficha) |
| Estado do backend | **Mock-first**; `GET /student/overview` é novo                                                                                               |
| História          | US5-01 (ver quem tem pendência)                                                                                                              |

## 1. Objetivo e valor

A lista de pacientes do design mostra, em cada cartão, "idade · status" e um filtro
"Pendências". Hoje o filtro aparece como "Pendências · Em breve" e o cartão mostra as
dificuldades. Com o status **calculado no servidor** (G-70, PA-06), a profissional vê de relance
quem precisa de atenção e abre a pendência com um toque.

## 2. Referência de design

`PatientsScreen` ([ficha PAC-01 da Entrega 2](../../entrega-2/BACKLOG.md)): eyebrow "N pacientes
ativos", `.filter-row` Todos / Com sessão hoje / **Pendências**, `.patient-card` com "idade ·
status" e o próximo atendimento com `clock`. O bloco de pendências da ficha não tem desenho
(`src/components/ds`: `SectionTitle` + `FeatureRow`).

## 3. Fluxo do usuário

1. Aba Pacientes: a tela carrega `GET /student/`, `GET /appointment/` (como hoje) e
   `GET /student/overview`.
2. Cada cartão: "{idade} anos · {status}" no lugar das dificuldades; o resto igual.
3. Filtros (`FilterRow`): **Todos**, **Com sessão hoje**, **Pendências**. O `FilterChip`
   desabilitado "Pendências · Em breve" sai. "Pendências" mostra só quem tem
   `pendings.length > 0`; vazio: "Nenhum paciente com pendência".
4. Eyebrow: "{N} pacientes ativos" (ou "1 paciente ativo"), com N = pacientes da lista
   (`GET /student/` já devolve só os `ACTIVE`, PA-03).
5. Ficha → aba "Visão geral": seção **"Pendências"** (só se houver) com uma linha por pendência;
   tocar abre o destino (§6, item 4).

## 4. Estados da tela

| Situação                          | O que aparece                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Overview carregando               | A lista aparece com as dificuldades no lugar do status (como hoje) até o overview chegar                                 |
| Erro no overview                  | A lista funciona como hoje; o filtro "Pendências" mostra "Não foi possível carregar as pendências." + "Tentar novamente" |
| Paciente sem entrada no overview  | Cartão com as dificuldades (reserva); fora do filtro "Pendências"                                                        |
| Filtro "Pendências" vazio         | "Nenhum paciente com pendência"                                                                                          |
| Offline                           | Overview do cache persistido; sem cache, como o erro                                                                     |
| Pendência sem `targetId`          | Abre o destino genérico (§6, item 4)                                                                                     |
| `404` ao abrir rascunho de escala | `Toast` "Este item não está mais disponível." (frase da NOT-01)                                                          |

## 5. Contrato de dados

| Rota                                                            | Query                       | Resposta                | Erros |
| --------------------------------------------------------------- | --------------------------- | ----------------------- | ----- |
| `GET /student/overview`                                         | `status?` (padrão `ACTIVE`) | `200 PatientOverview[]` | `400` |
| `GET /student/` (existente)                                     | —                           | `Student[]`             | —     |
| `GET /scale-application/:id` (existente, `getScaleApplication`) | —                           | aplicação               | `404` |

```ts
// API-07, src/api/types.ts (proposta da especificação §5.2)
type PatientPrimaryStatus =
  "PDI_ACTIVE" | "ASSESSMENT_PENDING" | "PLAN_REVIEW" | "NO_PLAN";
type PatientPendingKind =
  "EVOLUTION_PENDING" | "PLAN_REVIEW_DUE" | "SCALE_DRAFT" | "ANAMNESIS_MISSING";
interface PatientOverview {
  studentId: string;
  primaryStatus: PatientPrimaryStatus;
  activePlan?: {
    id: string;
    type: "PDI" | "PE";
    title: string;
    percent: number;
  };
  nextAppointment?: { id: string; scheduledAt: string };
  pendings: { kind: PatientPendingKind; count: number; targetId?: string }[];
}
```

- **Leitura** (API-07): `getStudentOverview({ status })` em `src/api/endpoints/student-status.ts`;
  chave `studentStatusKeys.overview(status) = ["student", "overview", { status }]` (sob
  `["student"]`: criar paciente, arquivar e compartilhar já invalidam).
- **Hook** (esta tarefa): `usePatientOverview()` em `src/features/patients/overview/`, que
  devolve também um `Map<studentId, PatientOverview>`.
- **Invalidação extra:** registrar evolução, salvar plano, concluir escala e responder anamnese
  mudam as pendências. Em vez de mexer nessas telas, o overview usa `staleTime: 0` e
  `refetchOnMount: "always"` (como o contador do sino), e a ficha refaz a leitura ao ganhar foco.
- **Cache:** persistido (só ids, status e contagens; sem nome).

## 6. Regras de negócio e casos de borda

1. **O app não calcula o status** (AC-PAC-10-01): o rótulo vem só de `primaryStatus`.
   Rótulos em `src/features/patients/overview/labels.ts`:
   - `PDI_ACTIVE` → "PDI ativo";
   - `ASSESSMENT_PENDING` → "Avaliação pendente";
   - `PLAN_REVIEW` → "{activePlan.type} em revisão" ("PDI em revisão", "PE em revisão"); sem
     `activePlan`, "Plano em revisão";
   - `NO_PLAN` → "Sem plano";
   - valor desconhecido → as dificuldades (como hoje), sem erro.
2. Filtro "Pendências": `pendings.length > 0` (AC-PAC-10-02). Função pura
   `filterByPendings(patients, overviewById)` em `src/features/patients/list/selectors.ts`
   (o `PatientFilter` ganha `"pendings"`). A busca por nome continua valendo junto com o filtro.
3. Contagem: sempre `patients.length` da lista ativa; com busca ou filtro, o eyebrow não muda.
4. **Destino de cada pendência** (função `pendingRoute` em
   `src/features/patients/overview/pendings.ts`, testada):

   | `kind`              | Rótulo (count = 1 / > 1)                         | Com `targetId`                                                                                                                      | Sem `targetId`                   |
   | ------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
   | `EVOLUTION_PENDING` | "Evolução pendente" / "{n} evoluções pendentes"  | `evolutionRoute(targetId, "entry")` (sessão)                                                                                        | `/evolution` (hub de pendências) |
   | `PLAN_REVIEW_DUE`   | "Revisão do plano vencida"                       | `planDetailRoute(targetId)`                                                                                                         | aba "Planos" da ficha            |
   | `SCALE_DRAFT`       | "Escala em rascunho" / "{n} escalas em rascunho" | `getScaleApplication(targetId)` → `applyRoute(templateId, { studentId, applicationId })` (o mesmo caminho da `NotificationsScreen`) | aba "Avaliações" da ficha        |
   | `ANAMNESIS_MISSING` | "Anamnese não preenchida"                        | `/patients/[id]/anamnese`                                                                                                           | o mesmo                          |

5. Na ficha, a seção "Pendências" **substitui** o bloco atual "Registrar evolução" (que usa
   `usePendingEvolutions`): o `EVOLUTION_PENDING` do overview cobre o mesmo caso. Se o overview
   falhar, o bloco antigo continua (reserva), para não perder o atalho da Entrega 4.
6. O cabeçalho da ficha continua "{idade} anos · Ativo" (a PAC-11 trata o arquivado).
7. Paciente compartilhado (EQP-04): as pendências são as do paciente, para quem acompanha
   (EQ-14 vale para notificações; o overview mostra o estado do paciente).

## 7. Plano de implementação

1. `src/features/patients/overview/`: `labels.ts`, `pendings.ts` (`pendingLabel`,
   `pendingRoute`), `usePatientOverview.ts`, `PendingsSection.tsx`.
2. `src/features/patients/list/selectors.ts`: `PatientFilter = "all" | "today" | "pendings"` e
   `filterPatients` recebe o `overviewById` (opcional).
3. `src/features/patients/list/PatientsListScreen.tsx`: terceira opção no `FilterRow`, remover o
   `FilterChip` "Em breve", status no `PatientCard`, eyebrow no singular/plural, estado de erro
   do filtro.
4. `src/features/patients/detail/PatientDetailScreen.tsx`: `PendingsSection` no lugar do bloco
   de evolução pendente (com a reserva do §6, item 5).
5. Atualizar `src/features/patients/list/__tests__/PatientsListScreen.test.tsx` (o teste do
   "Em breve" vira o teste do filtro) e os testes da ficha afetados.

## 8. Arquivos

- **Permitidos:** `src/features/patients/overview/**` (novo), `src/features/patients/list/**`,
  `src/features/patients/detail/PatientDetailScreen.tsx` (só a seção) e os testes.
- **Proibidos:** `src/api/**` (leitura e tipos são da API-07; se faltar algo, escalar),
  `src/features/notifications/**`, `src/features/evolution/**`, `src/features/agenda/**`.

## 9. Critérios de aceite

| ID           | Critério                                                                                          | Verificação |
| ------------ | ------------------------------------------------------------------------------------------------- | ----------- |
| AC-PAC-10-01 | O rótulo do cartão vem do `primaryStatus` (os quatro valores e o desconhecido); o app não calcula | `CT`        |
| AC-PAC-10-02 | "Pendências" filtra pelos `pendings` do servidor, junto com a busca                               | `UT`        |
| AC-PAC-10-03 | `pendingRoute` leva cada tipo, com e sem `targetId`, à tela da tabela do §6                       | `UT`        |
| AC-PAC-10-04 | Nenhum "Em breve" na lista de pacientes                                                           | `CT`        |

## 10. Como testar manualmente (Victor)

Conta de teste com pacientes fictícios em situações diferentes (preparar antes): um com PDI
ativo, um sem plano, um com sessão finalizada sem evolução, um sem anamnese.

1. Aba Pacientes: cada cartão mostra "N anos · {status}" coerente com o paciente.
2. Toque em "Pendências": só aparecem os que têm algo a fazer. Busque um nome dentro do filtro.
3. Abra a ficha do paciente com sessão sem evolução: a seção "Pendências" mostra "Evolução
   pendente"; toque e veja a tela da evolução daquela sessão.
4. Registre a evolução, volte à lista e puxe para atualizar: o paciente sai do filtro.
5. Repita com "Anamnese não preenchida" → abre a anamnese do paciente.

## 11. Riscos e perguntas em aberto

- **`targetId` de `SCALE_DRAFT` e `PLAN_REVIEW_DUE`:** a especificação diz "opcional". Se o
  backend não mandar, o app usa o destino genérico da tabela.
- **Custo do overview:** uma chamada por abertura da lista. Se o backend for lento (Vercel),
  manter o comportamento de reserva (lista sem status) e registrar na QA-08.
- **"Pacientes ativos" com compartilhados:** a contagem inclui os compartilhados que a pessoa
  acompanha. Padrão: inclui (é a lista dela). Pergunta ao usuário se quer só os próprios.

## 12. Fora do escopo

Arquivar e reativar, filtro "Arquivados" (PAC-11); mudar as notificações; calcular status no
app; ordenar por status.
