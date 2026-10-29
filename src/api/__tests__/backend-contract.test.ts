import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { listStudents } from "@/api/endpoints/student";
import { createStudent } from "@/api/endpoints/student-create";
import {
  createAppointment,
  updateAppointment,
} from "@/api/endpoints/appointment";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        appEnvironment: "development",
        apiBaseUrl: "http://10.0.2.2:3000",
      },
    },
  },
}));

const studentInput = {
  name: "Lia",
  age: 8,
  gender: "female" as const,
  zipcode: "01000-000",
  road: "Rua A",
  housenumber: "1",
  phonenumber: "11999990000",
  learningTopics: ["leitura"],
};

function capture(data: unknown) {
  let body: unknown;
  apiClient.defaults.adapter = (async (config) => {
    body = config.data;
    return {
      config: config as InternalAxiosRequestConfig,
      data,
      headers: {},
      status: 200,
      statusText: "OK",
    };
  }) as AxiosAdapter;
  return () => body;
}

afterEach(() => {
  apiClient.defaults.adapter = undefined;
});

describe("contrato do backend de 2026-10-29", () => {
  it("remove educators da lista antes do cache", async () => {
    capture([{ id: "s1", educators: [{ password: "secret" }] }]);
    expect(await listStudents()).toEqual([{ id: "s1" }]);
  });

  it("remove educators da resposta de criação", async () => {
    capture({ id: "s1", educators: [{ password: "secret" }] });
    expect(await createStudent(studentInput)).toEqual({ id: "s1" });
  });

  it("envia responsáveis só quando preenchidos e telefone só com dígitos", async () => {
    const body = capture({ id: "s1" });
    await createStudent(studentInput);
    const empty = body() as FormData;
    expect(empty.has("guardianName")).toBe(false);
    expect(empty.has("guardianPhone")).toBe(false);
    expect(empty.has("guardianRelationship")).toBe(false);

    await createStudent({
      ...studentInput,
      guardianName: "Ana",
      guardianPhone: "(11) 99999-0000",
      guardianRelationship: "Mãe",
    });
    const filled = body() as FormData;
    expect(filled.get("guardianName")).toBe("Ana");
    expect(filled.get("guardianPhone")).toBe("11999990000");
    expect(filled.get("guardianRelationship")).toBe("Mãe");
  });

  it("normaliza scheduledAt de POST e PUT para UTC", async () => {
    const body = capture({ id: "a1" });
    await createAppointment({
      studentId: "s1",
      scheduledAt: "2026-11-03T10:00:00-03:00",
    });
    expect(JSON.parse(body() as string).scheduledAt).toBe(
      "2026-11-03T13:00:00.000Z",
    );
    await updateAppointment("a1", { scheduledAt: "2026-11-03T10:00:00-03:00" });
    expect(JSON.parse(body() as string).scheduledAt).toBe(
      "2026-11-03T13:00:00.000Z",
    );
  });
});
