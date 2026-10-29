import { apiClient } from "@/api/client";
import type { Gender, Student } from "@/api/types";

export interface CreateStudentInput {
  name: string;
  age: number;
  gender: Gender;
  zipcode: string;
  road: string;
  housenumber: string;
  phonenumber: string;
  learningTopics: string[];
  guardianName?: string;
  guardianPhone?: string;
  guardianRelationship?: string;
}

/** POST /student/create (multipart). */
export async function createStudent(
  input: CreateStudentInput,
): Promise<Student> {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("age", String(input.age));
  formData.append("gender", input.gender);
  formData.append("zipcode", input.zipcode);
  formData.append("road", input.road);
  formData.append("housenumber", input.housenumber);
  formData.append("phonenumber", input.phonenumber);
  formData.append("learningTopics", JSON.stringify(input.learningTopics));
  if (input.guardianName?.trim())
    formData.append("guardianName", input.guardianName.trim());
  const guardianPhone = input.guardianPhone?.replace(/\D/g, "");
  if (guardianPhone) formData.append("guardianPhone", guardianPhone);
  if (input.guardianRelationship?.trim())
    formData.append("guardianRelationship", input.guardianRelationship.trim());

  const response = await apiClient.post<Student & { educators?: unknown }>(
    "/student/create",
    formData,
  );

  const { educators: _educators, ...student } = response.data;
  return student;
}
