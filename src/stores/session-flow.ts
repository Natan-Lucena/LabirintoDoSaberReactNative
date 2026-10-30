import { create } from "zustand";

import type {
  Student,
  TaskNotebookSession,
  TaskNotebookSessionAnswer,
} from "@/api/types";
import {
  clearSessionFlow,
  getActiveEducatorId,
  getStorage,
} from "@/storage/mmkv";

export type SessionFlowStep =
  | "idle"
  | "studentSelected"
  | "configured"
  | "starting"
  | "startUncertain"
  | "running"
  | "finishing"
  | "awaitingObservation"
  | "closed"
  | "error";

export type SessionFlowContentKind = "notebook" | "group" | "task";

export type SessionFlowContent = {
  kind: SessionFlowContentKind;
  id: string;
  name: string;
};

export type SessionFlowData = {
  step: SessionFlowStep;
  educatorId: string | null;
  student: Student | null;
  sessionName: string | null;
  content: SessionFlowContent | null;
  sessionId: string | null;
  /** Consulta da agenda que originou a sessão (AGE-04); `null` quando avulsa. */
  appointmentId: string | null;
  startRequestedAt: string | null;
  activityIndex: number;
  confirmedAnswers: TaskNotebookSessionAnswer[];
  pendingAnswers: TaskNotebookSessionAnswer[];
  conflictedAnswers: TaskNotebookSessionAnswer[];
  errorReason: string | null;
};

export type SessionFlowState = SessionFlowData & {
  selectStudent: (student: Student) => Promise<void>;
  configure: (input: {
    name: string;
    content: SessionFlowContent;
  }) => Promise<void>;
  /**
   * SES-05 (G-06): retoma, neste aparelho, uma sessão aberta no servidor que
   * está ligada a um caderno, já com as respostas confirmadas.
   */
  seedFromServerSession: (input: {
    student: Student;
    session: TaskNotebookSession;
    content: SessionFlowContent;
  }) => Promise<void>;
  setAppointmentId: (appointmentId: string | null) => Promise<void>;
  requestStart: () => Promise<void>;
  confirmStart: (sessionId: string) => Promise<void>;
  markStartUncertain: () => Promise<void>;
  failStart: (reason: string) => Promise<void>;
  confirmAnswer: (answer: TaskNotebookSessionAnswer) => Promise<void>;
  markAnswerPending: (answer: TaskNotebookSessionAnswer) => Promise<void>;
  markAnswerConflict: (answer: TaskNotebookSessionAnswer) => Promise<void>;
  finish: () => Promise<void>;
  awaitObservation: () => Promise<void>;
  close: () => Promise<void>;
  cancel: () => Promise<void>;
  discard: (input: { confirmed: boolean }) => Promise<void>;
  hydrate: (currentEducatorId: string) => Promise<void>;
};

export class SessionFlowInvalidTransitionError extends Error {
  constructor(action: string, step: SessionFlowStep) {
    super(`Transição inválida: "${action}" não é permitida em "${step}".`);
    this.name = "SessionFlowInvalidTransitionError";
  }
}

export const SESSION_FLOW_STORAGE_KEY = "session:flow";

export const initialSessionFlowData: SessionFlowData = {
  step: "idle",
  educatorId: null,
  student: null,
  sessionName: null,
  content: null,
  sessionId: null,
  appointmentId: null,
  startRequestedAt: null,
  activityIndex: 0,
  confirmedAnswers: [],
  pendingAnswers: [],
  conflictedAnswers: [],
  errorReason: null,
};

function requireStep(
  action: string,
  current: SessionFlowStep,
  allowed: SessionFlowStep[],
): void {
  if (!allowed.includes(current)) {
    throw new SessionFlowInvalidTransitionError(action, current);
  }
}

async function persist(data: SessionFlowData): Promise<void> {
  if (!data.educatorId) {
    return;
  }
  const storage = await getStorage(data.educatorId);
  storage.set(SESSION_FLOW_STORAGE_KEY, JSON.stringify(data));
}

async function clearPersisted(educatorId: string | null): Promise<void> {
  if (!educatorId) {
    return;
  }
  await clearSessionFlow(educatorId);
}

