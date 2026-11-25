# EQP-01 — Equipe e convites

| Campo             | Valor                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Bloco / onda      | C — Equipe · E5-5                                                                                                                |
| Classe / modelo   | B · Codex (ou Terra/Sonnet), esforço médio                                                                                       |
| Estimativa        | M · 4–6 h de worker                                                                                                              |
| Dependências      | API-07 (equipe: tipos, `getClinic`, mocks); backend leva 2 (§4); G-62 e G-63 confirmados                                         |
| Estado do backend | **Mock-first**: rotas propostas na [especificação §4.5](../ESPECIFICACAO-BACKEND.md); integra quando a API-06 registrar a leva 2 |
| História          | US2-12 (convidar profissionais e ver a equipe)                                                                                   |

## 1. Objetivo e valor

Hoje "Equipe e convites", em Recursos, abre "Em breve". Esta tarefa entrega a tela da equipe:
criar a clínica, ver quem está nela e convidar um profissional por **código** (G-63), com a
mensagem pronta do servidor no `Share` do sistema. É a porta de entrada do trabalho em clínica
(EQP-02, EQP-03 e EQP-04 partem daqui).

## 2. Referência de design

- Figma Make `TeamScreen` (descrição das [fichas da Entrega 2](../../entrega-2/BACKLOG.md)):
  título "Equipe e convites" com eyebrow "Gestão da clínica"; `.invite-card` "Convide um
  profissional" com o botão (no design, "Compartilhar link de convite"); seção "Profissionais
  ativos" com a contagem; `.team-list` com avatar, nome, papel e `badge` "Ativo".
- **Ajuste de copy (G-63):** não há link, só código. O botão diz **"Compartilhar convite"**.
- O estado sem equipe não tem desenho: usa `src/components/ds` (G-18).
- **Lacuna:** o conector Figma desta sessão lista os arquivos do Make, mas não lê o código
  deles. O worker confere `TeamScreen` no Make antes de montar a tela, se tiver acesso.

## 3. Fluxo do usuário

1. Recursos → "Equipe e convites" → `router.push("/team")` (rota nova `app/team.tsx`).
2. A tela chama `GET /clinic/`.
   - `404 NOT_IN_CLINIC` → estado **sem equipe** (passo 3).
   - `200 ClinicView` → estado **com equipe** (passo 4).
3. Sem equipe: texto "Você ainda não faz parte de uma equipe." e duas ações:
   - **"Criar equipe"** abre o formulário (Field "Nome da clínica", 2–80 caracteres) e
     "Criar" chama `POST /clinic/ { name }`. No sucesso, a resposta `201 ClinicView` vira o
     cache de `GET /clinic/` e a tela mostra a equipe.
   - Texto de apoio: "Recebeu um código? Use 'Entrar numa equipe' no seu perfil." (o fluxo é da
     EQP-03; aqui é só texto, sem botão, para não depender da ordem dos PRs).
4. Com equipe:
   - cabeçalho `AppHeader` com `title="Equipe e convites"`, `subtitle="Gestão da clínica"` e
     voltar; abaixo, o nome da clínica (`clinic.name`);
   - **cartão de convite** (só quando `myRole === "ADMIN"`): título "Convide um profissional",
     `SegmentedControl` do papel ("Profissional" / "Administrador(a)", padrão "Profissional") e
     `DsButton` "Compartilhar convite";
   - seção "Profissionais ativos · N" (N = `members.length`) e a lista: `Avatar` (foto ou
     iniciais), nome, "{profissão} · {papel}" (só o papel se não houver profissão) e `Badge`
     "Ativo". O próprio educador aparece com "(você)" depois do nome.
5. "Compartilhar convite" → `POST /clinic/invites { role }` → `Share.share({ message:
invite.shareMessage })`. Depois do `Share` (enviado ou fechado), o cartão mostra o código
   (`invite.code`, fonte mono, com `accessibilityLabel` soletrado) e "Vale até dd/mm", com
   "Compartilhar de novo" (reabre o `Share` com a **mesma** mensagem, sem criar outro convite) e
   "Novo convite" (volta ao estado inicial do cartão).

## 4. Estados da tela

| Estado               | O que aparece                                                                                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carregando           | `ActivityIndicator` e "Carregando a equipe"                                                                                                                                |
| Erro de leitura      | "Não foi possível carregar a equipe." + `DsButton` "Tentar de novo" (refetch)                                                                                              |
| Sem equipe           | Texto do passo 3 e "Criar equipe"                                                                                                                                          |
| Com equipe           | Passo 4                                                                                                                                                                    |
| Offline com cache    | Os dados salvos (o cache é persistido) e o `PendingBanner` "Sem conexão - mostrando dados salvos"; "Criar" e "Compartilhar convite" falham com a mensagem abaixo           |
| Offline nas escritas | `withOfflineGuard` rejeita com `OfflineError` → "Sem conexão com a internet. Verifique a rede e tente novamente." (a mesma frase do `normalizeApiError` para erro de rede) |
| Sem permissão        | `PROFESSIONAL` não vê o cartão de convite. Se mesmo assim vier `403 FORBIDDEN_ROLE`: "Só a administração da equipe pode convidar." e a tela refaz `GET /clinic/`           |
| Erros de escrita     | `409 ALREADY_IN_CLINIC`: "Você já faz parte de uma equipe." e refetch; `409 TOO_MANY_INVITES`: "A equipe já tem 20 convites ativos. Revogue algum antes de criar outro."   |
| Validação            | Nome vazio ou fora de 2–80: "Informe entre 2 e 80 caracteres." (antes do envio); `400` com `errors[].field = name` marca o campo                                           |
| Sucesso              | `Toast` "Equipe criada"; depois do convite, o código no cartão                                                                                                             |

