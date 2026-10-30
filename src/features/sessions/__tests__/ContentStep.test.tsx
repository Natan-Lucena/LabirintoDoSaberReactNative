import { BackHandler } from "react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { act } from "@testing-library/react-native";

import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { createQueryClient } from "@/api/query-client";
import {
  listTaskGroupsByEducator,
  listTaskNotebooks,
  listTasks,
} from "@/api/endpoints/content";
import { startSession } from "@/api/endpoints/session";
import { ApiError } from "@/api/errors";
import { SessionFlowInvalidTransitionError } from "@/stores/session-flow";
import type { TaskGroup, TaskNotebookWithGroups } from "@/api/types";
import { ContentStep, normalizeForSearch } from "../ContentStep";

const push = vi.fn();
const back = vi.fn();
vi.mock("expo-router", () => ({
  useRouter: () => ({ push, back }),
}));

vi.mock("@/api/endpoints/content", () => ({
  listTaskNotebooks: vi.fn(),
  listTaskGroupsByEducator: vi.fn(),
  listTasks: vi.fn(),
}));

vi.mock("@/api/endpoints/session", () => ({
  listSessionsByStudent: vi.fn(),
  startSession: vi.fn(),
}));

const configure = vi.fn().mockResolvedValue(undefined);
const requestStart = vi.fn().mockResolvedValue(undefined);
const confirmStart = vi.fn().mockResolvedValue(undefined);
const markStartUncertain = vi.fn().mockResolvedValue(undefined);
const failStart = vi.fn().mockResolvedValue(undefined);
const discard = vi.fn().mockResolvedValue(undefined);
const selectStudent = vi.fn().mockResolvedValue(undefined);
const setAppointmentId = vi.fn().mockResolvedValue(undefined);
const cancel = vi.fn().mockResolvedValue(undefined);
let mockAppointmentId: string | null = null;
let mockStep = "configured";
const mockStudent = { id: "student-1", name: "Ana Souza" };
let mockSessionName: string | null = null;
let mockContent: {
  kind: "notebook" | "group" | "task";
  id: string;
  name: string;
} | null = null;
vi.mock("@/stores/session-flow", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/stores/session-flow")>()),
  useSessionFlowStore: () => ({
    configure,
    requestStart,
    confirmStart,
    markStartUncertain,
    failStart,
    discard,
    selectStudent,
    setAppointmentId,
    cancel,
    step: mockStep,
    appointmentId: mockAppointmentId,
    student: mockStudent,
    sessionName: mockSessionName,
    content: mockContent,
  }),
}));

const NOTEBOOK: TaskNotebookWithGroups = {
  notebook: {
    id: "notebook-1",
    educator: "e1",
    tasks: ["t1", "t2"],
    category: "reading",
    description: "Cores e formas",
    createdAt: "2026-01-01T00:00:00.000Z",
    taskGroupsIds: [],
  },
  taskGroups: [],
};

const NOTEBOOK2: TaskNotebookWithGroups = {
  notebook: {
    id: "notebook-2",
    educator: "e1",
    tasks: [],
    category: "writing",
    description: "Palavras do dia",
    createdAt: "2026-01-01T00:00:00.000Z",
    taskGroupsIds: [],
  },
  taskGroups: [],
};

const GROUP: TaskGroup = {
  id: "group-1",
  name: "Alfabeto e sons",
  tasksIds: ["t1"],
  educatorId: "e1",
  category: "reading",
};

function renderContentStep() {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return render(<ContentStep />, { queryClient });
}

describe("normalizeForSearch", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(normalizeForSearch("Início")).toBe(normalizeForSearch("inicio"));
  });
});

