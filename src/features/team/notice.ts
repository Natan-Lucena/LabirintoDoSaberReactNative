// Aviso entregue à tela da equipe por outra tela (ex.: "Entrar numa equipe"),
// só em memória do módulo (mesmo padrão de auth/invite/notice): a tela de
// origem navega logo depois, então o toast dela nunca chegaria a aparecer.
let teamNotice: string | null = null;

export function setTeamNotice(message: string): void {
  teamNotice = message;
}

/** Devolve o aviso pendente da equipe e o limpa. */
export function consumeTeamNotice(): string | null {
  const message = teamNotice;
  teamNotice = null;
  return message;
}
