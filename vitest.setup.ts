import { afterEach, vi } from "vitest";

import {
  getLocalSearchParams,
  resetNativeMocks,
  routerMock,
  secureStoreMock,
} from "@/test-utils/mocks";

vi.mock("react-native-nitro-modules", () => ({
  NitroModules: { createHybridObject: vi.fn() },
}));

vi.mock("expo-secure-store", () => secureStoreMock);

vi.mock("expo-router", () => ({
  router: routerMock,
  useGlobalSearchParams: getLocalSearchParams,
  useLocalSearchParams: getLocalSearchParams,
  useRouter: () => routerMock,
}));

afterEach(async () => {
  const { cleanup } = await import("@testing-library/react-native");
  await cleanup();
  resetNativeMocks();
});
