import { vi } from "vitest";

type SecureStoreOptions = {
  keychainAccessible?: number;
};

const secureStoreValues = new Map<string, string>();

const deleteSecureStoreValue = async (key: string) => {
  secureStoreValues.delete(key);
};
const getSecureStoreValue = async (key: string) => secureStoreValues.get(key) ?? null;
const setSecureStoreValue = async (key: string, value: string, _options?: SecureStoreOptions) => {
  secureStoreValues.set(key, value);
};

export const secureStoreMock = {
  deleteItemAsync: vi.fn(deleteSecureStoreValue),
  getItemAsync: vi.fn(getSecureStoreValue),
  setItemAsync: vi.fn(setSecureStoreValue),
};

export const routerMock = {
  back: vi.fn(),
  canGoBack: vi.fn(() => false),
  dismiss: vi.fn(),
  dismissAll: vi.fn(),
  navigate: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  setParams: vi.fn(),
};

let localSearchParams: Record<string, string | string[]> = {};

export function setLocalSearchParams(params: Record<string, string | string[]>) {
  localSearchParams = params;
}

export function getLocalSearchParams() {
  return localSearchParams;
}

export function resetNativeMocks() {
  secureStoreValues.clear();
  localSearchParams = {};
  secureStoreMock.deleteItemAsync.mockReset();
  secureStoreMock.deleteItemAsync.mockImplementation(deleteSecureStoreValue);
  secureStoreMock.getItemAsync.mockReset();
  secureStoreMock.getItemAsync.mockImplementation(getSecureStoreValue);
  secureStoreMock.setItemAsync.mockReset();
  secureStoreMock.setItemAsync.mockImplementation(setSecureStoreValue);
  routerMock.back.mockReset();
  routerMock.canGoBack.mockReset();
  routerMock.canGoBack.mockReturnValue(false);
  routerMock.dismiss.mockReset();
  routerMock.dismissAll.mockReset();
  routerMock.navigate.mockReset();
  routerMock.push.mockReset();
  routerMock.replace.mockReset();
  routerMock.setParams.mockReset();
}
