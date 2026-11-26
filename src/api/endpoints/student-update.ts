import { apiClient } from "@/api/client";
import type { CreateStudentInput } from "./student-create";
import type { Student } from "@/api/types";

type GuardianField = "guardianName" | "guardianPhone" | "guardianRelationship";

/**
 * `null` nos campos do responsável apaga o valor (PP-05): no multipart vai
 * como string vazia, que o backend entende como "apagar" (Q8).
 */
export type UpdateStudentInput = Partial<
  Omit<CreateStudentInput, GuardianField>
> & { [K in GuardianField]?: string | null };

/** PUT /student/update/:id (multipart; only supplied fields). */
export async function updateStudent(
  id: string,
  input: UpdateStudentInput,
): Promise<Student> {
  const formData = new FormData();
  for (const key of [
    "name",
    "gender",
    "zipcode",
    "road",
    "housenumber",
    "phonenumber",
  ] as const) {
    const value = input[key];
    if (value !== undefined) formData.append(key, value.trim());
  }
  for (const key of ["guardianName", "guardianRelationship"] as const) {
    const value = input[key];
    if (value !== undefined) formData.append(key, value?.trim() ?? "");
  }
  if (input.age !== undefined) formData.append("age", String(input.age));
  if (input.learningTopics !== undefined)
    formData.append("learningTopics", JSON.stringify(input.learningTopics));
  if (input.guardianPhone !== undefined)
    formData.append(
      "guardianPhone",
      input.guardianPhone?.replace(/\D/g, "") ?? "",
    );

  const response = await apiClient.put<Student & { educators?: unknown }>(
    `/student/update/${encodeURIComponent(id)}`,
    formData,
  );
  const { educators: _educators, ...student } = response.data;
  return student;
}
