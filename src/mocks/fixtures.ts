// G-29: dados 100% fictícios usados pela camada de mocks (src/mocks/README.md).
import type { Educator } from "@/api/types";

export const MOCK_EDUCATOR: Educator = {
  id: "mock-educator-1",
  name: "Aline Ribeiro Souza",
  email: "educadora.mock@labirinto.test",
};

export const MOCK_TOKEN = "mock-token-aline";

export const MOCK_VALID_CREDENTIALS = {
  email: MOCK_EDUCATOR.email,
  password: "senha123",
};

/** Qualquer senha com este e-mail devolve 401 INVALID_CREDENTIALS. */
export const MOCK_INVALID_CREDENTIALS_EMAIL = "invalido.mock@labirinto.test";

/** Qualquer senha com este e-mail simula falha de rede (sem response). */
export const MOCK_NETWORK_ERROR_EMAIL = "semrede.mock@labirinto.test";
