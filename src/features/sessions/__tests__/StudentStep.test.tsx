import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { createQueryClient } from "@/api/query-client";
import { listStudents } from "@/api/endpoints/student";
import { listTaskNotebooks } from "@/api/endpoints/content";
import { listSessionsByStudent, finishSession } from "@/api/endpoints/session";
import type { Student } from "@/api/types";
import { SessionFlowInvalidTransitionError } from "@/stores/session-flow";
import { StudentStep, normalizeForSearch } from "../StudentStep";

let mockParams: { studentId?: string; appointmentId?: string } = {};
const push = vi.fn();
const back = vi.fn();
const replace = vi.fn();
vi.mock("expo-router", () => ({
  useRouter: () => ({ push, back, replace }),
  useLocalSearchParams: () => mockParams,
}));

vi.mock("@/api/endpoints/student", () => ({
  listStudents: vi.fn(),
}));

vi.mock("@/api/endpoints/content", () => ({
  listTaskNotebooks: vi.fn(),
}));

vi.mock("@/api/endpoints/session", () => ({
  listSessionsByStudent: vi.fn(),
  finishSession: vi.fn(),
}));

const selectStudent = vi.fn().mockResolvedValue(undefined);
const setAppointmentId = vi.fn().mockResolvedValue(undefined);
const cancel = vi.fn().mockResolvedValue(undefined);
const finish = vi.fn().mockResolvedValue(undefined);
const seedFromServerSession = vi.fn().mockResolvedValue(undefined);
let flowState: { step: string; sessionId: string | null } = {
  step: "idle",
  sessionId: null,
};
vi.mock("@/stores/session-flow", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/stores/session-flow")>()),
  useSessionFlowStore: () => ({
    selectStudent,
    setAppointmentId,
    cancel,
    finish,
    seedFromServerSession,
    ...flowState,
  }),
}));

const ANA: Student = {
  id: "s1",
  name: "Ana Souza",
  age: 8,
  gender: "female",
  zipcode: "00000-000",
  road: "Rua A",
  housenumber: "1",
  phonenumber: "0000-0000",
  learningTopics: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  educatorId: "e1",
  photoUrl: null,
  documents: [],
};

const JOAO: Student = { ...ANA, id: "s2", name: "João Pedro", gender: "male" };

describe("normalizeForSearch", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(normalizeForSearch("João")).toBe(normalizeForSearch("joao"));
  });
});

