// Overview de pacientes (API-07, leva 3; CONTRATOS-BACKEND §5.2). Contrato
// PROPOSTO, mock-first. `GET /student/:id` e o filtro `status` de `GET /student/`
// ficam em `student.ts`. O overview não traz nome nem dado do paciente.
import type {
  PatientOverview,
  PatientPendingKind,
  PatientPrimaryStatus,
} from "@/api/types";
import { MOCK_APPOINTMENTS } from "@/mocks/fixtures";
import {
  MOCK_ARCHIVED_STUDENT_ID,
  MOCK_SHARED_STUDENT_ID,
} from "@/mocks/fixtures-e5";
import { mockPlans } from "./plans";
import { MOCK_SCALE_APPLICATION_DRAFT_ID } from "./scales";
import { registerMockHandler } from "./registry";
import { listMockStudents, parseStatusFilter } from "./student";

interface PendingSeed {
  kind: PatientPendingKind;
  count: number;
  targetId?: string;
}

/** Status principal e pendências por paciente fictício (o resto vem dos planos e atendimentos). */
const OVERVIEW_SEEDS: Record<
  string,
  { primaryStatus: PatientPrimaryStatus; pendings: PendingSeed[] }
> = {
  // Plano com revisão vencida: PLAN_REVIEW vence PDI ativo (PA-06).
  "student-1": {
    primaryStatus: "PLAN_REVIEW",
    pendings: [
      { kind: "EVOLUTION_PENDING", count: 1, targetId: "mock-session-1" },
      { kind: "PLAN_REVIEW_DUE", count: 1, targetId: "mock-plan-1" },
    ],
  },
  "student-2": {
    primaryStatus: "ASSESSMENT_PENDING",
    pendings: [
      {
        kind: "SCALE_DRAFT",
        count: 1,
        targetId: MOCK_SCALE_APPLICATION_DRAFT_ID,
      },
    ],
  },
  "student-3": { primaryStatus: "NO_PLAN", pendings: [] },
  // Sem anamnese: `targetId` nunca vem (PA-09).
  "student-4": {
    primaryStatus: "ASSESSMENT_PENDING",
    pendings: [{ kind: "ANAMNESIS_MISSING", count: 1 }],
  },
  // Mais de uma pendência do mesmo tipo: sem `targetId` (PA-09).
  "student-5": {
    primaryStatus: "NO_PLAN",
    pendings: [{ kind: "EVOLUTION_PENDING", count: 2 }],
  },
  [MOCK_SHARED_STUDENT_ID]: { primaryStatus: "PDI_ACTIVE", pendings: [] },
  [MOCK_ARCHIVED_STUDENT_ID]: { primaryStatus: "NO_PLAN", pendings: [] },
};

/** PDI `ACTIVE` ou, sem ele, o PE `ACTIVE` mais recente. */
function activePlanOf(studentId: string): PatientOverview["activePlan"] {
  const active = mockPlans.filter(
    (plan) => plan.studentId === studentId && plan.status === "ACTIVE",
  );
  const plan =
    active.find((item) => item.type === "PDI") ??
    [...active].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (plan) {
    return {
      id: plan.id,
      type: plan.type,
      title: plan.title,
      percent: plan.progress.percent,
    };
  }
  // O compartilhado não tem plano nos mocks de planos: o overview traz um fictício.
  if (studentId === MOCK_SHARED_STUDENT_ID) {
    return {
      id: "mock-plan-shared",
      type: "PDI",
      title: "PDI de leitura",
      percent: 60,
    };
  }
  return undefined;
}

function nextAppointmentOf(
  studentId: string,
): PatientOverview["nextAppointment"] {
  const next = MOCK_APPOINTMENTS.filter(
    (appointment) =>
      appointment.studentId === studentId && appointment.status === "PENDING",
  ).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
  return next ? { id: next.id, scheduledAt: next.scheduledAt } : undefined;
}

export function buildMockOverview(studentId: string): PatientOverview {
  const seed = OVERVIEW_SEEDS[studentId] ?? {
    primaryStatus: "NO_PLAN" as const,
    pendings: [],
  };
  const activePlan = activePlanOf(studentId);
  const nextAppointment = nextAppointmentOf(studentId);

  return {
    studentId,
    primaryStatus: seed.primaryStatus,
    ...(activePlan ? { activePlan } : {}),
    ...(nextAppointment ? { nextAppointment } : {}),
    pendings: seed.pendings.map((pending) => ({ ...pending })),
  };
}

/** PA-08: um item para cada paciente de `GET /student/?status=X`, na mesma ordem. */
registerMockHandler(
  { method: "get", path: "/student/overview" },
  ({ params }) => {
    const status = parseStatusFilter(params.status);
    return {
      status: 200,
      data: listMockStudents(status).map((student) =>
        buildMockOverview(student.id),
      ),
    };
  },
);

export const studentStatusMockHandlersRegistered = true;
