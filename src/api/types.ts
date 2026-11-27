/**
 * Tipos compartilhados da API, replicados exatamente como documentados em
 * docs/PROJECT.md ("Tipos compartilhados" / "Endpoints"). Não adicionar campo
 * que não conste na documentação. Ver docs/contracts/t-305-tipos-modulos-api.md.
 */

export type Gender = "male" | "female";

export type TaskCategory =
  "reading" | "writing" | "vocabulary" | "comprehension";

export type TaskType =
  | "multipleChoice"
  | "multipleChoiceWithMedia"
  | "wordBuilder"
  | "colorMatch"
  | "memoryGame"
  | "printable";

/** Derivado do tipo pelo servidor (AT-03). */
export type TaskFormat = "INTERACTIVE" | "PRINTABLE";

/** `LIBRARY` = atividade pronta da plataforma, somente leitura (AT-06). */
export type TaskSource = "EDUCATOR" | "LIBRARY";

/** Cor da miniatura. */
export type TaskTone = "mint" | "peach" | "lavender" | "yellow";

export interface WordBuilderContent {
  kind: "wordBuilder";
  /** 2 a 12 letras maiúsculas, com acento permitido. */
  word: string;
  /** 0 a 6 letras extras no banco de letras. */
  distractors?: string[];
  hintImageUrl?: string;
  hintAudioUrl?: string;
}

export interface ColorMatchContent {
  kind: "colorMatch";
  /** 2 a 6 pares; `word` de 1 a 20; `colorHex` "#RRGGBB". */
  pairs: { id: string; word: string; colorHex: string }[];
}

export interface MemoryGameContent {
  kind: "memoryGame";
  /** 2 a 8 cartas; cada uma vira um par. */
  cards: { id: string; label?: string; imageUrl?: string }[];
}

export interface PrintableContent {
  kind: "printable";
  title: string;
  instructions: string;
  layout: "LIST" | "GRID" | "SEQUENCE";
  /** 1 a 20 itens, cada um com `text` ou `imageUrl`. */
  items: {
    id: string;
    text?: string;
    imageUrl?: string;
    /** 0 a 5 linhas para a criança escrever. */
    answerLines?: number;
  }[];
}

export type TaskContent =
  WordBuilderContent | ColorMatchContent | MemoryGameContent | PrintableContent;

/** `GET /task/skills` (catálogo fixo por seed, AT-12). */
export interface TaskSkill {
  code: string;
  label: string;
  /** Dificuldades do paciente ligadas a esta habilidade (AT-08). */
  learningTopics: string[];
}

/** Item de `GET /task/catalog`. */
export interface TaskSummary {
  id: string;
  type: TaskType;
  format: TaskFormat;
  source: TaskSource;
  category: TaskCategory;
  title: string;
  skills: { code: string; label: string }[];
  theme?: string;
  tone: TaskTone;
  thumbnailUrl?: string;
}

/** Item de `GET /task/recommended`. */
export interface RecommendedTask extends TaskSummary {
  /** Até 120 caracteres: "Consciência fonológica · dificuldade mapeada". */
  reason: string;
}

/** `GET /task/catalog` (paginação por cursor). */
export interface TaskCatalogPage {
  items: TaskSummary[];
  nextCursor?: string;
}

/** Resultado de um jogo na sessão (RS-*), exposto em relatório e evolução. */
export interface ActivityResult {
  id: string;
  sessionId: string;
  taskId: string;
  taskType: TaskType;
  completed: boolean;
  correct: boolean;
  attempts: number;
  errors: number;
  durationMs: number;
  recordedAt: string;
}

/** `activitySummary` do relatório da sessão (RS-05). */
export interface ActivitySummary {
  total: number;
  completed: number;
  correct: number;
}

// Padrão: 'PENDING'
export type AppointmentStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface Educator {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  contact?: string | null;
  profession?: string | null;
  /** Ausente = sem clínica (EQ; Entrega 5, mock-first). */
  clinic?: { id: string; name: string; role: TeamRole };
}

