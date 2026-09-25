import type { Gender, Student } from "@/api/types";
import { MOCK_EDUCATOR, MOCK_STUDENTS } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

let nextStudentId = MOCK_STUDENTS.length + 1;

/** O adaptador só faz JSON.parse de corpo string; FormData chega intacto. */
function readField(body: unknown, key: string): unknown {
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return body.get(key);
  }
  if (body && typeof body === "object") {
    return (body as Record<string, unknown>)[key];
  }
  return undefined;
}

function parseLearningTopics(raw: unknown): string[] | undefined {
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) &&
        parsed.every((topic) => typeof topic === "string")
        ? (parsed as string[])
        : undefined;
    } catch {
      return undefined;
    }
  }
  return Array.isArray(raw) ? (raw as string[]) : undefined;
}

function isValidLength(
  value: unknown,
  min: number,
  max: number,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length >= min &&
    value.trim().length <= max
  );
}

registerMockHandler({ method: "post", path: "/student/create" }, ({ body }) => {
  const name = readField(body, "name");
  const ageRaw = readField(body, "age");
  const gender = readField(body, "gender");
  const zipcode = readField(body, "zipcode");
  const road = readField(body, "road");
  const housenumber = readField(body, "housenumber");
  const phonenumber = readField(body, "phonenumber");
  const learningTopics = parseLearningTopics(readField(body, "learningTopics"));

  const age = Number(ageRaw);

  const isValid =
    isValidLength(name, 1, 100) &&
    typeof ageRaw !== "undefined" &&
    Number.isFinite(age) &&
    age >= 1 &&
    age <= 50 &&
    (gender === "female" || gender === "male") &&
    isValidLength(zipcode, 5, 10) &&
    isValidLength(road, 1, 100) &&
    isValidLength(housenumber, 1, 10) &&
    isValidLength(phonenumber, 7, 15) &&
    learningTopics !== undefined &&
    learningTopics.length >= 1;

  if (!isValid) {
    throw new MockApiError(400, "INVALID_STUDENT_FORMAT");
  }

  const student: Student = {
    id: `mock-student-${nextStudentId++}`,
    name: (name as string).trim(),
    age,
    gender: gender as Gender,
    zipcode: (zipcode as string).trim(),
    road: (road as string).trim(),
    housenumber: (housenumber as string).trim(),
    phonenumber: (phonenumber as string).trim(),
    learningTopics: (learningTopics as string[]).map((topic) => topic.trim()),
    createdAt: new Date().toISOString(),
    educatorId: MOCK_EDUCATOR.id,
    photoUrl: null,
    documents: [],
    educators: [MOCK_EDUCATOR.id],
  };
  MOCK_STUDENTS.push(student);

  return { status: 201, data: student };
});

export const studentCreateMockHandlersRegistered = true;