export const useSessionFlowStore = create<SessionFlowState>((set, get) => ({
  ...initialSessionFlowData,

  selectStudent: async (student) => {
    const state = get();
    requireStep("selectStudent", state.step, [
      "idle",
      "studentSelected",
      "configured",
      "startUncertain",
      "error",
    ]);

    // Um "error" ou "startUncertain" que sobrou de uma tentativa anterior
    // recomeça como "idle": o início incerto é redescoberto no servidor.
    const fresh =
      state.step === "idle" ||
      state.step === "error" ||
      state.step === "startUncertain";
    const educatorId = fresh ? getActiveEducatorId() : state.educatorId;
    if (!educatorId) {
      throw new SessionFlowInvalidTransitionError("selectStudent", state.step);
    }

    // Outro paciente descarta nome, conteúdo e atendimento do anterior.
    const changedStudent =
      !fresh && state.student !== null && state.student.id !== student.id;
    const next: SessionFlowData = {
      ...(fresh || changedStudent ? initialSessionFlowData : state),
      step: "studentSelected",
      educatorId,
      student,
    };
    set(next);
    await persist(next);
  },

  configure: async ({ name, content }) => {
    const state = get();
    requireStep("configure", state.step, ["studentSelected", "configured"]);

    const next: SessionFlowData = {
      ...state,
      step: "configured",
      sessionName: name,
      content,
    };
    set(next);
    await persist(next);
  },

  seedFromServerSession: async ({ student, session, content }) => {
    const state = get();
    requireStep("seedFromServerSession", state.step, [
      "idle",
      "studentSelected",
      "configured",
      "error",
    ]);

    const educatorId =
      state.step === "idle" || state.step === "error"
        ? getActiveEducatorId()
        : state.educatorId;
    if (!educatorId) {
      throw new SessionFlowInvalidTransitionError(
        "seedFromServerSession",
        state.step,
      );
    }

    const next: SessionFlowData = {
      ...initialSessionFlowData,
      step: "running",
      educatorId,
      student,
      sessionName: session.name,
      content,
      sessionId: session.id,
      appointmentId: session.appointmentId ?? null,
      confirmedAnswers: session.answers,
      activityIndex: session.answers.length,
    };
    set(next);
    await persist(next);
  },

  setAppointmentId: async (appointmentId) => {
    const state = get();
    const next: SessionFlowData = { ...state, appointmentId };
    set(next);
    await persist(next);
  },

  requestStart: async () => {
    const state = get();
    requireStep("requestStart", state.step, ["configured"]);

    const next: SessionFlowData = {
      ...state,
      step: "starting",
      startRequestedAt: new Date().toISOString(),
    };
    set(next);
    await persist(next);
  },

  confirmStart: async (sessionId) => {
    const state = get();
    requireStep("confirmStart", state.step, ["starting", "startUncertain"]);

    const next: SessionFlowData = {
      ...state,
      step: "running",
      sessionId,
      activityIndex: 0,
    };
    set(next);
    await persist(next);
  },

  markStartUncertain: async () => {
    const state = get();
    requireStep("markStartUncertain", state.step, ["starting"]);

    const next: SessionFlowData = { ...state, step: "startUncertain" };
    set(next);
    await persist(next);
  },

  failStart: async (reason) => {
    const state = get();
    requireStep("failStart", state.step, ["starting", "startUncertain"]);

    const next: SessionFlowData = {
      ...state,
      step: "error",
      errorReason: reason,
    };
    set(next);
    await persist(next);
  },

  confirmAnswer: async (answer) => {
    const state = get();
    requireStep("confirmAnswer", state.step, ["running"]);
    if (!state.sessionId) {
      throw new SessionFlowInvalidTransitionError("confirmAnswer", state.step);
    }

    const next: SessionFlowData = {
      ...state,
      confirmedAnswers: [...state.confirmedAnswers, answer],
      pendingAnswers: state.pendingAnswers.filter(
        (a) => a.taskId !== answer.taskId,
      ),
      conflictedAnswers: state.conflictedAnswers.filter(
        (a) => a.taskId !== answer.taskId,
      ),
      activityIndex: state.activityIndex + 1,
    };
    set(next);
    await persist(next);
  },

  markAnswerPending: async (answer) => {
    const state = get();
    requireStep("markAnswerPending", state.step, ["running"]);
    if (!state.sessionId) {
      throw new SessionFlowInvalidTransitionError(
        "markAnswerPending",
        state.step,
      );
    }

    const next: SessionFlowData = {
      ...state,
      pendingAnswers: [...state.pendingAnswers, answer],
    };
    set(next);
    await persist(next);
  },

  markAnswerConflict: async (answer) => {
    const state = get();
    requireStep("markAnswerConflict", state.step, ["running"]);
    if (!state.sessionId) {
      throw new SessionFlowInvalidTransitionError(
        "markAnswerConflict",
        state.step,
      );
    }

    const next: SessionFlowData = {
      ...state,
      pendingAnswers: state.pendingAnswers.filter(
        (a) => a.taskId !== answer.taskId,
      ),
      conflictedAnswers: [...state.conflictedAnswers, answer],
    };
    set(next);
    await persist(next);
  },

  finish: async () => {
    const state = get();
    requireStep("finish", state.step, ["running"]);

    const next: SessionFlowData = { ...state, step: "finishing" };
    set(next);
    await persist(next);
  },

  awaitObservation: async () => {
    const state = get();
    requireStep("awaitObservation", state.step, ["finishing"]);

    const next: SessionFlowData = { ...state, step: "awaitingObservation" };
    set(next);
    await persist(next);
  },

  close: async () => {
    const state = get();
    requireStep("close", state.step, ["awaitingObservation"]);

    set({ ...state, step: "closed" });
    await clearPersisted(state.educatorId);
  },

  cancel: async () => {
    const state = get();
    requireStep("cancel", state.step, [
      "idle",
      "studentSelected",
      "configured",
      "startUncertain",
      "error",
    ]);

    const educatorId = state.educatorId;
    set({ ...initialSessionFlowData });
    await clearPersisted(educatorId);
  },

  discard: async ({ confirmed }) => {
    const state = get();
    requireStep("discard", state.step, [
      "starting",
      "startUncertain",
      "running",
      "finishing",
      "awaitingObservation",
      "error",
    ]);
    if (!confirmed) {
      throw new SessionFlowInvalidTransitionError("discard", state.step);
    }

    const educatorId = state.educatorId;
    set({ ...initialSessionFlowData });
    await clearPersisted(educatorId);
  },

  hydrate: async (currentEducatorId) => {
    const storage = await getStorage(currentEducatorId);
    const raw = storage.getString(SESSION_FLOW_STORAGE_KEY);
    if (!raw) {
      set({ ...initialSessionFlowData });
      return;
    }

    const persisted = JSON.parse(raw) as SessionFlowData;
    if (persisted.educatorId !== currentEducatorId) {
      await clearSessionFlow(currentEducatorId);
      set({ ...initialSessionFlowData });
      return;
    }

    // Fluxos salvos antes de campos novos (ex.: appointmentId) não os trazem.
    // Nenhuma requisição de início sobrevive a um reinício do app.
    set({
      ...initialSessionFlowData,
      ...persisted,
      step: persisted.step === "starting" ? "startUncertain" : persisted.step,
    });
  },
}));
