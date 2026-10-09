import { useQuery } from "@tanstack/react-query";

import { listAppointments } from "@/api/endpoints/appointment";
import { getMe } from "@/api/endpoints/educator";
import { listStudents } from "@/api/endpoints/student";
import type { Appointment, Educator, Student } from "@/api/types";
import { selectTodayAppointments } from "@/features/home/selectors";

export interface HomeAppointment {
  appointment: Appointment;
  student: Student | null;
}

export interface HomeData {
  educator: Educator | undefined;
  todayAppointments: HomeAppointment[];
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
};

function toHomeData({
  educator,
  appointments,
  students,
}: {
  educator: Educator | undefined;
  appointments: Appointment[];
  students: Student[];
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
  };
}

export async function loadHomeData(): Promise<HomeData> {
  const [educator, appointments, students] = await Promise.all([
    getMe(),
    listAppointments(),
    listStudents(),
  ]);

  return toHomeData({
    educator,
    appointments,
    students,
  });
}

export function useHomeData(): HomeData {
  const educatorQuery = useQuery({
    queryKey: homeQueryKeys.educator,
    queryFn: () => getMe(),
  });
  const appointmentsQuery = useQuery({
    queryKey: homeQueryKeys.appointments,
    queryFn: listAppointments,
  });
  const studentsQuery = useQuery({
    queryKey: homeQueryKeys.students,
    queryFn: listStudents,
  });
  return toHomeData({
    educator: educatorQuery.data,
    appointments: appointmentsQuery.data ?? [],
    students: studentsQuery.data ?? [],
  });
}

export function useHomeQuery(): HomeQueryResult {
  const educatorQuery = useQuery({
    queryKey: homeQueryKeys.educator,
    queryFn: () => getMe(),
  });
  const appointmentsQuery = useQuery({
    queryKey: homeQueryKeys.appointments,
    queryFn: listAppointments,
  });
  const studentsQuery = useQuery({
    queryKey: homeQueryKeys.students,
    queryFn: listStudents,
  });
  const queries = [educatorQuery, appointmentsQuery, studentsQuery];
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
