import { create } from "zustand";

import type { Student, TaskNotebookSessionAnswer } from "@/api/types";
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
    ]);

    const educatorId =
      state.step === "idle" ? getActiveEducatorId() : state.educatorId;
    if (!educatorId) {
      throw new SessionFlowInvalidTransitionError("selectStudent", state.step);
    }

    const next: SessionFlowData = {
      ...state,
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

    set(persisted);
  },
}));
