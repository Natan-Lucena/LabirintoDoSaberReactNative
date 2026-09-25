import { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vitest";

import "@/mocks/handlers/appointment";
import "@/mocks/handlers/content";
import "@/mocks/handlers/educator";
import "@/mocks/handlers/student";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_APPOINTMENTS,
  MOCK_STUDENTS,
  setMockHomeScenario,
} from "@/mocks/fixtures";

function config(url: string): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
    baseURL: "http://mock.local",
    method: "get",
    url,
  } as InternalAxiosRequestConfig;
}

describe("handlers mockados da Home (G-29)", () => {
  afterEach(() => {
    setMockHomeScenario("default");
  });

  it("GET /appointment/ retorna dados ficticios do dia", async () => {
    await expect(mockAdapter(config("/appointment/"))).resolves.toMatchObject({
      status: 200,
      data: MOCK_APPOINTMENTS,
    });
  });

  it("GET /appointment/ permite o cenario sem agendamentos", async () => {
    setMockHomeScenario("no-appointments");
    await expect(mockAdapter(config("/appointment/"))).resolves.toMatchObject({
      status: 200,
      data: [],
    });
  });

  it("GET /student/ retorna os cinco alunos ficticios", async () => {
    await expect(mockAdapter(config("/student/"))).resolves.toMatchObject({
      status: 200,
      data: MOCK_STUDENTS,
    });
  });

  it("GET /educator/get-last-sessions retorna a lista padrao", async () => {
    await expect(
      mockAdapter(config("/educator/get-last-sessions")),
    ).resolves.toMatchObject({ status: 200 });
  });

  it("GET /educator/get-last-sessions permite o cenario 404", async () => {
    setMockHomeScenario("no-sessions");
    await expect(
      mockAdapter(config("/educator/get-last-sessions")),
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("GET /task-notebook/ retorna cadernos na ordem registrada", async () => {
    await expect(mockAdapter(config("/task-notebook/"))).resolves.toMatchObject(
      {
        status: 200,
      },
    );
  });
});
