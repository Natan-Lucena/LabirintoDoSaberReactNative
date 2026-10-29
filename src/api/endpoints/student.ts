import { apiClient } from "@/api/client";
import type { Student } from "@/api/types";

/** GET /student/ */
export async function listStudents(): Promise<Student[]> {
  const response =
    await apiClient.get<(Student & { educators?: unknown })[]>("/student/");

  return response.data.map(({ educators: _educators, ...student }) => student);
}
