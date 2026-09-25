import type { Student } from "@/api/types";

export const PAGE_SIZE = 10;

const AVATAR_BACKGROUND_COLORS = [
  "#E94B8F",
  "#9B6DD6",
  "#4A90E2",
  "#50C878",
] as const;

export function avatarBackgroundColorForIndex(index: number): string {
  return AVATAR_BACKGROUND_COLORS[index % AVATAR_BACKGROUND_COLORS.length];
}

export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function sortByNameAsc(students: Student[]): Student[] {
  return [...students].sort((a, b) =>
    normalizeText(a.name).localeCompare(normalizeText(b.name)),
  );
}

export function filterBySearch(students: Student[], query: string): Student[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return students;
  }
  return students.filter((student) =>
    normalizeText(student.name).includes(normalizedQuery),
  );
}

export interface PaginatedResult {
  pageItems: Student[];
  totalPages: number;
}

export function paginate(
  students: Student[],
  page: number,
  pageSize: number = PAGE_SIZE,
): PaginatedResult {
  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    pageItems: students.slice(start, start + pageSize),
    totalPages,
  };
}
