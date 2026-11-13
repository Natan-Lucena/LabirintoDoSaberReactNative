// Aviso de "senha alterada" entregue ao login. Fica só em memória do módulo
// (mesmo padrão de session-expiry): nunca guarda senha nem código.
export const PASSWORD_CHANGED_NOTICE =
  "Senha alterada. Entre com a nova senha.";

let passwordChangedNotice = false;

export function markPasswordChanged(): void {
  passwordChangedNotice = true;
}

export function wasPasswordChanged(): boolean {
  return passwordChangedNotice;
}

export function acknowledgePasswordChanged(): void {
  passwordChangedNotice = false;
}
