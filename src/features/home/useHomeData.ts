import { useQuery } from "@tanstack/react-query";

import { listAppointments } from "@/api/endpoints/appointment";
import { listTaskNotebooks } from "@/api/endpoints/content";
import { getLastSessions, getMe } from "@/api/endpoints/educator";
import { listStudents } from "@/api/endpoints/student";
import { ApiError } from "@/api/errors";
import type {
  Appointment,
  Educator,
  EducatorLastSession,
  Student,
  TaskNotebookWithGroups,
} from "@/api/types";
import {
  countScheduledAppointments,
  selectRecentNotebooks,
  selectTodayAppointments,
} from "@/features/home/selectors";

export interface HomeAppointment {
  appointment: Appointment;
  student: Student | null;
}

export interface HomeData {
  educator: Educator | undefined;
  todayAppointments: HomeAppointment[];
  scheduledAppointmentsCount: number;
  lastSessions: EducatorLastSession[];
  recentNotebooks: TaskNotebookWithGroups[];
}

export interface HomeQueryResult {
  data: HomeData | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => Promise<unknown[]>;
}

export const homeQueryKeys = {
  educator: ["educator", "me"] as const,
  appointments: ["appointment"] as const,
  students: ["student"] as const,
  lastSessions: ["educator", "last-sessions"] as const,
  notebooks: ["task-notebook"] as const,
};

export async function getLastSessionsOrEmpty(): Promise<EducatorLastSession[]> {
  try {
    return await getLastSessions();
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 404 &&
      error.code === "EDUCATOR_DOES_NOT_HAVE_SESSIONS"
    ) {
      return [];
    }
    throw error;
  }
}

function toHomeData({
  educator,
  appointments,
  students,
  lastSessions,
  notebooks,
}: {
  educator: Educator | undefined;
  appointments: Appointment[];
  students: Student[];
  lastSessions: EducatorLastSession[];
  notebooks: TaskNotebookWithGroups[];
}): HomeData {
  const studentsById = new Map(
    students.map((student) => [student.id, student]),
  );
  const todayAppointments = selectTodayAppointments(appointments).map(
    (appointment) => ({
      appointment,
      student: studentsById.get(appointment.studentId) ?? null,
    }),
  );

  return {
    educator,
    todayAppointments,
    scheduledAppointmentsCount: countScheduledAppointments(
      todayAppointments.map(({ appointment }) => appointment),
    ),
    lastSessions,
    recentNotebooks: selectRecentNotebooks(notebooks),
  };
}

export async function loadHomeData(): Promise<HomeData> {
  const [educator, appointments, students, lastSessions, notebooks] =
    await Promise.all([
      getMe(),
      listAppointments(),
      listStudents(),
      getLastSessionsOrEmpty(),
      listTaskNotebooks(),
    ]);

  return toHomeData({
    educator,
    appointments,
    students,
    lastSessions,
    notebooks,
  });
}

export function useHomeData(): HomeData {
  const educatorQuery = useQuery({
    queryKey: homeQueryKeys.educator,
    queryFn: getMe,
  });
  const appointmentsQuery = useQuery({
    queryKey: homeQueryKeys.appointments,
    queryFn: listAppointments,
  });
  const studentsQuery = useQuery({
    queryKey: homeQueryKeys.students,
    queryFn: listStudents,
  });
  const lastSessionsQuery = useQuery({
    queryKey: homeQueryKeys.lastSessions,
    queryFn: getLastSessionsOrEmpty,
  });
  const notebooksQuery = useQuery({
    queryKey: homeQueryKeys.notebooks,
    queryFn: () => listTaskNotebooks(),
  });

  return toHomeData({
    educator: educatorQuery.data,
    appointments: appointmentsQuery.data ?? [],
    students: studentsQuery.data ?? [],
    lastSessions: lastSessionsQuery.data ?? [],
    notebooks: notebooksQuery.data ?? [],
  });
}

export function useHomeQuery(): HomeQueryResult {
  const educatorQuery = useQuery({
    queryKey: homeQueryKeys.educator,
    queryFn: getMe,
  });
  const appointmentsQuery = useQuery({
    queryKey: homeQueryKeys.appointments,
    queryFn: listAppointments,
  });
  const studentsQuery = useQuery({
    queryKey: homeQueryKeys.students,
    queryFn: listStudents,
  });
  const lastSessionsQuery = useQuery({
    queryKey: homeQueryKeys.lastSessions,
    queryFn: getLastSessionsOrEmpty,
  });
  const notebooksQuery = useQuery({
    queryKey: homeQueryKeys.notebooks,
    queryFn: () => listTaskNotebooks(),
  });
  const queries = [
    educatorQuery,
    appointmentsQuery,
    studentsQuery,
    lastSessionsQuery,
    notebooksQuery,
  ];
  const isPending = queries.some((query) => query.isPending);
  const isError = queries.some((query) => query.isError);
  const hasData = queries.every((query) => query.data !== undefined);

  const data = hasData
    ? (() => {
        const studentsById = new Map(
          studentsQuery.data!.map((student) => [student.id, student]),
        );
        const todayAppointments = selectTodayAppointments(
          appointmentsQuery.data!,
        ).map((appointment) => ({
          appointment,
          student: studentsById.get(appointment.studentId) ?? null,
        }));

        return {
          educator: educatorQuery.data,
          todayAppointments,
          scheduledAppointmentsCount: countScheduledAppointments(
            todayAppointments.map(({ appointment }) => appointment),
          ),
          lastSessions: lastSessionsQuery.data!,
          recentNotebooks: selectRecentNotebooks(notebooksQuery.data!),
        };
      })()
    : undefined;

  return {
    data,
    isPending,
    isError,
    refetch: async () => Promise.all(queries.map((query) => query.refetch())),
  };
}
