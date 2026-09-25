import { apiClient } from "@/api/client";
import type { Student } from "@/api/types";

/** GET /student/ */
export async function listStudents(): Promise<Student[]> {
  const response = await apiClient.get<Student[]>("/student/");

  return response.data;
}