export interface StudentDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Student {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  zipcode: string;
  road: string;
  housenumber: string;
  phonenumber: string;
  learningTopics: string[];
  createdAt: string;
  educatorId: string;
  photoUrl: string | null;
  documents: StudentDocument[];
  guardianName?: string | null;
  guardianPhone?: string | null;
  guardianRelationship?: string | null;
  educators?: never;
  /** Relativo a quem lê (EQ-13; Entrega 5, mock-first). Ausente = `OWNER`. */
  access?: StudentAccess;
  /** Presente quando `access` = `SHARED`. */
  ownerName?: string;
  /** Ausente = `ACTIVE` (PA-01; Entrega 5, mock-first). */
  status?: StudentStatus;
  /** Só quando `ARCHIVED`. */
  archivedAt?: string;
}

export interface TaskAlternative {
  id: string;
  text: string;
  isCorrect: boolean;
}

/** Alternativa ainda não persistida, usada por geração IA e lote. */
export interface Alternative {
  id?: string;
  text: string;
  isCorrect: boolean;
}

/** POST /ai-task/generate (resposta) e POST /task/batch (entrada). */
export interface TaskInput {
  category: TaskCategory;
  type: TaskType;
  prompt: string;
  alternatives: Alternative[];
  imageFile?: string;
  audioFile?: string;
}

export interface Task {
  id: string;
  category: TaskCategory;
  type: TaskType;
  prompt: string;
  alternatives: TaskAlternative[];
  createdAt: string;
  imageFile?: string;
  audioFile?: string;
  // Entrega 5 (API-07, leva 1, mock-first): opcionais enquanto o backend real
  // não os envia. Ver taskFormat/taskSource em endpoints/task-catalog.ts.
  format?: TaskFormat;
  source?: TaskSource;
  skills?: string[];
  theme?: string;
  tone?: TaskTone;
  content?: TaskContent;
}

export interface TaskGroup {
  id: string;
  name: string;
  tasksIds: string[];
  educatorId: string;
  category: TaskCategory;
}

export interface TaskNotebook {
  id: string;
  educator: string;
  tasks: string[];
  category: TaskCategory;
  description: string;
  createdAt: string;
  taskGroupsIds: string[];
}

export interface TaskNotebookSessionAnswer {
  taskId: string;
  selectedAlternativeId: string;
  isCorrect: boolean;
  // Unidade não documentada na Parte I; preservada como número puro.
  timeToAnswer: number;
  answeredAt: string;
}

export interface TaskNotebookSession {
  id: string;
  studentId: string;
  educatorId: string;
  name: string;
  startedAt: string;
  // ausente = sessão ativa; preenchido = sessão finalizada
  finishedAt?: string | null;
  taskNotebookId?: string | null;
  appointmentId?: string | null;
  answers: TaskNotebookSessionAnswer[];
  observation?: string | null;
  /** Evolução da sessão (§3.9, só em `GET /task-notebook-session/student/:id`). */
  evolutionId?: string;
  /** Resultados dos jogos da sessão (RS-07; Entrega 5, mock-first). */
  activityResults?: ActivityResult[];
  /** Só quando o autor não é quem lê (EQ-12; Entrega 5, mock-first). */
  authorName?: string;
}

export interface Appointment {
  id: string;
  educatorId: string;
  studentId: string;
  scheduledAt: string;
  observation?: string | null;
  type?: string | null;
  durationMinutes: number;
  status: AppointmentStatus;
  notifiedAt?: string | null;
  createdAt: string;
  /** Presente nas ocorrências de série (RC; Entrega 5, mock-first). */
  seriesId?: string;
}

/** GET /educator/get-last-sessions — item da lista (máx. 2). */
export interface EducatorLastSession {
  studentName?: string;
  sessionName: string;
}

/** GET /task-notebook/ — item da lista combinada caderneta + grupos. */
export interface TaskNotebookWithGroups {
  notebook: TaskNotebook;
  taskGroups: TaskGroup[];
}

export type AnamneseQuestionType =
  "Descriptive" | "MultipleChoice" | "Checkbox" | "FileUpload";

export interface AnamneseTemplate {
  id: string;
  educatorId: string;
  title: string;
  description?: string;
  questions: {
    id: string;
    text: string;
    type: AnamneseQuestionType;
    required: boolean;
    order: number;
    options: { id: string; text: string }[];
  }[];
  createdAt: string;
}

