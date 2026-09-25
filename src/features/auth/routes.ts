// Ponto único de troca dos destinos de navegação (docs/contracts/t-402-guarda-sessao.md).
// AUTH_DESTINATION aponta para a rota real de Login desde a T-401.
// APP_DESTINATION segue placeholder até a área autenticada (T-501/T-601+).
export const AUTH_DESTINATION = "/(auth)/login" as const;
export const APP_DESTINATION = "/" as const;
