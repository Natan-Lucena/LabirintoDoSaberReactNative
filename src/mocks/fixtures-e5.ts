// Dados fictícios da Entrega 5, levas 2 a 4 (API-07): equipe, compartilhamento,
// arquivamento, série de atendimentos, preferências de push e tutoriais.
// Nomes genéricos, sem dado de criança real.
import type {
  Appointment,
  AppointmentSeriesDetail,
  Clinic,
  ClinicMember,
  HelpTutorial,
  NotificationPreferences,
  Student,
  StudentShare,
} from "@/api/types";
import { MOCK_EDUCATOR, MOCK_STUDENTS } from "@/mocks/fixtures";

// --- Equipe (leva 2) --------------------------------------------------------

export const MOCK_CLINIC: Clinic = {
  id: "mock-clinic-1",
  name: "Clínica Teste",
  createdAt: "2026-10-01T12:00:00.000Z",
};

export const MOCK_COLLEAGUE_ID = "mock-educator-2";
export const MOCK_COLLEAGUE_NAME = "Profissional Teste Dois";
export const MOCK_THIRD_MEMBER_ID = "mock-educator-3";

/** Código de convite ativo usado na prévia pública. */
export const MOCK_INVITE_CODE = "AB3K7MPQ";
/** Código que simula `429 TOO_MANY_REQUESTS` na prévia. */
export const MOCK_INVITE_RATE_LIMITED_CODE = "LIMITE22";

/** Membros da clínica; o papel de quem lê depende do cenário. */
export function buildMockClinicMembers(
  myRole: "ADMIN" | "PROFESSIONAL",
): ClinicMember[] {
  const members: ClinicMember[] = [
    {
      educatorId: MOCK_EDUCATOR.id,
      name: MOCK_EDUCATOR.name,
      email: MOCK_EDUCATOR.email,
      role: myRole,
      joinedAt: "2026-10-01T12:00:00.000Z",
    },
    {
      educatorId: MOCK_COLLEAGUE_ID,
      name: MOCK_COLLEAGUE_NAME,
      email: "profissional.teste2@example.com",
      profession: "Psicopedagoga",
      role: myRole === "ADMIN" ? "PROFESSIONAL" : "ADMIN",
      joinedAt: "2026-10-05T12:00:00.000Z",
    },
    {
      educatorId: MOCK_THIRD_MEMBER_ID,
      name: "Profissional Teste Três",
      email: "profissional.teste3@example.com",
      role: "PROFESSIONAL",
      joinedAt: "2026-10-12T12:00:00.000Z",
    },
  ];

  // ADMIN primeiro, depois por nome (pt-BR, sem acento nem maiúscula).
  return members.sort((a, b) =>
    a.role !== b.role
      ? a.role === "ADMIN"
        ? -1
        : 1
      : a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
  );
}

// --- Pacientes extras (levas 2 e 3) -----------------------------------------

export const MOCK_SHARED_STUDENT_ID = "student-shared-1";
export const MOCK_ARCHIVED_STUDENT_ID = "student-archived-1";

const baseStudent = MOCK_STUDENTS[0];

/** Compartilhado com quem lê pela colega (só aparece com o cenário de equipe). */
export const MOCK_SHARED_STUDENT: Student = {
  ...baseStudent,
  id: MOCK_SHARED_STUDENT_ID,
  name: "Paciente Teste Compartilhado",
  educatorId: MOCK_COLLEAGUE_ID,
  photoUrl: null,
  access: "SHARED",
  ownerName: MOCK_COLLEAGUE_NAME,
  status: "ACTIVE",
};

/** Arquivado: só aparece com `?status=ARCHIVED` ou `ALL`. */
export const MOCK_ARCHIVED_STUDENT: Student = {
  ...baseStudent,
  id: MOCK_ARCHIVED_STUDENT_ID,
  name: "Paciente Teste Arquivado",
  photoUrl: null,
  access: "OWNER",
  status: "ARCHIVED",
  archivedAt: "2026-11-10T12:00:00.000Z",
};

/** Compartilhamentos por paciente próprio (sem o dono). */
export const MOCK_STUDENT_SHARES: Record<string, StudentShare[]> = {
  "student-1": [
    {
      educatorId: MOCK_COLLEAGUE_ID,
      name: MOCK_COLLEAGUE_NAME,
      role: "PROFESSIONAL",
      sharedAt: "2026-11-02T12:00:00.000Z",
    },
  ],
};

// --- Série de atendimentos (leva 3) -----------------------------------------

export const MOCK_SERIES_ID = "mock-series-1";
export const MOCK_SERIES_ENDED_ID = "mock-series-ended";
export const MOCK_SERIES_FOREIGN_ID = "mock-series-foreign";

