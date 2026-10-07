import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test-utils/render";
import { Text } from "react-native";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

let params: { id?: string } = {};

vi.mock("expo-router", () => ({
  useLocalSearchParams: () => params,
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/features/patients/detail/PatientDetailScreen", () => ({
  PatientDetailScreen: ({ patientId }: { patientId: string }) => (
    <Text>{patientId}</Text>
  ),
}));

const { default: StudentDetailRoute } =
  await import("../../../../app/students/[id]");

describe("app/students/[id]", () => {
  it("reexporta a rota da ficha de paciente mantendo o id", async () => {
    params = { id: "student-1" };
    await render(<StudentDetailRoute />);
    expect(await screen.findByText("student-1")).toBeTruthy();
  });
});