## 5. Contrato de dados

Rotas propostas ([especificação §4.3 e §4.5](../ESPECIFICACAO-BACKEND.md)); o contrato final é o
que a API-06 registrar no `PROJECT.md`.

| Rota                   | Corpo      | Resposta           | Erros tratados                                      |
| ---------------------- | ---------- | ------------------ | --------------------------------------------------- |
| `GET /clinic/`         | —          | `200 ClinicView`   | `404 NOT_IN_CLINIC` (estado vazio, não é erro)      |
| `POST /clinic/`        | `{ name }` | `201 ClinicView`   | `400`; `409 ALREADY_IN_CLINIC`                      |
| `POST /clinic/invites` | `{ role }` | `201 ClinicInvite` | `400`; `403 FORBIDDEN_ROLE`; `409 TOO_MANY_INVITES` |

- **Tipos** (`TeamRole`, `Clinic`, `ClinicMember`, `ClinicInvite`, `ClinicView`) vêm da API-07
  em `src/api/types.ts`; esta tarefa não altera esse arquivo.
- **Leitura** (API-07): `getClinic()` em `src/api/endpoints/clinic.ts`, que devolve
  `ClinicView | null` (converte o `404 NOT_IN_CLINIC` em `null`, para o estado vazio não virar
  erro nem `retry`). Chaves: `clinicQueryKeys = { all: ["clinic"], view: () => ["clinic",
"view"] }`.
- **Escritas** (esta tarefa, no mesmo arquivo): `createClinic({ name })` e
  `createClinicInvite({ role })`, com handlers de mock e teste pelo `apiClient` real.
- **Invalidação:** criar a clínica faz `setQueryData(clinicQueryKeys.view(), view)` e invalida
  `["educator", "me"]` (`homeQueryKeys.educator`: o `me` ganha `clinic`). O convite não muda a
  `ClinicView`; não invalida nada.
- **Cache:** `GET /clinic/` entra no cache persistido (não tem dado de paciente). O
  `ClinicInvite` **não** vai para o cache: fica no estado da tela (as mutações não são
  persistidas, `shouldDehydrateMutation: () => false`).
- **Mensagens novas** (API-07, em `normalizeApiError`): `ALREADY_IN_CLINIC`,
  `TOO_MANY_INVITES`, `FORBIDDEN_ROLE`, `NOT_IN_CLINIC`. Se a API-07 já as tiver, a tela usa
  `normalizeApiError(error).message`; senão, mapeia pelo `code` com as frases do §4.

## 6. Regras de negócio e casos de borda

1. Uma clínica por educador (EQ-01): sem botão de criar quando já há equipe; `409` é tratado.
2. Quem cria vira `ADMIN` (EQ-02): a tela usa `myRole` da resposta, não supõe.
3. Só o `ADMIN` convida (EQ-03): o cartão depende de `myRole === "ADMIN"`. A EQP-02 troca essa
   condição pelo `usePermissions`.
4. O texto do convite é **do servidor** (`shareMessage`, EQ-05): o app não monta mensagem,
   não acrescenta link e não guarda o código fora do estado da tela.
5. Fechar o `Share` sem enviar não desfaz o convite (ele já existe e conta no limite de 20):
   por isso "Compartilhar de novo" reaproveita o mesmo convite.
6. Validade de 7 dias: "Vale até dd/mm" com `expiresAt` formatado em `America/Sao_Paulo`.
7. Ordem dos membros: a do servidor (ADMIN primeiro, depois por nome); o app não reordena.
8. Papel em português, num só lugar (`src/features/team/roles.ts`): `ADMIN` →
   "Administrador(a)", `PROFESSIONAL` → "Profissional".
9. `Share.share` rejeitado (raro no Android): `Toast` "Não foi possível abrir o compartilhamento."
   e o código continua visível para copiar à mão.

## 7. Plano de implementação

1. `src/api/endpoints/clinic.ts`: acrescentar `createClinic` e `createClinicInvite` (a leitura é
   da API-07). Handlers de escrita em `src/mocks/handlers/clinic.ts` (estado em memória:
   criar clínica com o educador mock como `ADMIN`; convite com código fictício `ABCD2345`,
   `expiresAt` = agora + 7 dias e `shareMessage` no formato do EQ-05; `409 TOO_MANY_INVITES` a
   partir do 21º; `403` para um educador mock `PROFESSIONAL`). Seção curta no
   `src/mocks/README.md`.
