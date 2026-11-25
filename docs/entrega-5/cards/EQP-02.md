# EQP-02 — Permissões por papel e gestão da equipe

| Campo             | Valor                                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------- |
| Bloco / onda      | C — Equipe · E5-6                                                                            |
| Classe / modelo   | B · Codex (ou Terra/Sonnet), esforço médio; **revisão A** (Opus) da regra de permissão       |
| Estimativa        | M · 5–7 h de worker                                                                          |
| Dependências      | EQP-01 na `main`; API-07 (equipe, com `Educator.clinic`); backend leva 2 (§4.4 e §4.5); G-62 |
| Estado do backend | **Mock-first**; integra quando a API-06 registrar a leva 2                                   |
| História          | US2-12                                                                                       |

## 1. Objetivo e valor

A administração da clínica precisa gerir a equipe (renomear, convites ativos, papéis, remover) e
cada profissional precisa ver o próprio papel e poder sair. A regra "quem pode o quê" fica num
**único lugar** (`usePermissions`), para nenhuma tela decidir sozinha.

## 2. Referência de design

- `.profile-banner` do `MoreScreen` (Recursos): nome e "Psicopedagoga · Administradora"
  ([ficha REC-02 da Entrega 2](../../entrega-2/BACKLOG.md)).
- A gestão (convites ativos, menu do membro) não tem desenho: `src/components/ds` (G-18), no
  mesmo padrão de confirmação por `Modal` do `AppointmentDetailScreen` e do `ProfileScreen`.

## 3. Fluxo do usuário

1. **Perfil e Recursos:** o banner e o cabeçalho do perfil mostram "{profissão} · {papel}"
   quando o educador está numa clínica (ex.: "Psicopedagoga · Administrador(a)"); sem
   profissão, só o papel; sem clínica, como hoje (profissão ou e-mail).
2. **ADMIN, na tela da equipe** (`/team`):
   - "Renomear" (ação do `SectionTitle` do nome) → `Modal` com `Field` "Nome da clínica" →
     `PUT /clinic/ { name }`.
   - Seção "Convites ativos" (`GET /clinic/invites`): código, papel e "Vale até dd/mm"; cada
     item com "Revogar" → confirmação "Revogar o convite {código}? Quem recebeu não conseguirá
     mais usá-lo." → `DELETE /clinic/invites/:id`. Sem convites: "Nenhum convite ativo".
   - Em cada membro (menos o próprio), "Gerenciar" abre um `Modal` com "Tornar
     administrador(a)" ou "Tornar profissional" (o papel que ele não tem) e "Remover da
     equipe". Cada ação pede confirmação:
     - papel: "Mudar o papel de {nome} para {papel}?" → `PUT /clinic/members/:educatorId { role }`;
     - remover: "Remover {nome} da equipe? Os pacientes dele(a) continuam com ele(a), e os
       compartilhamentos com a equipe são desfeitos." → `DELETE /clinic/members/:educatorId`.
3. **Todos, na tela da equipe:** "Sair da equipe" (`DsButton` `ghost` no fim) → confirmação
   "Sair da equipe {clínica}? Seus pacientes continuam com você, e os compartilhamentos são
   desfeitos." → `DELETE /clinic/members/{meu id}`. Depois do `204`, a tela volta ao estado
   "sem equipe" da EQP-01.
4. **PROFESSIONAL:** vê o nome, a lista e "Sair da equipe". Não vê cartão de convite,
   "Renomear", "Convites ativos" nem "Gerenciar".

## 4. Estados da tela

| Estado                                      | O que aparece                                                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Convites carregando / com erro              | Na seção: "Carregando convites" / "Não foi possível carregar os convites." + "Tentar de novo" (a lista de membros continua) |
| Ação em andamento                           | Botão de confirmação com `loading`; os demais desabilitados                                                                 |
| `409 LAST_ADMIN`                            | "A equipe precisa de pelo menos um administrador(a). Promova outra pessoa antes." A lista não muda                          |
| `403 FORBIDDEN_ROLE`                        | "Só a administração da equipe pode fazer isso." e refetch de `GET /clinic/` e `GET /educator/me` (o papel pode ter mudado)  |
| `404 MEMBER_NOT_FOUND` / `INVITE_NOT_FOUND` | "Este membro já saiu da equipe." / "Este convite já não existe." e refetch                                                  |
| Offline                                     | Mensagem de rede do `normalizeApiError`; nada muda na lista                                                                 |
| Sucesso                                     | `Toast`: "Nome atualizado", "Convite revogado", "Papel atualizado", "Membro removido", "Você saiu da equipe"                |