// Planos com IA (PLN-01). Contrato: docs/entrega-3/BACKEND-ENTREGUE.md §2 a §5.
// Campos opcionais vêm AUSENTES do JSON, nunca `null`. Datas sem hora são
// `AAAA-MM-DD` (calendário, sem fuso).
export type PlanType = "PDI" | "PE";
export type PlanStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type GoalStatus =
  "NOT_STARTED" | "IN_PROGRESS" | "ACHIEVED" | "DISCONTINUED";
export type PlanSource = "AI" | "MANUAL";

export interface PlanProgress {
  /** Metas sem as `DISCONTINUED`. */
  totalGoals: number;
  achievedGoals: number;
  inProgressGoals: number;
  /** `round(100 × achieved / total)`; 0 quando não há metas. Calculado pelo servidor. */
  percent: number;
}

export interface PlanGoal {
  id: string;
  order: number;
  description: string;
  successCriterion?: string;
  status: GoalStatus;
  achievedAt?: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  educatorId: string;
  studentId: string;
  type: PlanType;
  status: PlanStatus;
  source: PlanSource;
  title: string;
  generalObjective: string;
  professionalNotes?: string;
  focus?: string;
  consideredDifficulties: string[];
  startDate: string;
  endDate: string;
  nextReviewDate?: string;
  /** Só PE. */
  parentPlanId?: string;
  /** Só PE (obrigatório nele). */
  sessionDate?: string;
  /** Só PE. */
  appointmentId?: string;
  goals: PlanGoal[];
  progress: PlanProgress;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  /** Só quando o autor não é quem lê (EQ-12; Entrega 5, mock-first). */
  authorName?: string;
}

/** `GET /plan/`: todos os campos do plano, menos `goals`, mais `studentName`. */
export type PlanSummary = Omit<Plan, "goals"> & { studentName: string };

export interface PlanReview {
  id: string;
  planId: string;
  reviewedAt: string;
  note: string;
  nextReviewDate?: string;
  /** Retrato das metas no momento da revisão. */
  goalStatuses: { goalId: string; status: GoalStatus }[];
}

/** `POST /plan/generate`: rascunho, não salva nada. */
export interface PlanDraft {
  type: PlanType;
  title: string;
  generalObjective: string;
  goals: { description: string; successCriterion?: string }[];
  suggestedStartDate: string;
  suggestedEndDate: string;
  suggestedNextReviewDate?: string;
  rationale?: string;
}

export type SuggestionKind =
  "UPDATE_GOAL_STATUS" | "ADD_GOAL" | "REWRITE_GOAL" | "SCHEDULE_REVIEW";
export type SuggestionStatus = "PENDING" | "ACCEPTED" | "DISMISSED";

export interface PlanSuggestion {
  id: string;
  planId: string;
  studentId: string;
  studentName: string;
  /** `UPDATE_GOAL_STATUS` e `REWRITE_GOAL`. */
  goalId?: string;
  kind: SuggestionKind;
  text: string;
  proposedChange: {
    status?: GoalStatus;
    description?: string;
    successCriterion?: string;
    nextReviewDate?: string;
  };
  status: SuggestionStatus;
  createdAt: string;
  resolvedAt?: string;
}

// Entrega 4, leva 1 (senha e evolução da sessão).
// Contrato PUBLICADO pelo backend (docs: BACKEND-ENTREGUE §3.1 e §3.2, conferido
// na INT-1). Campos opcionais vêm AUSENTES do JSON.

/** `PUT /educator/generate-token`: sempre a mesma resposta, exista ou não o e-mail (SN-02). */
export interface PasswordTokenSentResponse {
  message: "TOKEN_SENT";
}

/** `POST /educator/verify-token`: confere o código sem consumi-lo (SN-03). */
export interface VerifyPasswordTokenPayload {
  email: string;
  token: string;
}

export interface VerifyPasswordTokenResponse {
  valid: true;
}

/** `POST /educator/update-password`: o `token` é obrigatório (SN-04, SN-05); senha de 6 a 100 caracteres (SN-06). */
export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
}