describe("ContentStep", () => {
  beforeEach(() => {
    mockAppointmentId = null;
    mockStep = "configured";
    mockContent = null;
    mockSessionName = null;
    cancel.mockClear();
    back.mockClear();
    push.mockClear();
    failStart.mockImplementation(async () => {
      mockStep = "error";
    });
  });
  it("AC-703-01: nome vazio mostra erro acessível e desabilita início após tentativa", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);

    await renderContentStep();

    const nextButton = screen.getByRole("button", {
      name: "Iniciar sessão",
    });
    fireEvent(screen.getByLabelText("Nome da sessão"), "blur");

    await waitFor(() =>
      expect(
        screen.getByText("Informe um nome com 1 a 100 caracteres."),
      ).toBeTruthy(),
    );
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("mostra os cadernos disponíveis", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );
    expect(
      screen.getByRole("checkbox", { name: "Cores e formas" }),
    ).toBeTruthy();
  });

  it("AC-AGE-04-02: envia o appointmentId no start quando a sessão veio de um atendimento", async () => {
    mockAppointmentId = "appt-1";
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(startSession).mockResolvedValue({
      id: "session-2",
      studentId: "student-1",
      educatorId: "e1",
      name: "Com atendimento",
      startedAt: "2026-10-07T10:00:00.000Z",
      answers: [],
    });
    vi.mocked(startSession).mockClear();

    await renderContentStep();
    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(screen.getByRole("checkbox", { name: "Cores e formas" }));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText("Nome da sessão"),
        "Com atendimento",
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Iniciar sessão" }));
    });

    await waitFor(() =>
      expect(startSession).toHaveBeenCalledWith({
        studentId: "student-1",
        name: "Com atendimento",
        taskNotebookId: "notebook-1",
        appointmentId: "appt-1",
      }),
    );
    mockAppointmentId = null;
  });

  it("404 APPOINTMENT_NOT_FOUND oferece iniciar sem vínculo, sem reenvio automático", async () => {
    mockAppointmentId = "appt-x";
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(startSession).mockClear();
    vi.mocked(startSession).mockRejectedValueOnce(
      new ApiError({
        message: "APPOINTMENT_NOT_FOUND",
        status: 404,
        code: "APPOINTMENT_NOT_FOUND",
      }),
    );
    vi.mocked(startSession).mockResolvedValueOnce({
      id: "session-3",
      studentId: "student-1",
      educatorId: "e1",
      name: "Sem vínculo",
      startedAt: "2026-10-07T10:00:00.000Z",
      answers: [],
    });

    await renderContentStep();
    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(screen.getByRole("checkbox", { name: "Cores e formas" }));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText("Nome da sessão"),
        "Sem vínculo",
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Iniciar sessão" }));
    });

    expect(
      await screen.findByText(
        "Atendimento não encontrado. Inicie a sessão sem vínculo?",
      ),
    ).toBeTruthy();
    expect(startSession).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.press(
        screen.getByRole("button", { name: "Iniciar sem vínculo" }),
      );
    });

    await waitFor(() => expect(startSession).toHaveBeenCalledTimes(2));
    expect(setAppointmentId).toHaveBeenCalledWith(null);
    expect(vi.mocked(startSession).mock.calls[1]![0]).not.toHaveProperty(
      "appointmentId",
    );
    mockAppointmentId = null;
  });

  it("preserva o vínculo do atendimento ao preparar nova tentativa após erro", async () => {
    mockAppointmentId = "appt-1";
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(startSession).mockRejectedValueOnce(new Error("falha"));

    await renderContentStep();
    await screen.findByText("Cores e formas");
    await act(async () => {
      fireEvent.press(screen.getByRole("checkbox", { name: "Cores e formas" }));
    });
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText("Nome da sessão"), "Sessão");
    });
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Iniciar sessão" }));
    });
    await screen.findByRole("button", { name: "Tentar novamente" });
    setAppointmentId.mockClear();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));
    });

    expect(setAppointmentId).toHaveBeenCalledWith("appt-1");
    mockAppointmentId = null;
  });

  it("Iniciar sessão de novo depois de falhar reinicia o fluxo e abre o player", async () => {
    mockAppointmentId = "appt-1";
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(startSession)
      .mockReset()
      .mockRejectedValueOnce(new Error("Falha do servidor"))
      .mockResolvedValueOnce({
        id: "session-9",
        studentId: "student-1",
        educatorId: "e1",
        name: "Sessão",
        startedAt: "2026-10-07T10:00:00.000Z",
        answers: [],
      });
    push.mockClear();
    discard.mockClear();
    selectStudent.mockClear();
    setAppointmentId.mockClear();

    await renderContentStep();
    await screen.findByText("Cores e formas");
    await act(async () => {
      fireEvent.press(screen.getByRole("checkbox", { name: "Cores e formas" }));
      fireEvent.changeText(screen.getByLabelText("Nome da sessão"), "Sessão");
    });
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Iniciar sessão" }));
    });
    await screen.findByText("Falha do servidor");
    expect(discard).not.toHaveBeenCalled();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Iniciar sessão" }));
    });

    expect(discard).toHaveBeenCalledWith({ confirmed: true });
    expect(selectStudent).toHaveBeenCalledWith(mockStudent);
    expect(setAppointmentId).toHaveBeenCalledWith("appt-1");
    expect(startSession).toHaveBeenCalledTimes(2);
    expect(confirmStart).toHaveBeenLastCalledWith("session-9");
    expect(push).toHaveBeenCalledWith("/session/player");
  });

  it("AC-SES-01-01: inicia sessão, confirma no store e abre o player", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(startSession).mockResolvedValue({
      id: "session-1",
      studentId: "student-1",
      educatorId: "e1",
      name: "Sessão de teste",
      startedAt: "2026-10-07T10:00:00.000Z",
      answers: [],
    });

    const view = await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("checkbox", { name: "Cores e formas" }));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText("Nome da sessão"),
        "Sessão de teste",
      );
    });

    const nextButton = screen.getByRole("button", {
      name: "Iniciar sessão",
    });
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: false,
    });

    await act(async () => {
      fireEvent.press(nextButton);
    });
    await waitFor(() =>
      expect(configure).toHaveBeenCalledWith({
        name: "Sessão de teste",
        content: {
          kind: "notebook",
          id: "notebook-1",
          name: "Cores e formas",
        },
      }),
    );

    await waitFor(() => expect(requestStart).toHaveBeenCalledTimes(1));
    expect(startSession).toHaveBeenCalledWith({
      studentId: "student-1",
      name: "Sessão de teste",
      taskNotebookId: "notebook-1",
    });
    expect(confirmStart).toHaveBeenCalledWith("session-1");
    expect(push).toHaveBeenCalledWith("/session/player");
    void view;
  });

  it("AC-SES-05-01: grupo ou atividade avulsa iniciam sem taskNotebookId", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(startSession).mockResolvedValue({
      id: "session-2",
      studentId: "student-1",
      educatorId: "e1",
      name: "Sessão de grupo",
      startedAt: "2026-10-07T10:00:00.000Z",
      answers: [],
    });

    mockContent = { kind: "group", id: "group-1", name: "Alfabeto e sons" };

    await renderContentStep();
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText("Nome da sessão"),
        "Sessão de grupo",
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Iniciar sessão" }));
    });

    await waitFor(() => expect(startSession).toHaveBeenCalledTimes(1));
    expect(startSession).toHaveBeenCalledWith({
      studentId: "student-1",
      name: "Sessão de grupo",
    });
  });

  it("Voltar cancela o fluxo parcial no store e sai", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);

    await renderContentStep();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    });

    await waitFor(() => expect(back).toHaveBeenCalledTimes(1));
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("Voltar sai mesmo se o cancelamento falhar em outra etapa", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);
    cancel.mockRejectedValueOnce(new Error("etapa inválida"));

    await renderContentStep();

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    });

    await waitFor(() => expect(back).toHaveBeenCalledTimes(1));
  });

  it("seletor de tipo troca a lista para grupos e atividades com os textos do tipo", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([GROUP]);
    vi.mocked(listTasks).mockResolvedValue([
      {
        id: "task-1",
        prompt: "Qual é a vogal?",
        category: "reading",
      } as never,
    ]);

    await renderContentStep();
    expect(await screen.findByText("Escolha o caderno")).toBeTruthy();
    expect(screen.getByPlaceholderText("Buscar caderno")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByRole("radio", { name: "Grupo" }));
    });
    expect(screen.getByText("Escolha o grupo")).toBeTruthy();
    expect(screen.getByPlaceholderText("Buscar grupo")).toBeTruthy();
    expect(await screen.findByText("Alfabeto e sons")).toBeTruthy();
    expect(screen.queryByText("Cores e formas")).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByRole("radio", { name: "Atividade" }));
    });
    expect(screen.getByText("Escolha a atividade")).toBeTruthy();
    expect(screen.getByPlaceholderText("Buscar atividade")).toBeTruthy();
    expect(await screen.findByText("Qual é a vogal?")).toBeTruthy();
  });

  it("trocar o tipo limpa a seleção e a busca", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([GROUP]);

    await renderContentStep();
    await screen.findByText("Cores e formas");
    await act(async () => {
      fireEvent.press(screen.getByRole("checkbox", { name: "Cores e formas" }));
      fireEvent.changeText(screen.getByLabelText("Nome da sessão"), "Sessão");
      fireEvent.changeText(
        screen.getByPlaceholderText("Buscar caderno"),
        "cores",
      );
    });

    await act(async () => {
      fireEvent.press(screen.getByRole("radio", { name: "Grupo" }));
    });
    await screen.findByText("Alfabeto e sons");

    expect(screen.getByPlaceholderText("Buscar grupo").props.value).toBe("");
    expect(
      screen.getByRole("button", { name: "Iniciar sessão" }).props
        .accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("iniciar com um grupo envia o start sem taskNotebookId, com o atendimento, e abre o player", async () => {
    mockAppointmentId = "appt-1";
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([GROUP]);
    vi.mocked(startSession).mockReset().mockResolvedValue({
      id: "session-g",
      studentId: "student-1",
      educatorId: "e1",
      name: "Grupo",
      startedAt: "2026-10-07T10:00:00.000Z",
      answers: [],
    });

    await renderContentStep();
    await act(async () => {
      fireEvent.press(screen.getByRole("radio", { name: "Grupo" }));
    });
    await screen.findByText("Alfabeto e sons");
    await act(async () => {
      fireEvent.press(
        screen.getByRole("checkbox", { name: "Alfabeto e sons" }),
      );
      fireEvent.changeText(screen.getByLabelText("Nome da sessão"), "Grupo");
    });
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Iniciar sessão" }));
    });

    await waitFor(() => expect(startSession).toHaveBeenCalledTimes(1));
    expect(startSession).toHaveBeenCalledWith({
      studentId: "student-1",
      name: "Grupo",
      appointmentId: "appt-1",
    });
    expect(configure).toHaveBeenLastCalledWith({
      name: "Grupo",
      content: { kind: "group", id: "group-1", name: "Alfabeto e sons" },
    });
    expect(confirmStart).toHaveBeenLastCalledWith("session-g");
    expect(push).toHaveBeenCalledWith("/session/player");
  });

  it("AC-SES-01-03: erro de início mostra mensagem e não reenvia automaticamente", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(startSession).mockRejectedValue(new Error("Validation error"));

    await renderContentStep();
    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(screen.getByRole("checkbox", { name: "Cores e formas" }));
      fireEvent.changeText(
        screen.getByLabelText("Nome da sessão"),
        "Sessão de teste",
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Iniciar sessão" }));
    });

    await waitFor(() =>
      expect(screen.getByText("Validation error")).toBeTruthy(),
    );
    expect(startSession).toHaveBeenCalledTimes(1);
  });

  it("busca filtra por descrição ignorando acento e maiúscula", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK, NOTEBOOK2]);
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([GROUP]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByPlaceholderText("Buscar caderno"),
      "PALAVRAS",
    );

    await waitFor(() =>
      expect(screen.queryByText("Cores e formas")).toBeNull(),
    );
    expect(screen.getByText("Palavras do dia")).toBeTruthy();
  });

  it("busca sem resultado mostra estado vazio", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByPlaceholderText("Buscar caderno"), "zzz");

    await waitFor(() =>
      expect(screen.getByText("Nenhum caderno encontrado.")).toBeTruthy(),
    );
  });

  it("mostra LoadingState enquanto busca", async () => {
    vi.mocked(listTaskNotebooks).mockReturnValue(new Promise(() => {}));

    await renderContentStep();

    expect(screen.getByText("Carregando cadernos")).toBeTruthy();
  });

  it("mostra ErrorState com retry", async () => {
    vi.mocked(listTaskNotebooks).mockRejectedValue(new Error("network"));

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Tentar novamente")).toBeTruthy(),
    );
    expect(screen.getByText("Tentar novamente")).toBeTruthy();
  });

  it("AC-703-07: reidrata seleção e nome já salvos no store", async () => {
    mockSessionName = "Sessão salva";
    mockContent = {
      kind: "notebook",
      id: "notebook-1",
      name: "Cores e formas",
    };
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );
    expect(screen.getByLabelText("Nome da sessão").props.value).toBe(
      "Sessão salva",
    );

    const nextButton = screen.getByRole("button", {
      name: "Iniciar sessão",
    });
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: false,
    });

    mockSessionName = null;
    mockContent = null;
  });

  it("usa cabeçalho novo com voltar", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([]);
    vi.mocked(listTasks).mockResolvedValue([]);

    await renderContentStep();

    expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
  });

  describe("REV-SES", () => {
    const SESSION = {
      id: "session-9",
      studentId: "student-1",
      educatorId: "e1",
      name: "Sessão",
      startedAt: "2026-10-07T10:00:00.000Z",
      answers: [],
    };

    async function fillAndReady() {
      vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
      const view = await renderContentStep();
      await waitFor(() =>
        expect(screen.getByText("Cores e formas")).toBeTruthy(),
      );
      await act(async () => {
        fireEvent.press(
          screen.getByRole("checkbox", { name: "Cores e formas" }),
        );
      });
      await act(async () => {
        fireEvent.changeText(screen.getByLabelText("Nome da sessão"), "Sessão");
      });
      return view;
    }

    async function pressStart() {
      await act(async () => {
        fireEvent.press(screen.getByRole("button", { name: "Iniciar sessão" }));
      });
    }

    beforeEach(() => {
      discard.mockClear();
      configure.mockClear();
      requestStart.mockClear();
      confirmStart.mockClear();
      vi.mocked(startSession).mockReset();
    });

    it.each(["startUncertain", "error"])(
      "R1c: Voltar em %s descarta o fluxo e sai",
      async (step) => {
        mockStep = step;
        vi.mocked(listTaskNotebooks).mockResolvedValue([]);
        await renderContentStep();

        await act(async () => {
          fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
        });

        await waitFor(() => expect(back).toHaveBeenCalledTimes(1));
        expect(discard).toHaveBeenCalledWith({ confirmed: true });
      },
    );

    it("R3: Voltar (cabeçalho e Android) fica bloqueado com o início em andamento", async () => {
      let resolveStart: (value: typeof SESSION) => void = () => {};
      vi.mocked(startSession).mockReturnValue(
        new Promise((resolve) => {
          resolveStart = resolve;
        }),
      );
      const handlers: (() => boolean)[] = [];
      const spy = vi
        .spyOn(BackHandler, "addEventListener")
        .mockImplementation((_event, handler) => {
          handlers.push(handler as () => boolean);
          return { remove: vi.fn() };
        });
      await fillAndReady();
      await pressStart();
      await waitFor(() => expect(startSession).toHaveBeenCalledTimes(1));

      await act(async () => {
        fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
      });
      expect(cancel).not.toHaveBeenCalled();
      expect(back).not.toHaveBeenCalled();
      expect(handlers.length).toBeGreaterThan(0);
      expect(handlers[handlers.length - 1]()).toBe(true);

      await act(async () => {
        resolveStart(SESSION);
      });
      await waitFor(() => expect(push).toHaveBeenCalledWith("/session/player"));
      spy.mockRestore();
    });

    it("R4: toque duplo em Iniciar chama a API uma vez e mostra carregando", async () => {
      let resolveStart: (value: typeof SESSION) => void = () => {};
      vi.mocked(startSession).mockReturnValue(
        new Promise((resolve) => {
          resolveStart = resolve;
        }),
      );
      await fillAndReady();
      const button = screen.getByRole("button", { name: "Iniciar sessão" });

      await act(async () => {
        fireEvent.press(button);
        fireEvent.press(button);
      });

      await waitFor(() => expect(startSession).toHaveBeenCalledTimes(1));
      expect(configure).toHaveBeenCalledTimes(1);
      expect(
        screen.getByRole("button", { name: "Iniciar sessão" }).props
          .accessibilityState,
      ).toMatchObject({ busy: true, disabled: true });
      await act(async () => {
        resolveStart(SESSION);
      });
    });

    it("R4: transição inválida ao iniciar mostra a mensagem sem estourar", async () => {
      configure.mockRejectedValueOnce(
        new SessionFlowInvalidTransitionError("configure", "startUncertain"),
      );
      await fillAndReady();

      await pressStart();

      await waitFor(() =>
        expect(
          screen.getByText(
            "Há uma sessão em andamento neste aparelho. Retome ou encerre antes de iniciar outra.",
          ),
        ).toBeTruthy(),
      );
      expect(startSession).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("button", { name: "Tentar novamente" }),
      ).toBeNull();
    });

    // Fica por último: desmontar aqui polui os testes seguintes deste arquivo.
    it("R3: sucesso tardio após desmontar não navega", async () => {
      let resolveStart: (value: typeof SESSION) => void = () => {};
      vi.mocked(startSession).mockReturnValue(
        new Promise((resolve) => {
          resolveStart = resolve;
        }),
      );
      const view = await fillAndReady();
      await pressStart();
      await waitFor(() => expect(startSession).toHaveBeenCalledTimes(1));

      view.unmount();
      await act(async () => {
        resolveStart(SESSION);
      });

      expect(push).not.toHaveBeenCalled();
    });
  });
});
