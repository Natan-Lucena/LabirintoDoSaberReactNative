import { vi } from "vitest";

type SecureStoreOptions = {
  keychainAccessible?: number;
};

const secureStoreValues = new Map<string, string>();

const deleteSecureStoreValue = async (key: string) => {
  secureStoreValues.delete(key);
};
const getSecureStoreValue = async (key: string) =>
  secureStoreValues.get(key) ?? null;
const setSecureStoreValue = async (
  key: string,
  value: string,
  _options?: SecureStoreOptions,
) => {
  secureStoreValues.set(key, value);
};

export const secureStoreMock = {
  deleteItemAsync: vi.fn(deleteSecureStoreValue),
  getItemAsync: vi.fn(getSecureStoreValue),
  setItemAsync: vi.fn(setSecureStoreValue),
};

function fillRandomBytes(byteCount: number): Uint8Array {
  const bytes = new Uint8Array(byteCount);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

// Mock em memória de `expo-crypto` para o ambiente de teste: o módulo real
// carrega `expo-modules-core` (nativo), que o loader do vitest-native não
// consegue resolver fora de runtime nativo. Usado por src/storage/mmkv.ts
// (nonce do AES-256-GCM, EXPO-01) e src/storage/encryption-key.ts (G-27);
// não valida a fonte de aleatoriedade real do dispositivo.
export const expoCryptoMock = {
  getRandomBytes: vi.fn(fillRandomBytes),
  getRandomBytesAsync: vi.fn(async (byteCount: number) =>
    fillRandomBytes(byteCount),
  ),
};

type SQLiteStorageSetItemUpdateFunction = (prevValue: string | null) => string;

const sqliteDatabases = new Map<string, Map<string, string>>();

// Mock em memória de `expo-sqlite/kv-store` (classe `SQLiteStorage`) para o
// ambiente de teste: não há módulo nativo de SQLite no Vitest. Replica só a
// API síncrona usada por src/storage/mmkv.ts (EXPO-01), isolando os dados por
// `databaseName` (um arquivo de banco por educador em produção).
export class SQLiteStorageMock {
  private readonly databaseName: string;

  constructor(databaseName: string) {
    this.databaseName = databaseName;
  }

  // Recria o "banco" sob demanda: um teste pode manter uma instância antiga
  // (sem recarregar o módulo "@/storage/mmkv") mesmo depois que
  // resetSqliteKvStoreMock() limpa sqliteDatabases entre testes. Um arquivo
  // SQLite real seria reaberto/recriado do mesmo jeito ao ser reacessado.
  private get store(): Map<string, string> {
    let store = sqliteDatabases.get(this.databaseName);
    if (!store) {
      store = new Map();
      sqliteDatabases.set(this.databaseName, store);
    }
    return store;
  }

  getItemSync(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItemSync(
    key: string,
    value: string | SQLiteStorageSetItemUpdateFunction,
  ): void {
    const resolved =
      typeof value === "function" ? value(this.getItemSync(key)) : value;
    this.store.set(key, resolved);
  }

  removeItemSync(key: string): boolean {
    return this.store.delete(key);
  }

  getAllKeysSync(): string[] {
    return Array.from(this.store.keys());
  }

  clearSync(): boolean {
    this.store.clear();
    return true;
  }
}

export const sqliteKvStoreMock = {
  SQLiteStorage: SQLiteStorageMock,
};

function resetSqliteKvStoreMock(): void {
  sqliteDatabases.clear();
}

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

export function setLocalSearchParams(
  params: Record<string, string | string[]>,
) {
  localSearchParams = params;
}

export function getLocalSearchParams() {
  return localSearchParams;
}

export function resetNativeMocks() {
  secureStoreValues.clear();
  resetSqliteKvStoreMock();
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
