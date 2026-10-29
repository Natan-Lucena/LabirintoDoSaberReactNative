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
