# EQP-03 — Criar conta e entrar na equipe pelo convite

| Campo             | Valor                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Bloco / onda      | C — Equipe · E5-5 (paralela à EQP-01; arquivos disjuntos)                                        |
| Classe / modelo   | B · Codex (ou Terra/Sonnet), esforço médio; revisão A do tratamento de senha                     |
| Estimativa        | M · 5–7 h de worker                                                                              |
| Dependências      | API-07 (equipe: `InvitePreview`, `getInvitePreview`); backend leva 2 (§4.5, EQ-06 e EQ-07); G-63 |
| Estado do backend | **Mock-first**; `POST /educator/register` já existe, o `inviteCode` é novo                       |
| História          | US5-03 (criar a conta com o código da clínica)                                                   |

## 1. Objetivo e valor

O app não tem cadastro: hoje a conta nasce fora dele. Com a equipe, a profissional convidada
precisa entrar sozinha: digita o código, vê a clínica e o papel, cria a conta e cai na Início
já dentro da equipe. Quem já tem conta entra na equipe pelo perfil.

## 2. Referência de design

Sem desenho próprio (o `onboarding` do Make é a central de ajuda). Seguir o visual da tela de
login (`app/(auth)/login.tsx`: fundo em gradiente, logo e cartão) e os campos de
`src/components/ds` (`Field`, `DsButton`). Copy desta ficha.

## 3. Fluxo do usuário

**A. Sem conta (fora do app):**

1. Login → link **"Tenho um convite"** (abaixo de "Esqueci minha senha", mesmo estilo) →
   `router.push("/(auth)/invite")`.
2. Tela "Entrar com convite": `Field` "Código do convite" (8 caracteres; o app converte para
   maiúsculas e tira espaços e hífens enquanto digita; `autoCapitalize="characters"`,
   `autoCorrect={false}`). "Continuar" só habilita com 8 caracteres válidos.
3. "Continuar" → `GET /clinic/invites/preview/:code`. No sucesso, mostra um cartão: "Você foi
   convidada(o) para a equipe **{clinicName}** como **{papel}**. Vale até dd/mm." e dois botões:
   "Criar minha conta" e "Já tenho conta".
4. "Criar minha conta" → `router.push({ pathname: "/(auth)/register", params: { code } })`.
   Formulário: Nome, E-mail, Senha, Confirmar senha. "Criar conta" →
   `POST /educator/register { name, email, password, inviteCode: code }`.
5. Sucesso (`200 { id, name }`) → login automático com o mesmo e-mail e senha
   (`signIn` + `getMe` + `activateEducator` + `useAuthStore.login`, o caminho do `useSignIn`) →
   o `SessionGuard` leva à Início. `Toast`/aviso na Início não é necessário.
6. "Já tenho conta" → volta ao login com o aviso "Entre na sua conta e use 'Entrar numa equipe'
   no perfil com o código {código}." (parâmetro `notice=invite` no login; o código **não** vai
   na URL).

**B. Com conta (dentro do app):**

1. Perfil → `DsButton` `secondary` "Entrar numa equipe" (só quando `me.clinic` não existe) →
   `router.push("/profile/join-team")`.
2. Mesma entrada de código e prévia (componentes compartilhados com a tela A).
3. "Entrar na equipe" → `POST /clinic/invites/accept { code }` → `Toast` "Você entrou na equipe
   {clínica}" → `router.replace("/team")`.

## 4. Estados da tela

| Situação                          | Mensagem (pt-BR exata)                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Código com formato inválido       | "O código tem 8 letras e números (sem 0, O, 1 e I)." (antes de chamar a API)                                                                                               |
| Prévia carregando                 | `DsButton` "Continuar" com `loading`                                                                                                                                       |
| `404 INVITE_INVALID`              | "Convite inválido ou vencido. Peça um novo código para quem convidou você."                                                                                                |
| `429 TOO_MANY_REQUESTS` (prévia)  | "Muitas tentativas. Aguarde alguns minutos e tente de novo."                                                                                                               |
| `400 EDUCATOR_ALREADY_EXISTS`     | "Já existe uma conta com este e-mail. Entre com ela e use 'Entrar numa equipe' no perfil." + botão "Ir para o login"                                                       |
| `404 INVITE_INVALID` no cadastro  | A mesma do convite inválido; o formulário volta para a etapa do código                                                                                                     |
| `409 ALREADY_IN_CLINIC` (aceitar) | "Você já faz parte de uma equipe. Saia dela antes de entrar em outra."                                                                                                     |
| Validação do cadastro             | Nome: "Informe entre 3 e 100 caracteres."; e-mail: "Digite um e-mail válido."; senha: "A senha deve ter entre 6 e 100 caracteres."; confirmação: "As senhas não conferem." |
| Cadastro ok, login falhou         | Vai ao login com o aviso "Conta criada. Entre com seu e-mail e senha."                                                                                                     |
| Offline                           | "Não foi possível conectar. Verifique sua internet e tente novamente." (a frase do login)                                                                                  |
| Erro desconhecido                 | `normalizeApiError(error).message`                                                                                                                                         |

