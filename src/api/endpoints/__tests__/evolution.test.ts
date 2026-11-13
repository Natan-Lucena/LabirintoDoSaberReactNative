import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  evolutionQueryKeys,
  getEvolutionContext,
  getSessionEvolution,
  listPendingEvolutions,
  listSessionEvolutions,
} from "@/api/endpoints/evolution";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_EVOLUTION_ID,
  MOCK_EVOLUTION_SESSION_FOREIGN,
  MOCK_EVOLUTION_SESSION_OLD,
  MOCK_EVOLUTION_SESSION_PE,
  MOCK_EVOLUTION_SESSION_RECENT,
  MOCK_FOREIGN_EVOLUTION_ID,
} from "@/mocks/handlers/evolution";
import { MOCK_FOREIGN_STUDENT_ID } from "@/mocks/handlers/plans";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("leitura da evolução pelo apiClient (API-05, leva 1)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("monta chaves de query estáveis e distintas", () => {
    expect(evolutionQueryKeys.all).toEqual(["session-evolution"]);
    expect(evolutionQueryKeys.context("s1")).toEqual([
      "session-evolution",
      "context",
      "s1",
    ]);
    expect(evolutionQueryKeys.detail("e1")).toEqual([
      "session-evolution",
      "detail",
      "e1",
    ]);
    expect(evolutionQueryKeys.pending()).toEqual([
      "session-evolution",
      "pending",
      {},
    ]);
    expect(evolutionQueryKeys.list({ studentId: "x" })).toEqual([
      "session-evolution",
      "list",
      { studentId: "x" },
    ]);
  });

  describe("getEvolutionContext", () => {
    it("traz sessão, plano PE e critérios sugeridos sem metas encerradas", async () => {
      const context = await getEvolutionContext(MOCK_EVOLUTION_SESSION_PE);

      expect(context.session.id).toBe(MOCK_EVOLUTION_SESSION_PE);
      expect(context.session.studentName).toBeTruthy();
      expect(context.session.durationMinutes).toBeGreaterThan(0);
      expect(context.plan?.type).toBe("PE");
      expect(context.suggestedCriteria.length).toBeGreaterThan(0);
      for (const criterion of context.suggestedCriteria) {
        expect(["NOT_STARTED", "IN_PROGRESS"]).toContain(criterion.goalStatus);
      }
      expect(context.existingEvolutionId).toBeUndefined();
    });

    it("cai no PDI ativo quando a sessão não tem PE (EV-12, G-57 revisto)", async () => {
      const context = await getEvolutionContext("mock-session-1");

      expect(context.plan).toMatchObject({ id: "mock-plan-1", type: "PDI" });
      for (const criterion of context.suggestedCriteria) {
        expect(["NOT_STARTED", "IN_PROGRESS"]).toContain(criterion.goalStatus);
      }
    });

    it("informa a evolução já existente da sessão", async () => {
      const context = await getEvolutionContext("mock-session-2");

      expect(context.existingEvolutionId).toBe(MOCK_EVOLUTION_ID);
    });

    it("erros: 409 sessão aberta, 404 inexistente, 403 de outro educador", async () => {
      await expect(
        getEvolutionContext("mock-open-session"),
      ).rejects.toMatchObject({ status: 409, code: "SESSION_NOT_FINISHED" });
      await expect(getEvolutionContext("nao-existe")).rejects.toMatchObject({
        status: 404,
        code: "SESSION_NOT_FOUND",
      });
      await expect(
        getEvolutionContext(MOCK_EVOLUTION_SESSION_FOREIGN),
      ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
    });
  });

  describe("listSessionEvolutions", () => {
    it("lista resumos, mais recente primeiro, só do educador", async () => {
      const list = await listSessionEvolutions();

      expect(list.length).toBeGreaterThan(0);
      expect(list.some((item) => item.id === MOCK_FOREIGN_EVOLUTION_ID)).toBe(
        false,
      );
      const dates = list.map((item) => item.sessionDate);
      expect(dates).toEqual([...dates].sort().reverse());
      const item = list.find((entry) => entry.id === MOCK_EVOLUTION_ID)!;
      expect(item.studentName).toBeTruthy();
      expect(item.excerpt.length).toBeLessThanOrEqual(200);
      expect(item.criteriaCount).toBeGreaterThanOrEqual(item.achievedCount);
      expect(item).not.toHaveProperty("criteria");
    });

    it("filtra por paciente e por período, e respeita limit", async () => {
      const all = await listSessionEvolutions();
      const studentId = all[0]!.studentId;

      const byStudent = await listSessionEvolutions({ studentId });
      expect(byStudent.every((item) => item.studentId === studentId)).toBe(
        true,
      );

      const none = await listSessionEvolutions({
        from: "2000-01-01",
        to: "2000-01-02",
      });
      expect(none).toEqual([]);

      const one = await listSessionEvolutions({ limit: 1 });
      expect(one).toHaveLength(1);
    });

    it("erros: 400 em filtros inválidos e 403 em paciente de outro educador", async () => {
      await expect(listSessionEvolutions({ limit: 0 })).rejects.toMatchObject({
        status: 400,
      });
      await expect(listSessionEvolutions({ limit: 101 })).rejects.toMatchObject(
        { status: 400 },
      );
      await expect(
        listSessionEvolutions({ from: "12/11/2026" }),
      ).rejects.toMatchObject({ status: 400 });
      await expect(
        listSessionEvolutions({ studentId: MOCK_FOREIGN_STUDENT_ID }),
      ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
    });
  });

  describe("getSessionEvolution", () => {
    it("devolve a evolução completa", async () => {
      const evolution = await getSessionEvolution(MOCK_EVOLUTION_ID);

      expect(evolution.id).toBe(MOCK_EVOLUTION_ID);
      expect(evolution.sessionId).toBe("mock-session-2");
      expect(evolution.criteria.length).toBeGreaterThan(0);
      expect(evolution.descriptiveRecord).toBeTruthy();
      expect(evolution.sessionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("erros: 404 EVOLUTION_NOT_FOUND e 403 UNAUTHORIZED", async () => {
      await expect(getSessionEvolution("nao-existe")).rejects.toMatchObject({
        status: 404,
        code: "EVOLUTION_NOT_FOUND",
      });
      await expect(
        getSessionEvolution(MOCK_FOREIGN_EVOLUTION_ID),
      ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
    });
  });

  describe("listPendingEvolutions", () => {
    it("lista sessões finalizadas sem evolução dos últimos 30 dias", async () => {
      const pending = await listPendingEvolutions();
      const ids = pending.map((item) => item.sessionId);

      expect(ids).toContain(MOCK_EVOLUTION_SESSION_RECENT);
      expect(ids).not.toContain(MOCK_EVOLUTION_SESSION_OLD);
      expect(ids).not.toContain("mock-session-2");
      expect(ids).not.toContain("mock-open-session");
      expect(ids).not.toContain(MOCK_EVOLUTION_SESSION_FOREIGN);
      const recent = pending.find(
        (item) => item.sessionId === MOCK_EVOLUTION_SESSION_RECENT,
      )!;
      expect(recent.studentName).toBeTruthy();
      expect(recent.sessionName).toBeTruthy();
      expect(recent.finishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("amplia a janela com days e valida 1 a 90", async () => {
      const wide = await listPendingEvolutions({ days: 90 });
      expect(wide.map((item) => item.sessionId)).toContain(
        MOCK_EVOLUTION_SESSION_OLD,
      );

      await expect(listPendingEvolutions({ days: 0 })).rejects.toMatchObject({
        status: 400,
      });
      await expect(listPendingEvolutions({ days: 91 })).rejects.toMatchObject({
        status: 400,
      });
    });
  });
});
