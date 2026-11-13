/**
 * Tipos compartilhados da API, replicados exatamente como documentados em
 * docs/PROJECT.md ("Tipos compartilhados" / "Endpoints"). Não adicionar campo
 * que não conste na documentação. Ver docs/contracts/t-305-tipos-modulos-api.md.
 */

export type Gender = "male" | "female";

export type TaskCategory =
  "reading" | "writing" | "vocabulary" | "comprehension";

export type TaskType = "multipleChoice" | "multipleChoiceWithMedia";

// Padrão: 'PENDING'
export type AppointmentStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface Educator {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  contact?: string | null;
  profession?: string | null;
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
// Contrato PROVISÓRIO, copiado de docs/entrega-4/ESPECIFICACAO-BACKEND.md §2 e §3
// (G-29: mock-first). Deve ser conferido contra o contrato real publicado
// pelo backend na tarefa API-04. Campos opcionais vêm AUSENTES do JSON.

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

export interface EvolutionGoalUpdate {
  goalId: string;
  status: GoalStatus;
}

export interface SessionEvolution {
  id: string;
  /** Única: uma evolução por sessão (EV-02). */
  sessionId: string;
  studentId: string;
  educatorId: string;
  appointmentId?: string;
  planId?: string;
  planType?: "PE";
  /** Ex.: "PE · {tema}". */
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
  /** PE `ACTIVE` escolhido pelo servidor (EV-12, G-57: sem PDI); ausente = sem plano. */
  plan?: { id: string; type: "PE"; title: string };
  suggestedCriteria: {
    goalId: string;
    description: string;
    successCriterion?: string;
    goalStatus: GoalStatus;
  }[];
  existingEvolutionId?: string;
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
// Contrato PROVISÓRIO, copiado de docs/entrega-4/ESPECIFICACAO-BACKEND.md §4 e §5
// (G-29: mock-first), a conferir em API-04. Campos opcionais vêm AUSENTES do JSON.
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

/** `GET /scale-template/`: sem `items`, com `itemCount`. */
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
  active: boolean;
}

export interface ScaleBandResult {
  label: string;
  severity: BandSeverity;
}

export interface ScaleSubscaleScore {
  code: string;
  name: string;
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
 * Campos novos da resposta da anamnese (AS-02), sempre opcionais: `summary` é
 * ausente se nunca gerada; `summaryOutdated` indica resposta editada depois da síntese.
 * Aplicam-se a `GET /anamnese/responses/:responseId`, à lista por aluno e ao
 * retorno de `POST /anamnese/responses/:responseId/summary`.
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
    defaultSections: ReportSection[];
  }[];
  sections: { section: ReportSection; label: string; sensitive: boolean }[];
  audiences: { audience: ReportAudience; label: string }[];
  periods: { key: string; label: string; days: number }[];
  /** 365. */
  maxPeriodDays: number;
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
    byCategory: { category: string; accuracy: number }[];
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
  synthesisFailed?: boolean;
  createdAt: string;
  shares: ReportShare[];
}

/** `GET /report/`: igual ao relatório, sem `content`. */
export type ReportSummary = Omit<Report, "content">;

export interface ListReportsFilters {
  studentId?: string;
  /** 1 a 100. */
  limit?: number;
}

/** `POST /report/` (escrita da tela REL-01; sem função de endpoint na leva 3). */
export interface CreateReportPayload {
  studentId: string;
  type: ReportType;
  audience: ReportAudience;
  period: { from: string; to: string };
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
    id: string;
  };
  createdAt: string;
  readAt?: string;
}

export interface ListNotificationsFilters {
  unreadOnly?: boolean;
  /** 1 a 50 (padrão do servidor: 20). */
  limit?: number;
  cursor?: string;
}

export interface NotificationsPage {
  items: AppNotification[];
  nextCursor?: string;
}
