import { afterEach, vi } from "vitest";

import {
  expoCryptoMock,
  getLocalSearchParams,
  resetNativeMocks,
  routerMock,
  secureStoreMock,
  sqliteKvStoreMock,
} from "@/test-utils/mocks";

vi.mock("expo-sqlite/kv-store", () => sqliteKvStoreMock);

vi.mock("expo-crypto", () => expoCryptoMock);

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
