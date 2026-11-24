# EQP-04 — Paciente compartilhado

| Campo             | Valor                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Bloco / onda      | C — Equipe · E5-6 (paralela à EQP-02; arquivos disjuntos). **Dona da ficha e da lista de pacientes nesta onda**                            |
| Classe / modelo   | B · Codex (ou Terra/Sonnet), esforço médio-alto                                                                                            |
| Estimativa        | M/G · 6–8 h de worker                                                                                                                      |
| Dependências      | EQP-01 na `main`; API-07 (equipe: `StudentShare`, `Student.access`, `ownerName`, `authorName`); backend leva 2 (§4.6, EQ-10 a EQ-13); G-62 |
| Estado do backend | **Mock-first**; a mudança de acesso em todas as rotas clínicas é a parte mais arriscada do backend (BE-EQ-05, BE-EQ-06)                    |
| História          | US5-04 (dividir o acompanhamento com uma colega)                                                                                           |

## 1. Objetivo e valor

Na clínica, a regra proposta (G-62) é: o paciente tem **um dono** e é **compartilhado
explicitamente** com colegas. O dono escolhe quem acompanha; a colega registra sessão,
evolução, plano e escala como o dono, mas não edita o cadastro, não compartilha e não arquiva.
Cada registro mostra quem fez.

## 2. Referência de design

Sem desenho próprio. A ficha segue o layout atual de `PatientDetailScreen` (seções com
`SectionTitle`); o selo usa `Badge` do `src/components/ds`; a escolha do colega usa a lista
`FeatureRow`/`Avatar` num `Modal`, como os outros diálogos do app.

## 3. Fluxo do usuário

**Dono, na ficha (aba "Visão geral"):**

1. Nova seção **"Quem acompanha"** depois do bloco do paciente: primeira linha "Você ·
   Responsável pelo cadastro"; depois cada `StudentShare` (avatar, nome, papel, "desde dd/mm")
   com a ação "Remover acesso".
2. `SectionTitle` com ação **"Compartilhar"** (só se o educador está numa clínica):
   - abre um `Modal` "Compartilhar com…" com os membros da equipe (`GET /clinic/`), sem o
     próprio educador e sem quem já tem acesso;
   - tocar num membro → confirmação "Compartilhar {paciente} com {colega}? Ela(e) poderá ver e
     registrar sessões, evoluções, planos, avaliações e relatórios." → `POST