function occurrence(
  seriesId: string,
  index: number,
  scheduledAt: string,
  status: Appointment["status"],
): Appointment {
  return {
    id: `${seriesId}-a${index}`,
    educatorId: MOCK_EDUCATOR.id,
    studentId: "student-1",
    scheduledAt,
    type: null,
    durationMinutes: 50,
    observation: null,
    notifiedAt: null,
    status,
    createdAt: "2026-11-01T12:00:00.000Z",
    seriesId,
  };
}

/** Semanal, terças às 14:00 de São Paulo; 5 ocorrências (uma cancelada, duas concluídas). */
export const MOCK_SERIES: AppointmentSeriesDetail = {
  id: MOCK_SERIES_ID,
  studentId: "student-1",
  educatorId: MOCK_EDUCATOR.id,
  frequency: "WEEKLY",
  firstScheduledAt: "2026-11-10T17:00:00.000Z",
  occurrences: 5,
  durationMinutes: 50,
  createdAt: "2026-11-01T12:00:00.000Z",
  appointments: [
    occurrence(MOCK_SERIES_ID, 1, "2026-11-10T17:00:00.000Z", "COMPLETED"),
    occurrence(MOCK_SERIES_ID, 2, "2026-11-17T17:00:00.000Z", "CANCELLED"),
    occurrence(MOCK_SERIES_ID, 3, "2026-11-24T17:00:00.000Z", "COMPLETED"),
    occurrence(MOCK_SERIES_ID, 4, "2026-12-01T17:00:00.000Z", "PENDING"),
    occurrence(MOCK_SERIES_ID, 5, "2026-12-08T17:00:00.000Z", "PENDING"),
  ],
};

/** Quinzenal já encerrada (`endedAt`): as últimas ocorrências foram canceladas. */
export const MOCK_SERIES_ENDED: AppointmentSeriesDetail = {
  id: MOCK_SERIES_ENDED_ID,
  studentId: "student-1",
  educatorId: MOCK_EDUCATOR.id,
  frequency: "BIWEEKLY",
  firstScheduledAt: "2026-10-06T18:00:00.000Z",
  occurrences: 4,
  durationMinutes: 50,
  type: "Reforço de leitura",
  endedAt: "2026-11-05T12:00:00.000Z",
  createdAt: "2026-10-01T12:00:00.000Z",
  appointments: [
    occurrence(
      MOCK_SERIES_ENDED_ID,
      1,
      "2026-10-06T18:00:00.000Z",
      "COMPLETED",
    ),
    occurrence(
      MOCK_SERIES_ENDED_ID,
      2,
      "2026-10-20T18:00:00.000Z",
      "COMPLETED",
    ),
    occurrence(
      MOCK_SERIES_ENDED_ID,
      3,
      "2026-11-03T18:00:00.000Z",
      "CANCELLED",
    ),
    occurrence(
      MOCK_SERIES_ENDED_ID,
      4,
      "2026-11-17T18:00:00.000Z",
      "CANCELLED",
    ),
  ],
};

// --- Push e ajuda (leva 4) --------------------------------------------------

export const MOCK_DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  kinds: {
    APPOINTMENTS_TODAY: true,
    EVOLUTION_PENDING: true,
    PLAN_REVIEW_DUE: true,
    SCALE_DRAFT_STALE: true,
  },
};

export const MOCK_HELP_TUTORIALS: HelpTutorial[] = [
  {
    id: "mock-tutorial-1",
    order: 1,
    title: "Conheça o Labirinto do Saber",
    description: "Um tour pelas abas e pelo fluxo de uma sessão.",
    durationSeconds: 240,
    featured: true,
    videoUrl: "https://example.test/ajuda/tour.mp4",
    thumbnailUrl: "https://example.test/ajuda/tour.jpg",
    steps: ["Abra a aba Início.", "Toque em Iniciar sessão."],
  },
  {
    id: "mock-tutorial-2",
    order: 2,
    title: "Cadastre um paciente",
    description: "Como cadastrar um paciente e registrar a anamnese.",
    durationSeconds: 180,
    featured: false,
    videoUrl: "https://example.test/ajuda/paciente.m3u8",
    thumbnailUrl: "https://example.test/ajuda/paciente.jpg",
  },
  {
    id: "mock-tutorial-3",
    order: 3,
    title: "Monte um caderno de atividades",
    description: "Escolha atividades da biblioteca e organize em um caderno.",
    durationSeconds: 150,
    featured: false,
    steps: [
      "Abra a aba Atividades.",
      "Toque em Novo caderno.",
      "Escolha as atividades e salve.",
    ],
  },
  {
    id: "mock-tutorial-4",
    order: 4,
    title: "Convide a equipe",
    description: "Crie a equipe da clínica e convide colegas por código.",
    durationSeconds: 120,
    featured: false,
    videoUrl: "https://example.test/ajuda/equipe.mp4",
  },
];
