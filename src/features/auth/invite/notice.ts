// Avisos entregues entre as telas do grupo (auth), só em memória do módulo
// (mesmo padrão de password-reset/notice): nunca guardam senha, e o código só
// vive aqui até o login consumir o aviso. Nada vai para a URL nem para o cache.
export type LoginInviteNotice =
  { kind: "invite"; code: string } | { kind: "registered" };

let loginNotice: LoginInviteNotice | null = null;
let inviteScreenError: string | null = null;

export function setLoginInviteNotice(notice: LoginInviteNotice): void {
  loginNotice = notice;
}

/** Devolve o aviso pendente do login e o limpa. */
export function consumeLoginInviteNotice(): string | null {
  const notice = loginNotice;
  loginNotice = null;
  if (!notice) return null;
  return notice.kind === "registered"
    ? "Conta criada. Entre com seu e-mail e senha."
    : `Entre na sua conta e use 'Entrar numa equipe' no perfil com o código ${notice.code}.`;
}

export function setInviteScreenError(message: string): void {
  inviteScreenError = message;
}

export function consumeInviteScreenError(): string | null {
  const message = inviteScreenError;
  inviteScreenError = null;
  return message;
}