## 5. Contrato de dados

| Rota                                 | Corpo      | Resposta                                   | Erros                                            |
| ------------------------------------ | ---------- | ------------------------------------------ | ------------------------------------------------ |
| `GET /educator/me` (existente)       | —          | `Educator` + `clinic?: { id, name, role }` | —                                                |
| `PUT /clinic/`                       | `{ name }` | `200 ClinicView`                           | `400`; `403 FORBIDDEN_ROLE`; `404 NOT_IN_CLINIC` |
| `GET /clinic/invites`                | —          | `200 ClinicInvite[]`                       | `403 FORBIDDEN_ROLE`                             |
| `DELETE /clinic/invites/:id`         | —          | `204`                                      | `403`; `404 INVITE_NOT_FOUND`                    |
| `PUT /clinic/members/:educatorId`    | `{ role }` | `200 ClinicView`                           | `403`; `404 MEMBER_NOT_FOUND`; `409 LAST_ADMIN`  |
| `DELETE /clinic/members/:educatorId` | —          | `204`                                      | `403`; `404 MEMBER_NOT_FOUND`; `409 LAST_ADMIN`  |

- **Funções** em `src/api/endpoints/clinic.ts` (escritas desta tarefa; `listClinicInvites` pode
  vir da API-07): `renameClinic`, `listClinicInvites`, `revokeClinicInvite`,
  `updateClinicMemberRole`, `removeClinicMember`.
- **Chaves:** `clinicQueryKeys.invites() = ["clinic", "invites"]` (só `enabled` para `ADMIN`).
- **Invalidação:** as rotas que devolvem `ClinicView` fazem `setQueryData(clinicQueryKeys.view())`.
  Revogar invalida `["clinic", "invites"]`. Remover membro invalida `["clinic"]` e `["student"]`
  (os pacientes compartilhados com ele somem da lista). Mudar o próprio papel ou sair invalida
  também `["educator", "me"]`. Sair faz `setQueryData(view, null)` e invalida `["student"]`.
- **Papel do usuário:** vem de `GET /educator/me` (`homeQueryKeys.educator`, já carregado pelo
  `useHomeData` e pelo perfil), não de `GET /clinic/`, para Recursos e perfil não precisarem
  carregar a equipe.

## 6. Regras de negócio e casos de borda

1. `usePermissions()` em `src/features/permissions/usePermissions.ts` é a **única** fonte da
   regra de papel. Ele lê o `me` do cache e devolve:
   `{ role: TeamRole | null, inClinic, canInvite, canManageTeam, canLeaveTeam }`, calculados
   por uma função pura `permissionsFor(clinic?: Educator["clinic"])` em `permissions.ts`.
   `ADMIN`: tudo verdadeiro. `PROFESSIONAL`: só `inClinic` e `canLeaveTeam`. Sem clínica: tudo
   falso.
2. A `TeamScreen` da EQP-01 passa a usar `usePermissions` (o cartão de convite deixa de olhar
   `myRole`). Se `me.clinic.role` e `ClinicView.myRole` divergirem (cache velho), vale o
   servidor: o `403` refaz as duas leituras.
3. Último `ADMIN` (EQ-08): o app **não** esconde as ações (o servidor decide), mas mostra a
   mensagem do `409 LAST_ADMIN` e não altera a lista.
4. Sair ou remover leva os pacientes do dono e desfaz os compartilhamentos (EQ-09): o texto da
   confirmação diz isso; o app só invalida as listas.
5. O ADMIN não se gerencia pela lista: o próprio item não tem "Gerenciar" (sair é o botão do
   fim).
6. O papel é **controle de interface**, não segurança: toda decisão final é do servidor
   (`403`). O `usePermissions` não guarda nada no aparelho além do cache já existente.
7. Os pacientes compartilhados (`access`) **não** entram no `usePermissions`: a regra por
   paciente fica na EQP-04 (`isPatientOwner`), para as duas tarefas da onda E5-6 terem arquivos
   disjuntos.

