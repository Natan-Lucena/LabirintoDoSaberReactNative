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
  photoUrl?: string;
  contact?: string;
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
  educators: string[];
}

export interface TaskAlternative {
  id: string;
  text: string;
  isCorrect: boolean;
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
  finishedAt?: string;
  answers: TaskNotebookSessionAnswer[];
  observation?: string;
}

export interface Appointment {
  id: string;
  educatorId: string;
  studentId: string;
  scheduledAt: string;
  observation?: string;
  status: AppointmentStatus;
  notifiedAt?: string;
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
