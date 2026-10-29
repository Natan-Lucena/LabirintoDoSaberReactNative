import type { Student } from "@/api/types";
import { MOCK_EDUCATOR, MOCK_STUDENTS } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const fields = [
  "name",
  "gender",
  "zipcode",
  "road",
  "housenumber",
  "phonenumber",
  "learningTopics",
  "age",
  "guardianName",
  "guardianPhone",
  "guardianRelationship",
] as const;

registerMockHandler(
  { method: "put", path: "/student/update/:id" },
  ({ body, params }) => {
    const student = MOCK_STUDENTS.find((item) => item.id === params.id);
    if (
      params.id === "student-not-assigned" ||
      (student && student.educatorId !== MOCK_EDUCATOR.id)
    ) {
      throw new MockApiError(400, "STUDENT_NOT_ASSIGNED_TO_CURRENT_EDUCATOR");
    }
    if (!student) throw new MockApiError(404, "STUDENT_NOT_FOUND");
    const input = Object.fromEntries(
      fields.map((key) => [
        key,
        body instanceof FormData
          ? body.get(key)
          : (body as Record<string, unknown> | null)?.[key],
      ]),
    );
    const patch: Partial<Student> = {};
    for (const key of [
      "name",
      "zipcode",
      "road",
      "housenumber",
      "phonenumber",
    ] as const) {
      const value = input[key];
      if (value != null) {
        const min = key === "phonenumber" ? 7 : key === "zipcode" ? 5 : 1;
        const max =
          key === "name" || key === "road"
            ? 100
            : key === "phonenumber"
              ? 15
              : 10;
        if (
          typeof value !== "string" ||
          value.trim().length < min ||
          value.trim().length > max
        )
          throw new MockApiError(400, "INVALID_STUDENT_FORMAT");
        patch[key] = value.trim();
      }
    }
    if (input.age != null) {
      const age = Number(input.age);
      if (!Number.isInteger(age) || age < 1 || age > 50)
        throw new MockApiError(400, "INVALID_STUDENT_FORMAT");
      patch.age = age;
    }
    if (input.gender != null) {
      if (input.gender !== "female" && input.gender !== "male")
        throw new MockApiError(400, "INVALID_STUDENT_FORMAT");
      patch.gender = input.gender;
    }
    if (input.learningTopics != null) {
      let topics: unknown;
      try {
        topics = JSON.parse(String(input.learningTopics));
      } catch {
        throw new MockApiError(400, "INVALID_STUDENT_FORMAT");
      }
      if (
        !Array.isArray(topics) ||
        !topics.length ||
        !topics.every((topic) => typeof topic === "string" && topic.trim())
      )
        throw new MockApiError(400, "INVALID_STUDENT_FORMAT");
      patch.learningTopics = topics;
    }
    for (const key of [
      "guardianName",
      "guardianPhone",
      "guardianRelationship",
    ] as const) {
      const value = input[key];
      if (value == null || value === "") continue;
      const max =
        key === "guardianName" ? 100 : key === "guardianRelationship" ? 50 : 15;
      const min = key === "guardianPhone" ? 7 : 1;
      if (
        typeof value !== "string" ||
        value.trim().length < min ||
        value.trim().length > max ||
        (key === "guardianPhone" && !/^\d+$/.test(value))
      )
        throw new MockApiError(400, "INVALID_STUDENT_FORMAT");
      patch[key] = value.trim();
    }
    Object.assign(student, patch);
    return { status: 200, data: student };
  },
);
