import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  isMultipleChoice,
  listRecommendedTasks,
  listTaskCatalog,
  listTaskSkills,
  duplicateTask,
  taskCatalogQueryKeys,
  taskFormat,
  taskSource,
} from "@/api/endpoints/task-catalog";
import type { PrintableContent, Task, TaskType } from "@/api/types";
import { MOCK_STUDENTS } from "@/mocks/fixtures";
import { MOCK_LIBRARY_TASKS } from "@/mocks/fixtures-task-catalog";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/install";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

const NEW_TYPES: TaskType[] = [
  "wordBuilder",
  "colorMatch",
  "memoryGame",
  "printable",
];

describe("banco de atividades pelo apiClient (API-07, leva 1)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("monta chaves de query sob o prefixo task", () => {
    expect(taskCatalogQueryKeys.list({ search: "a" })).toEqual([
      "task",
      "catalog",
      { search: "a" },
    ]);
    expect(taskCatalogQueryKeys.skills).toEqual(["task", "skills"]);
    expect(taskCatalogQueryKeys.recommended("student-1")).toEqual([
      "task",
      "recommended",
      "student-1",
    ]);
  });

  describe("auxiliares", () => {
    const base: Omit<Task, "type"> = {
      id: "t",
      category: "reading",
      prompt: "p",
      alternatives: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    it("taskFormat usa o campo e, na falta dele, deriva do tipo", () => {
      expect(taskFormat({ ...base, type: "printable" })).toBe("PRINTABLE");
      expect(taskFormat({ ...base, type: "wordBuilder" })).toBe("INTERACTIVE");
      expect(taskFormat({ ...base, type: "multipleChoice" })).toBe(
        "INTERACTIVE",
      );
      expect(
        taskFormat({ ...base, type: "wordBuilder", format: "PRINTABLE" }),
      ).toBe("PRINTABLE");
    });

    it("taskSource assume EDUCATOR quando ausente", () => {
      expect(taskSource({ ...base, type: "multipleChoice" })).toBe("EDUCATOR");
      expect(
        taskSource({ ...base, type: "multipleChoice", source: "LIBRARY" }),
      ).toBe("LIBRARY");
    });

    it("isMultipleChoice só vale para os dois tipos de múltipla escolha", () => {
      expect(isMultipleChoice("multipleChoice")).toBe(true);
      expect(isMultipleChoice("multipleChoiceWithMedia")).toBe(true);
      for (const type of NEW_TYPES) expect(isMultipleChoice(type)).toBe(false);
    });
  });

  describe("GET /task/catalog", () => {
    it("lista a primeira página com padrão de 20 itens", async () => {
      const page = await listTaskCatalog({});

      expect(page.items.length).toBeGreaterThan(0);
      expect(page.items.length).toBeLessThanOrEqual(20);
      expect(page.items[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          type: expect.any(String),
          format: expect.stringMatching(/^(INTERACTIVE|PRINTABLE)$/),
          source: expect.stringMatching(/^(EDUCATOR|LIBRARY)$/),
          title: expect.any(String),
          tone: expect.any(String),
        }),
      );
    });

    it("filtra por format, type, source, category e skill", async () => {
      const printable = await listTaskCatalog({ format: "PRINTABLE" });
      expect(printable.items.length).toBeGreaterThan(0);
      expect(printable.items.every((i) => i.type === "printable")).toBe(true);

      const library = await listTaskCatalog({ source: "LIBRARY", limit: 50 });
      expect(library.items.every((i) => i.source === "LIBRARY")).toBe(true);

      const educator = await listTaskCatalog({
        source: "EDUCATOR",
        limit: 50,
      });
      expect(educator.items.length).toBeGreaterThan(0);
      expect(educator.items.every((i) => i.source === "EDUCATOR")).toBe(true);

      const word = await listTaskCatalog({ type: "wordBuilder", limit: 50 });
      expect(word.items.length).toBeGreaterThanOrEqual(4);
      expect(word.items.every((i) => i.type === "wordBuilder")).toBe(true);

      const reading = await listTaskCatalog({
        category: "reading",
        limit: 50,
      });
      expect(reading.items.length).toBeGreaterThan(0);
      expect(reading.items.every((i) => i.category === "reading")).toBe(true);

      const skills = await listTaskSkills();
      const bySkill = await listTaskCatalog({
        skill: skills[0].code,
        limit: 50,
      });
      expect(bySkill.items.length).toBeGreaterThan(0);
      expect(
        bySkill.items.every((i) =>
          i.skills.some((s) => s.code === skills[0].code),
        ),
      ).toBe(true);
    });

    it("busca ignorando acento e maiúscula", async () => {
      const withAccent = await listTaskCatalog({ search: "PÃO", limit: 50 });
      const withoutAccent = await listTaskCatalog({
        search: "pao",
        limit: 50,
      });

      expect(withAccent.items.length).toBeGreaterThan(0);
      expect(withoutAccent.items.map((i) => i.id)).toEqual(
        withAccent.items.map((i) => i.id),
      );
      expect(withAccent.items.some((i) => i.title === "PÃO")).toBe(true);

      const none = await listTaskCatalog({ search: "zzzxyz" });
      expect(none.items).toEqual([]);
    });

    it("pagina por cursor sem repetir itens", async () => {
      const first = await listTaskCatalog({ limit: 5 });
      expect(first.items).toHaveLength(5);
      expect(first.nextCursor).toBe("5");

      const second = await listTaskCatalog({ limit: 5, cursor: "5" });
      const ids = new Set(first.items.map((i) => i.id));
      expect(second.items.some((i) => ids.has(i.id))).toBe(false);

      const all = await listTaskCatalog({ limit: 50 });
      expect(all.nextCursor).toBeUndefined();
    });

    it("rejeita limit fora de 1 a 50 com 400", async () => {
      await expect(listTaskCatalog({ limit: 0 })).rejects.toMatchObject({
        status: 400,
      });
      await expect(listTaskCatalog({ limit: 51 })).rejects.toMatchObject({
        status: 400,
      });
    });

    it("rejeita cursor inválido com INVALID_CURSOR", async () => {
      await expect(listTaskCatalog({ cursor: "abc" })).rejects.toMatchObject({
        status: 400,
        code: "INVALID_CURSOR",
        message: "Não foi possível carregar mais itens. Atualize a lista.",
      });
    });
  });

  describe("GET /task/skills", () => {
    it("devolve 6 habilidades com code, label e learningTopics", async () => {
      const skills = await listTaskSkills();

      expect(skills).toHaveLength(6);
      for (const skill of skills) {
        expect(skill.code).toMatch(/^[A-Z_]+$/);
        expect(skill.label).toBeTruthy();
        expect(skill.learningTopics.length).toBeGreaterThan(0);
      }
      expect(new Set(skills.map((s) => s.code)).size).toBe(6);
    });
  });

  describe("GET /task/recommended", () => {
    it("recomenda até 6 atividades com reason para um paciente conhecido", async () => {
      const items = await listRecommendedTasks("student-1");

      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThanOrEqual(6);
      for (const item of items) {
        expect(item.reason).toMatch(/dificuldade mapeada/);
        expect(item.reason.length).toBeLessThanOrEqual(120);
      }
    });

    it("devolve lista vazia para paciente sem learningTopics", async () => {
      const student = MOCK_STUDENTS.find((s) => s.id === "student-5")!;
      const original = student.learningTopics;
      student.learningTopics = [];
      try {
        expect(await listRecommendedTasks("student-5")).toEqual([]);
      } finally {
        student.learningTopics = original;
      }
    });

    it("responde 404 STUDENT_NOT_FOUND para paciente desconhecido", async () => {
      await expect(listRecommendedTasks("desconhecido")).rejects.toMatchObject({
        status: 404,
        code: "STUDENT_NOT_FOUND",
      });
    });

    it("responde 400 sem studentId", async () => {
      await expect(listRecommendedTasks("")).rejects.toMatchObject({
        status: 400,
      });
    });
  });

  describe("GET /task/:id e GET /task/", () => {
    it("devolve a tarefa nova com content", async () => {
      const catalog = await listTaskCatalog({ type: "wordBuilder", limit: 50 });
      const { data } = await apiClient.get<Task>(
        `/task/${catalog.items[0].id}`,
      );

      expect(data.type).toBe("wordBuilder");
      expect(data.content?.kind).toBe("wordBuilder");
      expect(data.format).toBe("INTERACTIVE");
      expect(data.alternatives).toEqual([]);
    });

    it("GET /task/ inclui as do educador dos tipos novos, com os campos novos", async () => {
      const { data } = await apiClient.get<Task[]>("/task/");

      for (const type of NEW_TYPES) {
        const task = data.find((t) => t.type === type);
        expect(task, type).toBeDefined();
        expect(task?.source).toBe("EDUCATOR");
        expect(task?.content?.kind).toBe(type);
      }
      expect(data.every((t) => t.source !== "LIBRARY")).toBe(true);
    });
  });

  describe("POST /task/:id/duplicate (ATV-09)", () => {
    it("cria uma cópia do educador com novo id", async () => {
      const copy = await duplicateTask(MOCK_LIBRARY_TASKS[0]!.id);

      expect(copy.id).not.toBe(MOCK_LIBRARY_TASKS[0]!.id);
      expect(copy.source).toBe("EDUCATOR");
      expect(copy.type).toBe(MOCK_LIBRARY_TASKS[0]!.type);
    });

    it("404 TASK_NOT_FOUND para id desconhecido", async () => {
      await expect(duplicateTask("nao-existe")).rejects.toMatchObject({
        code: "TASK_NOT_FOUND",
      });
    });
  });

  describe("biblioteca fictícia (AC-API-07-04)", () => {
    it("tem ao menos uma atividade de cada tipo novo", async () => {
      const library = await listTaskCatalog({ source: "LIBRARY", limit: 50 });
      for (const type of NEW_TYPES) {
        expect(
          library.items.some((i) => i.type === type),
          type,
        ).toBe(true);
      }
      expect(library.items.length).toBe(MOCK_LIBRARY_TASKS.length);
    });

    it("tem um imprimível de cada layout", () => {
      const layouts = MOCK_LIBRARY_TASKS.filter(
        (t) => t.type === "printable",
      ).map((t) => (t.content as PrintableContent).layout);

      expect(new Set(layouts)).toEqual(new Set(["LIST", "GRID", "SEQUENCE"]));
    });

    it("segue as quantidades do card", () => {
      const count = (type: TaskType) =>
        MOCK_LIBRARY_TASKS.filter((t) => t.type === type).length;
      expect(count("wordBuilder")).toBe(3);
      expect(count("colorMatch")).toBe(3);
      expect(count("memoryGame")).toBe(3);
      expect(count("printable")).toBe(5);
      expect(
        MOCK_LIBRARY_TASKS.filter((t) => isMultipleChoice(t.type)),
      ).toHaveLength(2);
      expect(MOCK_LIBRARY_TASKS.every((t) => t.source === "LIBRARY")).toBe(
        true,
      );
    });
  });
});