/** `PUT /educator/change-password` (Bearer, SN-07). */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Depois da troca logada, o token anterior deixa de valer (SN-08). */
export interface ChangePasswordResponse {
  token: string;
}

export type CriterionResult =
  "ACHIEVED" | "PARTIAL" | "NOT_ACHIEVED" | "NOT_OBSERVED";

export interface EvolutionCriterion {
  id: string;
  /** Meta do plano; ausente = critério livre. */
  goalId?: string;
  description: string;
  successCriterion?: string;
  attempts?: number;
  successes?: number;
  result: CriterionResult;
  note?: string;
}

/** Critério enviado ao salvar: igual ao salvo, sem `id` (o servidor gera). */
export type EvolutionCriterionInput = Omit<EvolutionCriterion, "id">;

/** Tipo do plano ligado à evolução (G-57 revisto: PE ou, na falta, PDI). */
export type EvolutionPlanType = "PDI" | "PE";

export interface EvolutionGoalUpdate {
  goalId: string;
  status: GoalStatus;
}

export interface SessionEvolution {
  id: string;
  /** Só quando o autor não é quem lê (EQ-12; Entrega 5, mock-first). */
  authorName?: string;
  /** Única: uma evolução por sessão (EV-02). */
  sessionId: string;
  studentId: string;
  educatorId: string;
  appointmentId?: string;
  planId?: string;
  planType?: EvolutionPlanType;
  /** Retrato do título do plano na criação (sem o tipo). */
  planTitle?: string;
  /** `AAAA-MM-DD`, do `startedAt` da sessão. */
  sessionDate: string;
  durationMinutes?: number;
  criteria: EvolutionCriterion[];
  descriptiveRecord: string;
  nextSessionSuggestion?: string;
  goalUpdates: EvolutionGoalUpdate[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionEvolutionSummary {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  sessionDate: string;
  planTitle?: string;
  criteriaCount: number;
  achievedCount: number;
  /** Primeiros 200 caracteres do registro. */
  excerpt: string;
  createdAt: string;
}

export interface PendingEvolution {
  sessionId: string;
  studentId: string;
  studentName: string;
  sessionName: string;
  finishedAt: string;
  appointmentId?: string;
}

/** `GET /session-evolution/context/:sessionId` (§3.5). */
export interface EvolutionContext {
  session: {
    id: string;
    studentId: string;
    studentName: string;
    name: string;
    startedAt: string;
    finishedAt: string;
    durationMinutes: number;
    appointmentId?: string;
    answeredCount: number;
    correctCount: number;
  };
  /**
   * Plano escolhido pelo servidor (EV-12): PE `ACTIVE` do atendimento, PE do
   * dia da sessão e, na falta deles, o PDI `ACTIVE` (G-57 revisto). Ausente =
   * sem plano. O POST precisa reenviar `plan.id` em `planId`.
   */
  plan?: { id: string; type: EvolutionPlanType; title: string };
  suggestedCriteria: {
    goalId: string;
    description: string;
    successCriterion?: string;
    goalStatus: GoalStatus;
  }[];
  existingEvolutionId?: string;
  /** Jogos da sessão (RS-06; Entrega 5, mock-first). */
  activityResults?: {
    taskId: string;
    title: string;
    taskType: TaskType;
    completed: boolean;
    correct: boolean;
    attempts: number;
    errors: number;
  }[];
}

/** `POST /session-evolution/` (EVO-01). */
export interface CreateSessionEvolutionPayload {
  sessionId: string;
  planId?: string;
  criteria: EvolutionCriterionInput[];
  descriptiveRecord: string;
  nextSessionSuggestion?: string;
  goalUpdates?: EvolutionGoalUpdate[];
}

/** `PUT /session-evolution/:id` (EVO-02): `criteria`, quando presente, é a lista completa. */
export interface UpdateSessionEvolutionPayload {
  criteria?: EvolutionCriterionInput[];
  descriptiveRecord?: string;
  nextSessionSuggestion?: string;
  goalUpdates?: EvolutionGoalUpdate[];
}

/** `POST /session-evolution/next-session-suggestion` (IA, não persiste; EVO-04). */
export interface NextSessionSuggestionPayload {
  sessionId: string;
  criteria?: EvolutionCriterionInput[];
  descriptiveRecord?: string;
}

export interface NextSessionSuggestion {
  /** Até 1000 caracteres. */
  suggestion: string;
  /** Até 500 caracteres. */
  rationale?: string;
}

// Entrega 4, leva 2 (escalas, insight da escala e síntese da anamnese).
// Conferido na INT-2 contra o contrato publicado (docs/entrega-4/BACKEND-ENTREGUE.md
// §3.3 a §3.5). Campos opcionais vêm AUSENTES do JSON.
// O escore, a faixa e as subescalas são sempre calculados pelo servidor (AV-05):
// o app só os exibe.

export type ScaleRespondent = "PROFESSIONAL" | "GUARDIAN" | "TEACHER";
export type BandSeverity = "LOW" | "MODERATE" | "HIGH";
export type ScaleApplicationStatus = "DRAFT" | "COMPLETED";

export interface ScaleOption {
  value: number;
  label: string;
}

export interface ScaleItem {
  id: string;
  order: number;
  text: string;
  subscaleCode?: string;
}

export interface ScaleSubscale {
  code: string;
  name: string;
}

export interface ScaleBand {
  /** Ausente = escore total. */
  subscaleCode?: string;
  min: number;
  max: number;
  /** Ex.: "Indicativo moderado". */
  label: string;
  severity: BandSeverity;
}

/** Catálogo (somente leitura no app). Versão nova quando itens, opções ou faixas mudam. */
export interface ScaleTemplate {
  id: string;
  /** Estável entre versões. */
  code: string;
  version: number;
  name: string;
  description: string;
  instructions: string;
  respondent: ScaleRespondent;
  /** Em anos. */
  ageRange?: { min: number; max: number };
  estimatedMinutes: number;
  /** 2 a 7 opções. */
  options: ScaleOption[];
  items: ScaleItem[];
  subscales: ScaleSubscale[];
  scoring: { method: "SUM" | "MEAN"; bands: ScaleBand[] };
  disclaimer: string;
  /** Citação da fonte. */
  reference: string;
  active: boolean;
}

/**
 * `GET /scale-template/`: a maior versão de cada escala ATIVA (as inativas nem
 * vêm, por isso não há `active`), sem `items` e com `itemCount`.
 */
export interface ScaleTemplateSummary {
  id: string;
  code: string;
  version: number;
  name: string;
  description: string;
  respondent: ScaleRespondent;
  ageRange?: { min: number; max: number };
  estimatedMinutes: number;
  itemCount: number;
}

export interface ScaleBandResult {
  label: string;
  severity: BandSeverity;
}

export interface ScaleSubscaleScore {
  code: string;
  name: string;
  /** Itens da subescala já respondidos e total de itens dela. */
  answered: number;
  total: number;
  value: number;
  max: number;
  band?: ScaleBandResult;
}

export interface ScaleScore {
  /** `true` enquanto há itens sem resposta. */
  partial: boolean;
  answered: number;
  /** Itens da escala. */
  total: number;
  /** Soma ou média (`scoring.method`). */
  value: number;
  max: number;
  /** Com `partial: true` é a faixa dos itens respondidos, mostrada como "parcial" (AV-06, G-60). */
  band?: ScaleBandResult;
  subscales: ScaleSubscaleScore[];
}

export interface ScaleAnswer {
  itemId: string;
  value: number;
}

export interface ScaleInsight {
  /** Até 800 caracteres, sem diagnóstico (IN-04). */
  text: string;
  generatedAt: string;
  /** `true` em `DRAFT`, `false` em `COMPLETED` (IN-02). */
  preliminary: boolean;
}

export interface ScaleApplication {
  id: string;
  templateId: string;
  templateCode: string;
  /** Versão usada na aplicação; a leitura e o escore seguem sempre esta versão (AV-02). */
  templateVersion: number;
  templateName: string;
  studentId: string;
  studentName: string;
  educatorId: string;
  appointmentId?: string;
  status: ScaleApplicationStatus;
  answers: ScaleAnswer[];
  score: ScaleScore;
  insight?: ScaleInsight;
  /** Em toda resposta de aplicação (AV-09). */
  disclaimer: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
}

/** `GET /scale-application/`: igual à aplicação, sem `answers`. */
export type ScaleApplicationSummary = Omit<ScaleApplication, "answers">;

export interface ListScaleApplicationsFilters {
  studentId?: string;
  status?: ScaleApplicationStatus;
  /** 1 a 100 (padrão do servidor: 50). */
  limit?: number;
}

/** `POST /scale-application/` (escrita da tela AVA-02; sem função de endpoint na leva 2). */
export interface CreateScaleApplicationPayload {
  studentId: string;
  templateId: string;
  appointmentId?: string;
}

/** `409 DRAFT_ALREADY_EXISTS` (AV-03): o app retoma o rascunho existente. */
export interface ScaleDraftAlreadyExistsResponse {
  message: "DRAFT_ALREADY_EXISTS";
  applicationId: string;
}

/** `400 SCALE_INCOMPLETE` ao concluir (AV-07). */
export interface ScaleIncompleteResponse {
  message: "SCALE_INCOMPLETE";
  missingItemIds: string[];
}

/** Síntese da anamnese gerada por IA (AS-01): até 1500 caracteres, em tópicos. */
export interface AnamneseSummary {
  text: string;
  generatedAt: string;
}

/**
 * Campos novos da resposta da anamnese (AS-02): `summary` é ausente se nunca gerada.
 * `summaryOutdated` (resposta editada depois da síntese) só vem nos GETs (detalhe e
 * lista) e no POST da síntese (`false`); PUT e POST de resposta NÃO o trazem, então
 * depois de editar o app relê com GET.
 */
export interface AnamneseSummaryFields {
  summary?: AnamneseSummary;
  summaryOutdated?: boolean;
}

// Entrega 4, leva 3 (relatórios e notificações no app). Contrato PROVISÓRIO de
// docs/entrega-4/ESPECIFICACAO-BACKEND.md §6 e §7, a conferir em API-04.

export type ReportType = "PROGRESS" | "ASSESSMENT" | "PDI_PROGRESS";
export type ReportSection =
  | "PATIENT_DATA"
  | "SESSION_METRICS"
  | "EVOLUTIONS"
  | "PLAN_PROGRESS"
  | "ASSESSMENTS"
  | "ANAMNESIS_SUMMARY"
  | "AI_SYNTHESIS";
export type ReportAudience = "FAMILY" | "SCHOOL" | "PROFESSIONAL";

export interface ReportOptions {
  types: {
    type: ReportType;
    label: string;
    description: string;
    allowedSections: ReportSection[];
    /** Igual a `allowedSections`; o app tira as sensíveis para FAMILY e SCHOOL (RP-01). */
    defaultSections: ReportSection[];
  }[];
  sections: { section: ReportSection; label: string; sensitive: boolean }[];
  audiences: { audience: ReportAudience; label: string }[];
  periods: {
    key: "30d" | "90d" | "180d";
    label: string;
    days: 30 | 90 | 180;
  }[];
  maxPeriodDays: 365;
}

export interface ReportContent {
  title: string;
  generatedAt: string;
  professional: { name: string; profession?: string };
  patient?: { displayName: string; ageYears: number; schoolGrade?: string };
  sessionMetrics?: {
    sessions: number;
    answered: number;
    /** Fração de 0 a 1 (G-43). */
    accuracy: number;
    byCategory: {
      category: "reading" | "writing" | "vocabulary" | "comprehension";
      accuracy: number;
    }[];
  };
  evolutions?: {
    sessionDate: string;
    planTitle?: string;
    achieved: number;
    total: number;
    record: string;
  }[];
  planProgress?: {
    title: string;
    type: "PDI" | "PE";
    percent: number;
    goals: { description: string; status: string }[];
  }[];
  assessments?: {
    templateName: string;
    completedAt: string;
    value: number;
    max: number;
    band?: string;
  }[];
  anamnesisSummary?: string;
  /** Texto da IA em parágrafos simples (até 2500 caracteres). */
  synthesis?: string;
}

export interface ReportShare {
  channel: "SHARE" | "PRINT";
  at: string;
}

export interface Report {
  id: string;
  /** Só quando o autor não é quem lê (EQ-12; Entrega 5, mock-first). */
  authorName?: string;
  studentId: string;
  studentName: string;
  educatorId: string;
  type: ReportType;
  audience: ReportAudience;
  /** `AAAA-MM-DD`. */
  period: { from: string; to: string };
  sections: ReportSection[];
  /** Retrato gravado na geração (RP-03). */
  content: ReportContent;
  /** `true` quando a IA falhou e o relatório foi criado sem a síntese (RP-06). */
  synthesisFailed: boolean;
  createdAt: string;
  shares: ReportShare[];
}

/** `GET /report/`: sem `content` e sem `shares`; traz só o último envio. */
export type ReportSummary = Omit<Report, "content" | "shares"> & {
  lastShare?: ReportShare;
};

export interface ListReportsFilters {
  studentId?: string;
  /** 1 a 100 (padrão do servidor: 50). */
  limit?: number;
}

/** `POST /report/` (escrita da tela REL-01; sem função de endpoint na leva 3). */
export interface CreateReportPayload {
  studentId: string;
  type: ReportType;
  audience: ReportAudience;
  period: { from: string; to: string };
  /** 1 a 20, todas em `allowedSections` do tipo. */
  sections: ReportSection[];
}

/** `POST /report/:id/share` (escrita da REL-02; sem função de endpoint na leva 3). */
export interface ShareReportPayload {
  channel: ReportShare["channel"];
}

export type NotificationKind =
  | "APPOINTMENTS_TODAY"
  | "EVOLUTION_PENDING"
  | "PLAN_REVIEW_DUE"
  | "SCALE_DRAFT_STALE";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** Até 80 caracteres. */
  title: string;
  /** Até 200 caracteres; pode ter o primeiro nome do paciente. */
  body: string;
  target?: {
    type: "AGENDA_DAY" | "SESSION" | "PLAN" | "SCALE_APPLICATION";
    /** `AGENDA_DAY`: a data `AAAA-MM-DD` (não é UUID); os outros: UUID do recurso. */
    id: string;
  };
  createdAt: string;
  readAt?: string;
}

export interface ListNotificationsFilters {
  unreadOnly?: boolean;
  /** 1 a 50 (padrão do servidor: 20). */
  limit?: number;
  /** `nextCursor` da página anterior. */
  cursor?: string;
}

/** Uma página pode vir com menos itens que `limit`, ou vazia com `nextCursor`. */
export interface NotificationsPage {
  items: AppNotification[];
  nextCursor?: string;
}

// ---------------------------------------------------------------------------
// Entrega 5, leva 2 (API-07): equipe. CONTRATOS-BACKEND §2.3 e §4. Mock-first.
// ---------------------------------------------------------------------------

export type TeamRole = "ADMIN" | "PROFESSIONAL";

export type StudentAccess = "OWNER" | "SHARED";

export interface Clinic {
  id: string;
  /** 2 a 80 caracteres, sem espaços nas pontas. */
  name: string;
  createdAt: string;
}

export interface ClinicMember {
  educatorId: string;
  name: string;
  email: string;
  photoUrl?: string;
  profession?: string;
  role: TeamRole;
  joinedAt: string;
}

export interface ClinicInvite {
  id: string;
  /** 8 caracteres de A-Z e 2-9, sem 0, O, 1 e I. */
  code: string;
  role: TeamRole;
  /** `educatorId` de quem criou. */
  createdBy: string;
  expiresAt: string;
  /** Texto pronto para o Share (EQ-05, EQ-17). */
  shareMessage: string;
  createdAt: string;
}

/** `GET /clinic/`: ADMIN primeiro, depois por nome. */
export interface ClinicView {
  clinic: Clinic;
  myRole: TeamRole;
  members: ClinicMember[];
}

/** `GET /clinic/invites/preview/:code` (pública). */
export interface InvitePreview {
  clinicName: string;
  role: TeamRole;
  expiresAt: string;
}

/** `GET /student/:id/shares` (sem o dono). */
export interface StudentShare {
  educatorId: string;
  name: string;
  role: TeamRole;
  sharedAt: string;
}

// ---------------------------------------------------------------------------
// Leva 3 (API-07): status do paciente e recorrência. CONTRATOS-BACKEND §2.4,
// §2.5 e §5. Mock-first.
// ---------------------------------------------------------------------------

export type StudentStatus = "ACTIVE" | "ARCHIVED";

/** Filtro de `GET /student/` e `GET /student/overview` (padrão `ACTIVE`). */
export type StudentStatusFilter = StudentStatus | "ALL";

export type PatientPrimaryStatus =
  "PDI_ACTIVE" | "ASSESSMENT_PENDING" | "PLAN_REVIEW" | "NO_PLAN";

export type PatientPendingKind =
  "EVOLUTION_PENDING" | "PLAN_REVIEW_DUE" | "SCALE_DRAFT" | "ANAMNESIS_MISSING";

export interface PatientOverview {
  studentId: string;
  primaryStatus: PatientPrimaryStatus;
  activePlan?: {
    id: string;
    type: "PDI" | "PE";
    title: string;
    /** Inteiro de 0 a 100. */
    percent: number;
  };
  nextAppointment?: { id: string; scheduledAt: string };
  /** `[]` = sem pendência. `targetId` só quando `count` = 1 e nunca em `ANAMNESIS_MISSING` (PA-09). */
  pendings: { kind: PatientPendingKind; count: number; targetId?: string }[];
}

export type RecurrenceFrequency = "WEEKLY" | "BIWEEKLY";

export interface AppointmentSeries {
  id: string;
  studentId: string;
  educatorId: string;
  frequency: RecurrenceFrequency;
  /** ISO UTC; o dia da semana e a hora de São Paulo vêm daqui. */
  firstScheduledAt: string;
  /** Pedidas na criação (2 a 26). */
  occurrences: number;
  type?: string;
  durationMinutes: number;
  observation?: string;
  /** Série encerrada por "cancelar este e os seguintes". */
  endedAt?: string;
  createdAt: string;
}

/** `GET /appointment/series/:id`: todas as ocorrências, por `scheduledAt` (RC-10). */
export interface AppointmentSeriesDetail extends AppointmentSeries {
  appointments: Appointment[];
}

/** Resposta de criar, alterar e cancelar série (as escritas entram com as telas). */
export interface SeriesResult {
  series: AppointmentSeries;
  created: Appointment[];
  skipped: {
    scheduledAt: string;
    reason: "CONFLICT";
    conflictingAppointmentId: string;
  }[];
}

// ---------------------------------------------------------------------------
// Leva 4 (API-07): push e central de ajuda. CONTRATOS-BACKEND §2.6, §2.7 e §6.
// Mock-first.
// ---------------------------------------------------------------------------

export interface PushToken {
  /** `ExponentPushToken[...]` ou `ExpoPushToken[...]`. */
  token: string;
  platform: "android" | "ios";
  createdAt: string;
  lastSeenAt: string;
}

export interface NotificationPreferences {
  /** Padrão `true`. */
  pushEnabled: boolean;
  /** Sempre com as quatro chaves; padrão tudo `true`. Só desliga o push, não a lista. */
  kinds: Record<NotificationKind, boolean>;
}

/** `data` do push enviado pela API da Expo (PU-04). */
export interface PushData {
  notificationIds: string[];
  /** Só quando `notificationIds` tem um item. */
  target?: AppNotification["target"];
}

/** Tutorial da central de ajuda (G-69). */
export interface HelpTutorial {
  id: string;
  /** Inteiro, único, crescente. */
  order: number;
  /** Até 80. */
  title: string;
  /** Até 200. */
  description: string;
  /** Inteiro > 0. */
  durationSeconds: number;
  /** "Comece por aqui"; no máximo um `true`. */
  featured: boolean;
  /** https, MP4 ou HLS. */
  videoUrl?: string;
  thumbnailUrl?: string;
  /** Até 10 passos de até 200 caracteres; obrigatório sem `videoUrl`. */
  steps?: string[];
}