## 5. Contrato de dados

| Rota                                          | Corpo                                                      | Resposta            | Erros                                                              |
| --------------------------------------------- | ---------------------------------------------------------- | ------------------- | ------------------------------------------------------------------ |
| `GET /clinic/invites/preview/:code` (pública) | —                                                          | `200 InvitePreview` | `404 INVITE_INVALID`; `429 TOO_MANY_REQUESTS`                      |
| `POST /educator/register` (pública)           | `name` (3–100), `email`, `password` (6–100), `inviteCode?` | `200 { id, name }`  | `400` (validação, `EDUCATOR_ALREADY_EXISTS`); `404 INVITE_INVALID` |
| `POST /educator/sign-in` (existente)          | `email`, `password`                                        | `{ token }`         | `401`                                                              |
| `POST /clinic/invites/accept`                 | `{ code }`                                                 | `200 ClinicView`    | `404 INVITE_INVALID`; `409 ALREADY_IN_CLINIC`                      |

- **Funções:** `register(input)` em `src/api/endpoints/educator.ts` (nova; sem `inviteCode` o
  corpo é o atual); `getInvitePreview(code)` (API-07) e `acceptClinicInvite({ code })` em
  `src/api/endpoints/clinic.ts`.
- **Sem cache:** prévia, cadastro e aceitar são `useMutation`/chamadas diretas, nunca
  `useQuery` persistido (antes do login não há persister; e o código não deve ficar guardado).
- **Invalidação (aceitar):** `setQueryData(clinicQueryKeys.view(), view)` e invalida
  `["educator", "me"]` e `["student"]` (pacientes compartilhados podem chegar depois).
- `TOO_MANY_REQUESTS` já tem mensagem global sobre "solicitações de código" (senha). A tela
  **mapeia pelo `code`** para a frase do §4, sem mudar `src/api/errors.ts`.

## 6. Regras de negócio e casos de borda

1. **Formato do código** (EQ-04): `^[A-HJ-NP-Z2-9]{8}$` depois de normalizar (maiúsculas, sem
   espaços e hífens). Função pura `normalizeInviteCode` + `isValidInviteCode` em
   `src/features/auth/invite/code.ts`.
2. O cadastro **só** é enviado depois de uma prévia `200` com o mesmo código (AC-EQP-03-01): a
   tela de cadastro recebe o `code` por parâmetro e, se aberta sem ele, volta para
   `/(auth)/invite`.
3. Um só erro para convite vencido, usado, revogado ou inexistente (EQ-06): o app não tenta
   distinguir.
4. **Senha e código nunca em log, toast, cache ou URL**, exceto o `code` como parâmetro de rota
   entre as duas telas do grupo `(auth)` (ele não é segredo depois de compartilhado, mas não
   vai para o login). Nenhum `console.log` de corpo de requisição.
5. Se o `register` der certo e o `sign-in` falhar, **não** tentar de novo em laço: vai ao login.
6. Usuário logado não vê `(auth)`: o `useSessionGuard` já redireciona. O fluxo B vive em
   `app/profile/join-team.tsx`.
7. O papel da prévia usa o mesmo rótulo da equipe (`roleLabel`, de `src/features/team/roles.ts`;
   se a EQP-01 ainda não estiver na `main`, a tarefa cria o mesmo arquivo com o mesmo conteúdo e
   o segundo PR resolve o conflito trivial).
8. "Esqueci minha senha" e o login continuam iguais; o link novo não muda o layout do cartão.

## 7. Plano de implementação

1. `src/api/endpoints/educator.ts`: `register(input: RegisterInput)` + mock em
   `src/mocks/handlers/educator.ts` (hoje o arquivo só tem `sign-in`, `me` e `get-last-sessions`:
   acrescentar `POST /educator/register`, que cria o educador em memória; `EDUCATOR_ALREADY_EXISTS` para o e-mail do mock; `INVITE_INVALID` para
   código diferente de `ABCD2345`) + teste pelo `apiClient` real.