describe("StudentStep", () => {
  beforeEach(() => {
    flowState = { step: "idle", sessionId: null };
    mockParams = {};
    setAppointmentId.mockClear();
    selectStudent.mockClear();
    push.mockClear();
    replace.mockClear();
    vi.mocked(listSessionsByStudent).mockResolvedValue([]);
  });
  it("AC-AGE-04-02: com o paciente do atendimento, vincula o appointmentId e vai direto ao conteúdo", async () => {
    mockParams = { studentId: "s1", appointmentId: "appt-1" };
    vi.mocked(listStudents).mockResolvedValue([ANA, JOAO]);

    await render(<StudentStep />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/session/content"),
    );
    expect(selectStudent).toHaveBeenCalledWith(ANA);
    expect(setAppointmentId).toHaveBeenCalledWith("appt-1");
    expect(replace).toHaveBeenCalledTimes(1);
    expect(selectStudent).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("com studentId e sem atendimento, vai direto e limpa o vínculo", async () => {
    mockParams = { studentId: "s1" };
    vi.mocked(listStudents).mockResolvedValue([ANA]);

    await render(<StudentStep />);

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/session/content"),
    );
    expect(setAppointmentId).toHaveBeenCalledWith(null);
  });

  it("com studentId e sessão aberta, mantém Retomar e Encerrar sem navegar", async () => {
    mockParams = { studentId: "s1", appointmentId: "appt-1" };
    flowState = { step: "running", sessionId: "open-session" };
    vi.mocked(listStudents).mockResolvedValue([ANA]);
    vi.mocked(listSessionsByStudent).mockResolvedValue([
      {
        id: "open-session",
        studentId: "s1",
        educatorId: "e1",
        name: "Sessão aberta",
        startedAt: "2026-10-07T10:00:00.000Z",
        answers: [],
      },
    ]);

    await render(<StudentStep />);

    expect(await screen.findByRole("button", { name: "Retomar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Encerrar agora" })).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
    expect(selectStudent).not.toHaveBeenCalled();
  });

  it("modo direto com sessão local de outro paciente mostra aviso, não navega e não rejeita", async () => {
    mockParams = { studentId: "s1" };
    flowState = { step: "running", sessionId: "outra-sessao" };
    vi.mocked(listStudents).mockResolvedValue([ANA]);
    selectStudent.mockRejectedValueOnce(
      new SessionFlowInvalidTransitionError("selectStudent", "running"),
    );

    await render(<StudentStep />);

    expect(
      await screen.findByText(
        "Há uma sessão em andamento neste aparelho. Retome ou encerre antes de iniciar outra.",
      ),
    ).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeTruthy();
  });

  it("falha desconhecida ao preparar mostra mensagem genérica", async () => {
    mockParams = { studentId: "s1" };
    vi.mocked(listStudents).mockResolvedValue([ANA]);
    selectStudent.mockRejectedValueOnce(new Error("x"));

    await render(<StudentStep />);

    expect(
      await screen.findByText("Não foi possível preparar a sessão."),
    ).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it("com studentId inexistente, cai na lista com Continuar", async () => {
    mockParams = { studentId: "nao-existe" };
    vi.mocked(listStudents).mockResolvedValue([ANA]);

    await render(<StudentStep />);

    expect(await screen.findByText("Ana Souza")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it("com studentId e falha ao verificar sessões, cai na tela atual sem navegar", async () => {
    mockParams = { studentId: "s1" };
    vi.mocked(listStudents).mockResolvedValue([ANA]);
    vi.mocked(listSessionsByStudent).mockRejectedValue(new Error("falha"));

    await render(<StudentStep />);

    expect(
      await screen.findByText(
        "Não foi possível verificar sessões em andamento.",
      ),
    ).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });

  it("sessão avulsa limpa o appointmentId herdado", async () => {
    vi.mocked(listStudents).mockResolvedValue([ANA]);

    await render(<StudentStep />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Ana Souza" }),
    );
    const next = screen.getByRole("button", { name: "Continuar" });
    await waitFor(() =>
      expect(next.props.accessibilityState).toMatchObject({ disabled: false }),
    );
    await fireEvent.press(next);

    await waitFor(() => expect(setAppointmentId).toHaveBeenCalledWith(null));
  });

  it("AC-702-05: mostra LoadingState enquanto busca", async () => {
    vi.mocked(listStudents).mockReturnValue(new Promise(() => {}));

    await render(<StudentStep />);

    expect(screen.getByText("Carregando pacientes")).toBeTruthy();
  });

  it("AC-702-05: mostra EmptyState sem alunos", async () => {
    vi.mocked(listStudents).mockResolvedValue([]);

    await render(<StudentStep />);

    await waitFor(() =>
      expect(screen.getByText("Escolha o paciente")).toBeTruthy(),
    );
  });

  it("AC-702-05: mostra ErrorState com retry", async () => {
    vi.mocked(listStudents).mockRejectedValue(new Error("network"));
    const queryClient = createQueryClient();
    queryClient.setDefaultOptions({ queries: { retry: false } });

    await render(<StudentStep />, { queryClient });

    await waitFor(() =>
      expect(screen.getByText("Tentar novamente")).toBeTruthy(),
    );
    expect(screen.getByText("Tentar novamente")).toBeTruthy();
  });

  it("AC-702-01: filtra por nome sem diferenciar acento/maiúscula", async () => {
    vi.mocked(listStudents).mockResolvedValue([ANA, JOAO]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());

    fireEvent.changeText(
      screen.getByPlaceholderText("Buscar paciente"),
      "joao",
    );

    await waitFor(() => expect(screen.queryByText("Ana Souza")).toBeNull());
    expect(screen.getByText("João Pedro")).toBeTruthy();
  });

  it("AC-702-03: Continuar desabilitado sem seleção", async () => {
    vi.mocked(listStudents).mockResolvedValue([ANA]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());

    const nextButton = screen.getByRole("button", { name: "Continuar" });
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("AC-702-02/03: seleção habilita e navega gravando no store", async () => {
    vi.mocked(listStudents).mockResolvedValue([ANA, JOAO]);

    await render(<StudentStep />);

    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());

    fireEvent.press(screen.getByRole("button", { name: "Ana Souza" }));

    const nextButton = screen.getByRole("button", { name: "Continuar" });
    await waitFor(() =>
      expect(nextButton.props.accessibilityState).toMatchObject({
        disabled: false,
      }),
    );

    fireEvent.press(nextButton);

    await waitFor(() => expect(selectStudent).toHaveBeenCalledWith(ANA));
    expect(push).toHaveBeenCalledWith("/session/content");
  });

  it("Voltar cancela o fluxo no store (T-701) e sai", async () => {
    vi.mocked(listStudents).mockResolvedValue([]);

    await render(<StudentStep />);

    await waitFor(() =>
      expect(screen.getByText("Escolha o paciente")).toBeTruthy(),
    );

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    await waitFor(() => expect(cancel).toHaveBeenCalledTimes(1));
    expect(back).toHaveBeenCalledTimes(1);
  });

  const OPEN_SESSION = {
    id: "open-session",
    studentId: ANA.id,
    educatorId: "e1",
    name: "Sessão aberta",
    startedAt: "2026-10-07T10:00:00.000Z",
    answers: [],
  };

  async function chooseAnaWithOpenSession() {
    vi.mocked(listStudents).mockResolvedValue([ANA]);
    vi.mocked(listSessionsByStudent).mockResolvedValue([OPEN_SESSION]);
    await render(<StudentStep />);
    await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());
    fireEvent.press(screen.getByRole("button", { name: "Ana Souza" }));
    await waitFor(() =>
      expect(screen.getByText("Sessão em andamento")).toBeTruthy(),
    );
  }

  it("AC-SES-01-02: com o fluxo salvo neste aparelho, oferece Retomar e Encerrar agora", async () => {
    flowState = { step: "running", sessionId: "open-session" };
    await chooseAnaWithOpenSession();

    fireEvent.press(screen.getByRole("button", { name: "Retomar" }));

    expect(push).toHaveBeenCalledWith("/session/player");
    expect(selectStudent).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Encerrar agora" })).toBeTruthy();
  });

  it("Encerrar agora com o fluxo local passa pelo encerramento com registro", async () => {
    flowState = { step: "running", sessionId: "open-session" };
    await chooseAnaWithOpenSession();

    fireEvent.press(screen.getByRole("button", { name: "Encerrar agora" }));

    await waitFor(() => expect(finish).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/session/finish");
    expect(finishSession).not.toHaveBeenCalled();
  });

  it("sessão aberta em outro aparelho não oferece Retomar, só encerrar no servidor", async () => {
    flowState = { step: "idle", sessionId: null };
    vi.mocked(finishSession).mockResolvedValue({
      ...OPEN_SESSION,
      finishedAt: "2026-10-07T11:00:00.000Z",
    });
    await chooseAnaWithOpenSession();

    expect(screen.queryByRole("button", { name: "Retomar" })).toBeNull();
    expect(screen.getByText(/outro aparelho/)).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Encerrar agora" }));

    await waitFor(() =>
      expect(finishSession).toHaveBeenCalledWith({ sessionId: "open-session" }),
    );
    expect(finish).not.toHaveBeenCalled();
  });

  describe("AC-SES-05-02: sessão do servidor ligada a um caderno", () => {
    const NOTEBOOK_SESSION = {
      ...OPEN_SESSION,
      taskNotebookId: "notebook-1",
      answers: [
        {
          taskId: "t1",
          selectedAlternativeId: "a1",
          isCorrect: true,
          timeToAnswer: 3,
          answeredAt: "2026-10-07T10:01:00.000Z",
        },
      ],
    };

    beforeEach(() => {
      vi.mocked(listTaskNotebooks).mockResolvedValue([
        {
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
        },
      ]);
    });

    async function chooseAnaWithNotebookSession() {
      vi.mocked(listStudents).mockResolvedValue([ANA]);
      vi.mocked(listSessionsByStudent).mockResolvedValue([NOTEBOOK_SESSION]);
      await render(<StudentStep />);
      await waitFor(() => expect(screen.getByText("Ana Souza")).toBeTruthy());
      fireEvent.press(screen.getByRole("button", { name: "Ana Souza" }));
      await waitFor(() =>
        expect(screen.getByText("Sessão em andamento")).toBeTruthy(),
      );
    }

    it("sem fluxo local, Retomar semeia o fluxo com o caderno e abre o player", async () => {
      flowState = { step: "idle", sessionId: null };
      await chooseAnaWithNotebookSession();

      expect(screen.queryByText(/outro aparelho/)).toBeNull();
      fireEvent.press(screen.getByRole("button", { name: "Retomar" }));

      await waitFor(() =>
        expect(seedFromServerSession).toHaveBeenCalledWith({
          student: ANA,
          session: NOTEBOOK_SESSION,
          content: {
            kind: "notebook",
            id: "notebook-1",
            name: "Cores e formas",
          },
        }),
      );
      expect(push).toHaveBeenCalledWith("/session/player");
    });

    it("caderno que não existe mais não retoma e avisa", async () => {
      flowState = { step: "idle", sessionId: null };
      vi.mocked(listTaskNotebooks).mockResolvedValue([]);
      await chooseAnaWithNotebookSession();

      fireEvent.press(screen.getByRole("button", { name: "Retomar" }));

      await waitFor(() =>
        expect(
          screen.getByText("O caderno desta sessão não está mais disponível."),
        ).toBeTruthy(),
      );
      expect(seedFromServerSession).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalledWith("/session/player");
    });
  });

  it("mostra cabeçalho novo com voltar", async () => {
    vi.mocked(listStudents).mockResolvedValue([]);

    await render(<StudentStep />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy(),
    );
  });
});
