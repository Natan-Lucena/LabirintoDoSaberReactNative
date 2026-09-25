import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  generateToken,
  getLastSessions,
  getMe,
  signIn,
  updatePassword,
} from "@/api/endpoints/educator";
import { listStudents } from "@/api/endpoints/student";
import {
  getTaskById,
  listTaskGroupsByEducator,
  listTaskNotebooks,
  listTasks,
} from "@/api/endpoints/content";
import {
  addSessionObservation,
  answerSession,
  finishSession,
  listSessionsByStudent,
  startSession,
} from "@/api/endpoints/session";
import {
  createAppointment,
  deleteAppointment,
  listAppointments,
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

interface RecordedRequest {
  method?: string;
  url?: string;
  data?: unknown;
  params?: unknown;
}

function setAdapter(responseData: unknown): { recorded: RecordedRequest } {
  const recorded: RecordedRequest = {};
  const handler: AxiosAdapter = async (config) => {
    recorded.method = config.method;
    recorded.url = config.url;
    recorded.data =
      typeof config.data === "string" && config.data.length > 0
        ? JSON.parse(config.data)
        : config.data;
    recorded.params = config.params;

    return {
      config: config as InternalAxiosRequestConfig,
      data: responseData,
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };
  apiClient.defaults.adapter = handler;

  return { recorded };
}

afterEach(() => {
  apiClient.defaults.adapter = undefined;
});

describe("endpoints (fase vermelha — stubs sem comportamento)", () => {
  it.each([
    {
      name: "signIn",
      call: () => signIn({ email: "a@a.com", password: "123456" }),
      method: "post",
      url: "/educator/sign-in",
      body: { email: "a@a.com", password: "123456" },
      response: { token: "jwt" },
    },
    {
      name: "getMe",
      call: () => getMe(),
      method: "get",
      url: "/educator/me",
      body: undefined,
      response: { id: "1", name: "Ed", email: "a@a.com" },
    },
    {
      name: "generateToken",
      call: () => generateToken({ educatorEmail: "a@a.com" }),
      method: "put",
      url: "/educator/generate-token",
      body: { educatorEmail: "a@a.com" },
      response: undefined,
    },
    {
      name: "updatePassword",
      call: () => updatePassword({ email: "a@a.com", newPassword: "abcdef" }),
      method: "post",
      url: "/educator/update-password",
      body: { email: "a@a.com", newPassword: "abcdef" },
      response: undefined,
    },
    {
      name: "getLastSessions",
      call: () => getLastSessions(),
      method: "get",
      url: "/educator/get-last-sessions",
      body: undefined,
      response: [{ sessionName: "Sessão 1" }],
    },
    {
      name: "listStudents",
      call: () => listStudents(),
      method: "get",
      url: "/student/",
      body: undefined,
      response: [],
    },
    {
      name: "listTaskNotebooks",
      call: () => listTaskNotebooks({ descriptionContains: "leitura" }),
      method: "get",
      url: "/task-notebook/",
      body: undefined,
      response: [],
    },
    {
      name: "listTaskGroupsByEducator",
      call: () => listTaskGroupsByEducator(),
      method: "get",
      url: "/task-group/list-by-educator",
      body: undefined,
      response: [],
    },
    {
      name: "listTasks",
      call: () => listTasks({ promptContains: "abc" }),
      method: "get",
      url: "/task/",
      body: undefined,
      response: [],
    },
    {
      name: "getTaskById",
      call: () => getTaskById("task-1"),
      method: "get",
      url: "/task/task-1",
      body: undefined,
      response: { id: "task-1" },
    },
    {
      name: "startSession",
      call: () => startSession({ studentId: "s1", name: "Sessão" }),
      method: "post",
      url: "/task-notebook-session/start",
      body: { studentId: "s1", name: "Sessão" },
      response: { id: "sess-1" },
    },
    {
      name: "answerSession",
      call: () =>
        answerSession({
          sessionId: "sess-1",
          taskId: "task-1",
          selectedAlternativeId: "alt-1",
          timeToAnswer: 12,
        }),
      method: "post",
      url: "/task-notebook-session/answer",
      body: {
        sessionId: "sess-1",
        taskId: "task-1",
        selectedAlternativeId: "alt-1",
        timeToAnswer: 12,
      },
      response: { id: "sess-1" },
    },
    {
      name: "finishSession",
      call: () => finishSession({ sessionId: "sess-1" }),
      method: "post",
      url: "/task-notebook-session/finish",
      body: { sessionId: "sess-1" },
      response: { id: "sess-1" },
    },
    {
      name: "addSessionObservation",
      call: () =>
        addSessionObservation({
          sessionId: "sess-1",
          observation: "obs",
        }),
      method: "post",
      url: "/task-notebook-session/observation",
      body: { sessionId: "sess-1", observation: "obs" },
      response: { id: "sess-1" },
    },
    {
      name: "listSessionsByStudent",
      call: () => listSessionsByStudent("student-1"),
      method: "get",
      url: "/task-notebook-session/student/student-1",
      body: undefined,
      response: [],
    },
    {
      name: "listAppointments",
      call: () => listAppointments(),
      method: "get",
      url: "/appointment/",
      body: undefined,
      response: [],
    },
    {
      name: "createAppointment",
      call: () =>
        createAppointment({
          studentId: "s1",
          scheduledAt: "2026-09-24T10:00:00.000Z",
        }),
      method: "post",
      url: "/appointment/",
      body: { studentId: "s1", scheduledAt: "2026-09-24T10:00:00.000Z" },
      response: { id: "appt-1" },
    },
    {
      name: "updateAppointment",
      call: () => updateAppointment("appt-1", { observation: null }),
      method: "put",
      url: "/appointment/appt-1",
      body: { observation: null },
      response: { id: "appt-1" },
    },
    {
      name: "deleteAppointment",
      call: () => deleteAppointment("appt-1"),
      method: "delete",
      url: "/appointment/appt-1",
      body: undefined,
      response: undefined,
    },
  ])(
    "$name chama $method $url com o corpo esperado e retorna data",
    async ({ call, method, url, body, response }) => {
      const { recorded } = setAdapter(response);

      const result = await call();

      expect(recorded.method).toBe(method);
      expect(recorded.url).toBe(url);
      if (body !== undefined) {
        expect(recorded.data).toEqual(body);
      }
      expect(result).toEqual(response);
    },
  );
});