2. `src/api/endpoints/clinic.ts`: `acceptClinicInvite` + handler + teste.
3. `src/features/auth/invite/`: `code.ts`, `InviteCodeStep.tsx` (campo + prévia, usado nas duas
   entradas), `InvitePreviewCard.tsx`, `RegisterForm.tsx` (React Hook Form + Zod; o
   `registerSchema` fica em `src/features/auth/schemas.ts`, reaproveitando as mensagens do
   `newPasswordSchema`), `useRegisterWithInvite.ts`.
4. `src/features/auth/useSignIn.ts`: **exportar** `signInAndLoadEducator` (hoje interno), sem
   mudar o comportamento, para o cadastro reaproveitar o login.
5. `app/(auth)/invite.tsx` e `app/(auth)/register.tsx`: rotas finas, com o mesmo fundo do login
   (`Screen` + estilos do cartão; extrair o estilo do cartão para
   `src/features/auth/invite/AuthCard.tsx` se ajudar, sem mexer no `login.tsx` além do link).
6. `src/features/auth/LoginForm.tsx`: link "Tenho um convite" e a leitura do aviso
   `notice=invite` / `notice=registered` (o `login.tsx` repassa o parâmetro, se preciso).
7. `src/features/profile/join-team/JoinTeamScreen.tsx` e `app/profile/join-team.tsx`.
8. `src/features/profile/ProfileScreen.tsx`: botão "Entrar numa equipe" (só sem `me.clinic`).

## 8. Arquivos

- **Permitidos (novos):** `app/(auth)/invite.tsx`, `app/(auth)/register.tsx`,
  `app/profile/join-team.tsx`, `src/features/auth/invite/**`,
  `src/features/profile/join-team/**`.
- **Permitidos (alterar):** `app/(auth)/login.tsx` (só repassar o aviso),
  `src/features/auth/LoginForm.tsx` (link e aviso), `src/features/auth/useSignIn.ts` (só o
  `export`), `src/features/auth/schemas.ts` (só `registerSchema`),
  `src/features/profile/ProfileScreen.tsx` (só o botão), `src/api/endpoints/educator.ts`
  (`register`), `src/api/endpoints/clinic.ts` (`acceptClinicInvite`),
  `src/mocks/handlers/{educator,clinic}.ts`, `src/mocks/README.md` e os testes.
- **Proibidos:** `src/api/types.ts`, `src/api/errors.ts`, `src/stores/auth.ts`,
  `src/features/auth/useSessionGuard.ts`, `src/features/team/**` (dona: EQP-01, salvo o caso do
  item 7 do §6).

## 9. Critérios de aceite

| ID           | Critério                                                                                                       | Verificação |
| ------------ | -------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-EQP-03-01 | O cadastro só é enviado depois de uma prévia válida, com `inviteCode` igual ao código da prévia                | `CT`        |
| AC-EQP-03-02 | `INVITE_INVALID`, `TOO_MANY_REQUESTS`, `EDUCATOR_ALREADY_EXISTS` e `ALREADY_IN_CLINIC` mostram as frases do §4 | `CT`        |
| AC-EQP-03-03 | `normalizeInviteCode`/`isValidInviteCode` aceitam "abcd-2345" e recusam códigos com 0, O, 1 ou I               | `UT`        |
| AC-EQP-03-04 | Senha e código não aparecem em log, no cache persistido nem na URL do login                                    | `REV`       |

## 10. Como testar manualmente (Victor)

Precisa de um código gerado pela EQP-01 (conta A, ADMIN) e de um **e-mail de teste novo**.

1. Saia da conta. No login, toque em "Tenho um convite"; digite o código com letras minúsculas:
   o campo mostra em maiúsculas. Veja o nome da clínica e o papel.
2. "Criar minha conta" com o e-mail novo e senha de teste → o app entra e abre a Início. Em
   Recursos → Equipe, a conta nova aparece na lista.
3. Repita o passo 1 com o mesmo código: "Convite inválido ou vencido…" (uso único).
4. Com uma conta já existente sem equipe: Perfil → "Entrar numa equipe" → código novo → abre a
   equipe.
5. Digite um código com "O" ou "1": a mensagem de formato aparece sem chamar o servidor.

## 11. Riscos e perguntas em aberto

- **`register` com `inviteCode` pode não sair na leva 2.** Padrão: sem ele, a EQP-03 entrega só
  o fluxo B (aceitar logado) e o link "Tenho um convite" fica fora até a rota existir.
- **E-mail de confirmação de conta:** a API atual não pede. Se o backend passar a pedir, a ficha
  é revista.
- O `register` responde `200` e não devolve token: o login automático depende de o `sign-in`
  funcionar logo em seguida (sem confirmação de e-mail).

## 12. Fora do escopo

Cadastro **sem** convite (continua fora do app); link mágico ou deep link (G-63); gestão da
equipe (EQP-02); recuperar senha (já existe).