/student/:id/shares { educatorId }`.
   - Sem equipe: em vez da ação, o texto "Entre numa equipe para compartilhar este paciente."
   - Equipe sem outros membros: no `Modal`, "Ninguém mais na equipe. Convide em Recursos →
     Equipe e convites."
3. "Remover acesso" → confirmação "Remover o acesso de {colega} a {paciente}? Os registros que
   ela(e) fez continuam no prontuário." → `DELETE /student/:id/shares/:educatorId`.

**Colega (acesso compartilhado):**

4. Na lista de pacientes, o cartão mostra o `Badge` **"Compartilhado por {ownerName}"** abaixo
   do nome.
5. Na ficha: o mesmo selo no topo; "Quem acompanha" mostra o dono ("{ownerName} ·
   Responsável") e os demais, **sem** "Compartilhar" e sem "Remover acesso"; a ação "Editar" de
   "Dificuldades mapeadas" some. Iniciar sessão, evolução, planos, avaliações e anamnese
   continuam.
6. Se o dono remover o acesso enquanto a colega está na ficha, a próxima leitura devolve `403`
   ou o paciente some da lista: a ficha mostra "Você não acompanha mais este paciente." com
   "Voltar para a lista" (`router.replace("/(tabs)/patients")`).

**Autoria (todos):**

7. Onde houver `authorName` (o servidor só manda quando o autor **não** é quem lê, EQ-12), a
   linha secundária ganha "por {authorName}": cartão e detalhe da evolução, detalhe do plano e
   histórico de relatórios.

## 4. Estados da tela

| Situação                          | O que aparece                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| "Quem acompanha" carregando       | "Carregando" na seção (a ficha não espera por ela)                                   |
| Erro em `GET /student/:id/shares` | "Não foi possível carregar quem acompanha." + "Tentar de novo"                       |
| Só o dono                         | "Só você acompanha este paciente."                                                   |
| `400 NOT_IN_SAME_CLINIC`          | "Esta pessoa não está mais na sua equipe." e refetch da equipe                       |
| `403` ao compartilhar/remover     | "Só quem cadastrou o paciente pode mudar quem acompanha." e refetch de `["student"]` |
| `404 SHARE_NOT_FOUND`             | Trata como sucesso (o acesso já foi removido) e refetch                              |
| Acesso perdido (`403` na ficha)   | "Você não acompanha mais este paciente." + "Voltar para a lista"                     |
| Offline                           | Mensagem de rede do `normalizeApiError`; a lista de quem acompanha não muda          |
| Sucesso                           | `Toast` "Paciente compartilhado" / "Acesso removido"                                 |

## 5. Contrato de dados

| Rota                                     | Corpo            | Resposta                                                    | Erros                                             |
| ---------------------------------------- | ---------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `GET /student/` (existente, muda)        | —                | `Student[]` com `access: "OWNER" \| "SHARED"` e `ownerName` | —                                                 |
| `GET /student/:id/shares`                | —                | `200 StudentShare[]`                                        | `403`; `404 STUDENT_NOT_FOUND`                    |
| `POST /student/:id/shares`               | `{ educatorId }` | `200 StudentShare[]`                                        | `400 NOT_IN_SAME_CLINIC`; `403`; `404`            |
| `DELETE /student/:id/shares/:educatorId` | —                | `200 StudentShare[]`                                        | `403`; `404 STUDENT_NOT_FOUND`, `SHARE_NOT_FOUND` |
| `GET /clinic/` (EQP-01)                  | —                | `ClinicView`                                                | `404 NOT_IN_CLINIC` → sem botão                   |

- **Funções** (novas, esta tarefa) em `src/api/endpoints/student-shares.ts`: `listStudentShares`,
  `shareStudent`, `unshareStudent`. Handlers em `src/mocks/handlers/student-shares.ts` (o mock de
  `GET /student/` da API-07 já marca um paciente fictício como `SHARED`, "Paciente Teste
  Compartilhado", dono "Profissional Teste Dois").
- **Chaves:** `studentShareKeys.list(id) = ["student", id, "shares"]` (sob `["student"]`, então
  qualquer invalidação de pacientes recarrega).
- **Escritas:** a resposta (`StudentShare[]`) vira `setQueryData(studentShareKeys.list(id))`.
  Nenhuma outra invalidação (a lista do dono não muda).
- **Tipos** (`StudentShare`, `Student.access?`, `Student.ownerName?`, `authorName?` nos tipos de
  evolução, plano e relatório) vêm da API-07.

## 6. Regras de negócio e casos de borda

1. **Dono** = `student.access !== "SHARED"` (campo ausente conta como dono: compatível com o
   backend antes da leva 2). Função única `isPatientOwner(student)` em
   `src/features/patients/shares/access.ts`; nenhuma tela compara `access` fora dela.
2. Só o dono compartilha e remove (EQ-10); compartilhar de novo com a mesma pessoa é
   idempotente: o app nem oferece (já tem acesso).
3. A colega **não** vê "Editar" (cadastro), "Compartilhar" nem, a partir da PAC-11, "Arquivar"
   (EQ-11). A PAC-11 usa `isPatientOwner`.
4. Quem sai ou é removido da equipe perde os compartilhamentos (EQ-09): a lista se ajusta pela
   invalidação de `["student"]` feita na EQP-02.
5. `authorName` ausente = o próprio leitor (ou backend antigo): nenhuma linha "por …".
6. Nada de dado de paciente na mensagem de confirmação além do nome que já está na tela.
7. Agenda: a colega só vê os atendimentos que ela mesma marcou (`GET /appointment/` é por
   educador). Isso é esperado; não há "atendimentos da equipe" nesta entrega.

## 7. Plano de implementação

1. `src/api/endpoints/student-shares.ts` + handlers + testes pelo `apiClient` real (sucesso,
   `400 NOT_IN_SAME_CLINIC`).
2. `src/features/patients/shares/`: `access.ts` (`isPatientOwner`), `useStudentShares.ts`
   (query + mutações com `withOfflineGuard`), `WhoFollowsSection.tsx`, `ShareWithDialog.tsx`
   (lê `useClinic` de `src/features/team/useClinic.ts`, sem alterar a equipe).
3. `src/features/patients/detail/PatientDetailScreen.tsx`: seção "Quem acompanha", selo,
   esconder "Editar" para a colega, estado "Você não acompanha mais este paciente" quando
   alguma leitura da ficha (`useStudentSessions`, `usePatientEvolutions`; **não** a de shares, ver §11)
   devolver `403` ou quando o paciente sumir da lista **depois** de um `refetch` (não no primeiro
   carregamento, que continua "Paciente não encontrado").
4. `src/features/patients/list/PatientsListScreen.tsx`: `Badge` "Compartilhado por
   {ownerName}" no `PatientCard`.
5. Autoria: uma linha "por {authorName}" em `src/features/evolution/records/EvolutionSummaryCard.tsx`,
   `src/features/evolution/records/EvolutionDetailScreen.tsx`,
   `src/features/plans/detail/PlanDetailScreen.tsx` e
   `src/features/reports/history/ReportHistoryScreen.tsx` (só onde o tipo da API-07 tiver o
   campo; nada além da linha).

## 8. Arquivos

- **Permitidos:** `src/api/endpoints/student-shares.ts`, `src/mocks/handlers/student-shares.ts`,
  `src/mocks/install.ts` e `src/mocks/README.md` (acrescentar), `src/features/patients/shares/**`
  (novo), `src/features/patients/detail/**`, `src/features/patients/list/**` (só o selo), os
  quatro arquivos de autoria do passo 5 (só a linha) e os testes.
- **Proibidos:** `src/api/types.ts`, `src/api/errors.ts`, `src/features/team/**` (só leitura de
  `useClinic`), `src/features/permissions/**` (dona: EQP-02), `src/features/profile/**`.

## 9. Critérios de aceite

| ID           | Critério                                                                                   | Verificação |
| ------------ | ------------------------------------------------------------------------------------------ | ----------- |
| AC-EQP-04-01 | Só o dono vê "Compartilhar" e "Remover acesso"; a colega vê a lista sem ações              | `CT`        |
| AC-EQP-04-02 | Paciente `SHARED` aparece com "Compartilhado por {dono}" na lista e na ficha, sem "Editar" | `CT`        |
| AC-EQP-04-03 | `403` numa leitura da ficha mostra "Você não acompanha mais este paciente."                | `CT`        |
| AC-EQP-04-04 | Com duas contas fictícias, a colega registra uma evolução e o dono a vê com "por {autor}"  | `MAN`       |

## 10. Como testar manualmente (Victor)

Contas A (dona do "Paciente Teste Um") e B, na mesma equipe.

1. Com A: ficha do Paciente Teste Um → "Quem acompanha" → "Compartilhar" → escolha B → confirme.
2. Com B: o paciente aparece na lista com "Compartilhado por {A}". Abra a ficha: não há "Editar"
   nem "Compartilhar". Inicie uma sessão, finalize e registre a evolução.
3. Com A: na ficha, a evolução recente mostra "por {B}".
4. Com A: "Remover acesso" de B. Com B, puxe a lista para atualizar: o paciente some; se estava
   na ficha, aparece "Você não acompanha mais este paciente."

## 11. Riscos e perguntas em aberto

- **Notificações e agenda da colega** (EQ-14): a evolução pendente vai para quem conduziu a
  sessão. Conferir na QA-08 (caso de dois educadores).
- **Relatórios**: o relatório da colega aparece no histórico do dono? A especificação diz que
  sim (EQ-11). Se o backend restringir, o app só mostra o que vier.
- `GET /student/:id/shares` para a colega: a especificação não diz se ela pode ler. Padrão: o app
  chama e, se vier `403`, mostra só o dono (`ownerName`) sem erro.

## 12. Fora do escopo

Transferir o paciente (`assign-educator`); o ADMIN ver todos os pacientes (G-62); agenda da
equipe; permissões finas por tipo de registro.