## 7. Plano de implementação

1. `src/features/permissions/permissions.ts` (função pura) e `usePermissions.ts` (hook com
   `useQuery` de `homeQueryKeys.educator` / `getMe`, sem nova requisição se o cache existir).
2. Escritas em `src/api/endpoints/clinic.ts` + handlers em `src/mocks/handlers/clinic.ts` (estado
   em memória com dois membros fictícios, "Profissional Teste Um" e "Profissional Teste Dois";
   `409 LAST_ADMIN` quando o alvo é o único ADMIN) + testes pelo `apiClient` real.
3. `src/features/team/useClinic.ts`: mutações novas com `withOfflineGuard` e as invalidações do §5.
4. `src/features/team/TeamScreen.tsx` e `components/`: `RenameClinicDialog`, `InvitesSection`,
   `ManageMemberDialog`, `ConfirmDialog` local (mesmo visual dos `Modal` do perfil),
   "Sair da equipe".
5. `src/features/team/roles.ts`: `roleLabel` (já da EQP-01) e `professionAndRole(educator)`
   que monta "{profissão} · {papel}".
6. `src/features/profile/ProfileScreen.tsx`: a linha secundária do topo usa
   `professionAndRole` (só essa linha).
7. `src/features/resources/ResourcesScreen.tsx`: o banner usa `professionAndRole` (só o banner).

## 8. Arquivos

- **Permitidos:** `src/features/permissions/**` (novo), `src/features/team/**`,
  `src/api/endpoints/clinic.ts` (escritas), `src/mocks/handlers/clinic.ts`,
  `src/mocks/README.md` (acrescentar), `src/features/profile/ProfileScreen.tsx` (só a linha do
  papel), `src/features/resources/ResourcesScreen.tsx` (só o banner) e os testes dessas pastas.
- **Proibidos:** `src/api/types.ts`, `src/api/errors.ts`, `src/features/patients/**` (dona na
  onda: EQP-04), `app/(auth)/**`, `package.json`.

## 9. Critérios de aceite

| ID           | Critério                                                                                                                    | Verificação  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------ |
| AC-EQP-02-01 | Com papel `PROFESSIONAL`, a tela não mostra convite, "Renomear", "Convites ativos" nem "Gerenciar"; mostra "Sair da equipe" | `CT`         |
| AC-EQP-02-02 | `permissionsFor` cobre ADMIN, PROFESSIONAL e sem clínica; nenhuma tela compara `role` fora dele                             | `UT` + `REV` |
| AC-EQP-02-03 | `409 LAST_ADMIN` mostra a mensagem e a lista continua igual                                                                 | `CT`         |
| AC-EQP-02-04 | Banner de Recursos e perfil mostram "{profissão} · {papel}" com clínica, e o texto antigo sem                               | `CT`         |

## 10. Como testar manualmente (Victor)

Duas contas de teste: **A** (ADMIN da "Clínica Teste") e **B** (entrou como Profissional pela
EQP-03).

1. Com A: Recursos mostra "{profissão} · Administrador(a)". Na equipe, renomeie para "Clínica
   Teste 2"; veja "Convites ativos", revogue um.
2. Com A, "Gerenciar" em B → "Tornar administrador(a)" → B aparece como Administrador(a).
3. Com A, tente "Tornar profissional" em si mesmo saindo como último ADMIN (antes de promover B):
   aparece a mensagem de "pelo menos um administrador(a)".
4. Com B (Profissional): sem convite e sem "Gerenciar"; "Sair da equipe" volta ao estado sem
   equipe.

## 11. Riscos e perguntas em aberto

- **`GET /educator/me` sem `clinic`:** se a leva 2 não acrescentar o campo, o `usePermissions`
  passa a ler `GET /clinic/` (`myRole`), mantendo a mesma interface. Registrar na API-06.
- O ADMIN pode remover outro ADMIN? A especificação não proíbe. Padrão: o app permite; o
  servidor decide.

## 12. Fora do escopo

Acesso do ADMIN a todos os pacientes e relatórios da clínica (G-62); transferência de paciente
(`assign-educator`, continua fora do app); cadastro pelo convite (EQP-03).