2. `src/features/team/roles.ts`: rótulos dos papéis.
3. `src/features/team/useClinic.ts`: `useClinic()` (`useQuery` com `clinicQueryKeys.view()`),
   `useCreateClinic()` e `useCreateInvite()` (`useMutation` com `withOfflineGuard`).
4. `src/features/team/TeamScreen.tsx`: `SafeAreaView` com `edges={["left", "right",
"bottom"]}` + `AppHeader` (padrão das telas internas), `ScrollView`, estados do §4.
   Componentes locais: `CreateClinicForm`, `InviteCard` e `MemberRow` (em
   `src/features/team/components/`). Só componentes de `src/components/ds` e
   `StaticPressable` (G-44: nada de `style` em função no `Pressable`).
5. `app/team.tsx`: rota fina que renderiza `TeamScreen` (sem lógica, sem testes dentro de `app/`).
6. `src/features/resources/ResourcesScreen.tsx`: no item "Equipe e convites", `destination:
"/team"` (e acrescentar `"/team"` à união do tipo `destination`). Nada mais muda nesse
   arquivo.
7. Testes (§10) e verificação padrão.

## 8. Arquivos

- **Permitidos (novos):** `app/team.tsx`, `src/features/team/**` (inclui `__tests__/`),
  `src/mocks/handlers/clinic.ts` (só as escritas, se a API-07 já criou o arquivo).
- **Permitidos (alterar):** `src/api/endpoints/clinic.ts` (só as escritas),
  `src/features/resources/ResourcesScreen.tsx` (só o destino),
  `src/features/resources/__tests__/ResourcesScreen.test.tsx` (só o item de Equipe),
  `src/mocks/install.ts` e `src/mocks/README.md` (só acrescentar).
- **Proibidos:** `src/api/types.ts`, `src/api/errors.ts` (donos: API-07), `app/(auth)/**`,
  `src/features/profile/**`, `src/features/patients/**`, `package.json`.

## 9. Critérios de aceite

| ID           | Critério                                                                                                                                              | Verificação |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-EQP-01-01 | "Compartilhar convite" chama `POST /clinic/invites` com o papel escolhido e abre o `Share` com a `shareMessage` do servidor, sem texto montado no app | `CT`        |
| AC-EQP-01-02 | A lista e os papéis vêm de `GET /clinic/`; com `404 NOT_IN_CLINIC`, aparece "Criar equipe" (e não a tela de erro)                                     | `CT`        |
| AC-EQP-01-03 | `PROFESSIONAL` não vê o cartão de convite                                                                                                             | `CT`        |
| AC-EQP-01-04 | `createClinic` e `createClinicInvite` têm teste pelo `apiClient` real (sucesso e `409`)                                                               | `UT`        |
| AC-EQP-01-05 | Recursos → "Equipe e convites" abre `/team`                                                                                                           | `CT`        |

## 10. Como testar manualmente (Victor)

Android, Expo Go, backend real (ou `EXPO_PUBLIC_USE_MOCKS=true` antes da leva 2). Conta de
teste **A** sem equipe.

1. Recursos → "Equipe e convites": aparece "Você ainda não faz parte de uma equipe." e "Criar
   equipe".
2. "Criar equipe" com "Clínica Teste" → a tela mostra a equipe, você como "Administrador(a)" e
   "Profissionais ativos · 1".
3. Escolha "Profissional" e toque em "Compartilhar convite": abre o compartilhamento do Android
   com o texto "Use o código … para entrar na equipe Clínica Teste …". Feche-o: o código e
   "Vale até dd/mm" ficam no cartão.
4. "Compartilhar de novo" abre o mesmo texto (mesmo código).
5. Desligue a internet e toque em "Novo convite" → "Compartilhar convite": aparece a mensagem de
   sem conexão.

## 11. Riscos e perguntas em aberto

- **Rotas e nomes podem mudar na leva 2.** Padrão: seguir o que a API-06 registrar; a ficha é
  ajustada antes do dispatch.
- **`GET /clinic/` sem equipe:** a especificação propõe `404 NOT_IN_CLINIC`. Se o backend
  devolver `200` com corpo vazio ou `null`, o `getClinic()` da API-07 normaliza para `null`; a
  tela não muda.
- **Rótulo do papel** ("Administrador(a)" ou "Administradora" como no design): padrão
  "Administrador(a)", porque o app não sabe o gênero do profissional. Pergunta ao usuário.

## 12. Fora do escopo

Renomear a equipe, convites ativos, revogar, mudar papel, remover membro e sair (EQP-02);
cadastro e "Entrar numa equipe" pelo código (EQP-03); compartilhar paciente (EQP-04); convite
por e-mail ou link (G-63).
