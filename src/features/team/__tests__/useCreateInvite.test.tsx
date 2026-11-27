import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type * as ClinicApi from "@/api/endpoints/clinic";
import type { ClinicInvite } from "@/api/types";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("@/api/query-client", () => ({
  withOfflineGuard: <T,>(fn: T) => fn,
}));
vi.mock("@/api/endpoints/clinic", async (importOriginal) => ({
  ...(await importOriginal<typeof ClinicApi>()),
  listClinicInvites: vi.fn(),
  createClinicInvite: vi.fn(),
}));

const clinic = await import("@/api/endpoints/clinic");
const { useClinicInvites, useCreateInvite } =
  await import("@/features/team/useClinic");

const invite = (code: string) => ({ code }) as unknown as ClinicInvite;

describe("useCreateInvite (EQP-02)", () => {
  it("invalida a lista de convites ativos após criar", async () => {
    const list = vi.mocked(clinic.listClinicInvites);
    list.mockResolvedValueOnce([]);
    list.mockResolvedValue([invite("ABCD1234")]);
    vi.mocked(clinic.createClinicInvite).mockResolvedValue(invite("ABCD1234"));

    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = await renderHook(
      () => ({ invites: useClinicInvites(true), create: useCreateInvite() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.invites.data).toEqual([]));

    await act(async () => {
      await result.current.create.mutateAsync({ role: "PROFESSIONAL" });
    });

    await waitFor(() =>
      expect(result.current.invites.data).toEqual([invite("ABCD1234")]),
    );
  });
});
