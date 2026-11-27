# Entrega 5 — Guia das pilhas de PRs

> **Atualização de 2026-11-27:** as duas pilhas foram **mergeadas na `main`** (merge commits, com os
> conflitos resolvidos como no §6), junto com o contrato real (#222); o PR de integração #219 foi
> fechado sem merge e o CI da `main` está verde. Este guia fica como **histórico** da ordem de
> revisão e de merge; o estado atual está no [TRACKING](TRACKING.md).

> Guia para quem revisa e mergeia a Entrega 5, escrito em 2026-11-26. O código foi feito
> **mock-first** (G-29) e ficou em **duas pilhas de PRs empilhados**, porque quase tudo depende
> de rotas que o backend ainda não publicou. O estado de cada tarefa está no
> [TRACKING](TRACKING.md), o resumo da entrega no [ENTREGA-5](ENTREGA-5.md) e o contrato pedido ao
> backend no [CONTRATOS-BACKEND](CONTRATOS-BACKEND.md).

## 1. Visão geral

- Já na `main` (do colega Victor): API-07 leva 1 (#189), ATV-04a (#190), ATV-04b (#191) e EVO-03
  (#192). Funcionam contra o backend atual (tipos opcionais e mocks).
- **Pilha A — atividades** (base `main`): banco de atividades, imprimíveis, criação dos tipos
  novos, limpeza de campos (FEC-06) e o plano de testes.
- **Pilha B — principal** (base `main`): contrato do backend, tipos e mocks das levas 2 a 4,
  agenda mensal e recorrente, equipe, permissões, paciente compartilhado, status e arquivamento,
  development build, push, central de ajuda e o app sem "Em breve".
- **PR de integração** `chore/e5-integracao` (base `feat/e5-qa-03-principal`, topo da pilha B):
  junta as duas pilhas, com os conflitos resolvidos e a suíte inteira rodada. **Não é para
  mergear**; serve para revisar e testar tudo de uma vez (§6).

Cada PR da pilha tem como base o PR anterior. O GitHub mostra no "Files changed" só o diff
daquele PR em relação à base, que é o que se revisa.

## 2. Pilha A — atividades

| Ordem | PR   | Branch                      | Base                        | Conteúdo                                                                                                | Leva do backend |
| ----- | ---- | --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| 1     | #195 | `feat/e5-atv-09`            | `main`                      | ATV-09: banco de atividades com filtros, prontas da biblioteca, duplicar e recomendação para o paciente | 1               |
| 2     | #196 | `feat/e5-atv-05`            | `feat/e5-atv-09`            | ATV-05: atividades imprimíveis, prévia e PDF no aparelho (`expo-print`)                                 | 1               |
| 3     | #199 | `feat/e5-atv-11`            | `feat/e5-atv-05`            | ATV-11: criar e editar os tipos novos (Forme a palavra, Associe as cores, Memória visual, imprimível)   | 1               |
| 4     | #201 | `feat/e5-fec-06`            | `feat/e5-atv-11`            | FEC-06: apagar próxima revisão, notas do plano, responsável e mídia da atividade (`null` / `""`)        | 3 (PP-05)       |
| 5     | #202 | `fix/e5-revisao-atividades` | `feat/e5-fec-06`            | Correções da revisão da pilha (ATV-09, ATV-05, ATV-11, FEC-06)                                          | —               |
| 6     | #204 | `docs/e5-qa-plano`          | `fix/e5-revisao-atividades` | QA-08, QA-02, QA-04: plano de testes manuais, fluxos Maestro (`.maestro/`) e roteiro de homologação     | —               |
| 7     | #217 | `feat/e5-qa-03-atividades`  | `docs/e5-qa-plano`          | QA-03 e QA-02: rótulos de acessibilidade e `testID` nas telas da pilha A                                | —               |

**Por que não vai para a `main` antes da leva 1:** desde a #195 a aba Atividades lista as
atividades do educador por `GET /task/catalog` e o detalhe chama `GET /task/skills`, que o backend
atual não tem; e a #201 envia `null` e `""`, que o backend atual recusa ou ignora (decisão dos
cards ATV-09 §11 e FEC-06). A pilha A inteira espera a **leva 1**, e a FEC-06 (#201) espera também
a **leva 3** (PP-05).

## 3. Pilha B — principal

| Ordem | PR   | Branch                         | Base                           | Conteúdo                                                                                            | Leva do backend          |
| ----- | ---- | ------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------ |
| 1     | #194 | `docs/e5-contratos-backend`    | `main`                         | `CONTRATOS-BACKEND.md`: contrato detalhado das levas 1 a 5                                          | —                        |
| 2     | #197 | `feat/e5-api-07-levas-2-4`     | `docs/e5-contratos-backend`    | API-07 levas 2 a 4: tipos, endpoints de leitura e mocks (equipe, status, séries, push, ajuda)       | — (mock-first, só tipos) |
| 3     | #198 | `feat/e5-age-05`               | `feat/e5-api-07-levas-2-4`     | AGE-05: visão mensal da agenda (`GET /appointment?from&to`, que já existe)                          | — (rota atual)           |
| 4     | #200 | `feat/e5-eqp-01`               | `feat/e5-age-05`               | EQP-01: equipe da clínica e convites (`/team`)                                                      | 2                        |
| 5     | #203 | `feat/e5-eqp-03`               | `feat/e5-eqp-01`               | EQP-03: criar conta e entrar na equipe pelo convite                                                 | 2                        |
| 6     | #205 | `feat/e5-eqp-02`               | `feat/e5-eqp-03`               | EQP-02: permissões por papel (`usePermissions`)                                                     | 2                        |
| 7     | #206 | `fix/e5-revisao-equipe-agenda` | `feat/e5-eqp-02`               | Correções da revisão (grade do mês da AGE-05, EQP-01, EQP-03)                                       | —                        |
| 8     | #207 | `feat/e5-eqp-04`               | `fix/e5-revisao-equipe-agenda` | EQP-04: paciente compartilhado ("Quem acompanha", selo "Compartilhado por")                         | 2                        |
| 9     | #208 | `feat/e5-pac-10`               | `feat/e5-eqp-04`               | PAC-10: status e pendências dos pacientes (`GET /student/overview`)                                 | 3                        |
| 10    | #209 | `feat/e5-pac-11`               | `feat/e5-pac-10`               | PAC-11: arquivar e reativar paciente                                                                | 3                        |
| 11    | #210 | `feat/e5-age-06`               | `feat/e5-pac-11`               | AGE-06: atendimentos recorrentes (séries)                                                           | 3                        |
| 12    | #211 | `fix/e5-revisao-pacientes`     | `feat/e5-age-06`               | Correções da revisão (EQP-04, PAC-11): fallback silencioso contra o backend atual                   | —                        |
| 13    | #212 | `feat/e5-bld-01`               | `fix/e5-revisao-pacientes`     | BLD-01: configuração do development build Android (`eas.json`, `expo-dev-client`, `pnpm start:dev`) | — (conta Expo)           |
| 14    | #213 | `feat/e5-not-02`               | `feat/e5-bld-01`               | NOT-02: push (`expo-notifications`) e preferências de notificação                                   | 4                        |
| 15    | #214 | `feat/e5-ajd-01`               | `feat/e5-not-02`               | AJD-01: central de ajuda com vídeos (`expo-video`)                                                  | 4                        |
| 16    | #215 | `fix/e5-revisao-push`          | `feat/e5-ajd-01`               | Correções da revisão (scripts da BLD-01, registro do push da NOT-02)                                | —                        |
| 17    | #216 | `feat/e5-nav-05`               | `fix/e5-revisao-push`          | NAV-05: app sem telas "Em breve"                                                                    | 2, 3 e 4 (destinos)      |
| 18    | #218 | `feat/e5-qa-03-principal`      | `feat/e5-nav-05`               | QA-03 e QA-02: rótulos de acessibilidade e `testID` nas telas da pilha B                            | —                        |

Desde a #211, toda chamada nova numa tela que já existia tem **fallback silencioso** (um `404`
sem código conhecido significa recurso ainda não publicado: compartilhamentos viram `[]`, a
clínica vira `null`, a lista por status cai para `GET /student/`). As telas novas (Equipe,
Ajuda, preferências de push) mostram erro contra o backend atual, o que é esperado.

## 4. Como revisar uma pilha

1. Abra os PRs **na ordem** das tabelas. Em cada um, revise só o "Files changed" (diff contra a
   base, que é o PR anterior). Cada corpo tem "O que muda", "Contrato do backend usado", "Como
   testar" com os critérios `AC-<ID>-NN`, "Testes automatizados", "Pilha" e "Limitações".
2. Para ver uma faixa da pilha de uma vez, compare as branches, por exemplo
   `git diff origin/feat/e5-eqp-01...origin/fix/e5-revisao-pacientes`.
3. Os PRs `fix/e5-revisao-*` corrigem os achados da revisão dos PRs logo abaixo; leia-os junto
   com eles.
4. Para testar com mocks uma tarefa isolada, faça checkout da branch dela; para testar tudo,
   use o PR de integração (§6).

## 5. Como mergear quando o backend publicar

Regra geral: **uma leva publicada → API-06** (registrar o contrato real no `PROJECT.md`, ajustar
tipos e mocks às diferenças) **→ merge dos PRs daquela leva**, de baixo para cima, com o CI verde.

### 5.1 Retarget das bases

Os PRs são mergeados **um de cada vez, a partir da base da pilha**. Depois de mergear um PR na
`main`:

1. troque a base do próximo PR para `main` (`gh pr edit <n> --base main`, ou "Edit" no título);
2. atualize a branch dele com a `main` (botão "Update branch" ou `git merge origin/main`), resolva
   conflitos se houver e espere o CI verde;
3. mergeie e repita com o seguinte.

Use **merge commit** (não squash) enquanto houver PRs empilhados acima: com squash, o PR seguinte
passa a mostrar no diff os commits já mergeados e precisa de rebase. Se a branch de um PR mergeado
for apagada, o GitHub faz o retarget do PR seguinte para a `main` sozinho.

### 5.2 Ordem sugerida

| Passo | Quando                         | PRs                                                                                         |
| ----- | ------------------------------ | ------------------------------------------------------------------------------------------- |
| 1     | Já (não dependem de rota nova) | #194 (contratos), #197 (API-07 L2-4, só tipos e mocks), #198 (AGE-05)                       |
| 2     | Leva 1 publicada               | API-06 da leva 1; pilha A: #195, #196, #199                                                 |
| 3     | Leva 2 publicada               | API-06 da leva 2; pilha B: #200, #203, #205, #206, #207                                     |
| 4     | Leva 3 publicada               | API-06 da leva 3; pilha B: #208, #209, #210, #211; pilha A: #201 (FEC-06), #202, #204, #217 |
| 5     | Conta Expo e autorização       | #212 (BLD-01): pode entrar antes, se o usuário autorizar o development build                |
| 6     | Leva 4 publicada               | API-06 da leva 4; pilha B: #213, #214, #215, #216, #218                                     |

Observações:

- A pilha A só pode ir até a #199 com a leva 1; a #201 (FEC-06) espera a **leva 3**, e a #202, a
  #204 e a #217 ficam acima dela. Se a leva 3 demorar, dá para levar a #202 (correções) para a
  frente da #201 com um rebase, mas isso precisa de cuidado: ela corrige arquivos das quatro.
- A pilha B segue a ordem das levas 2 → 3 → 4. Se o backend publicar fora de ordem, a pilha
  espera: os PRs acima dependem do código dos de baixo.
- A NAV-05 (#216) troca os "Em breve" pelos destinos novos (Equipe, Ajuda, status); só faz
  sentido depois que essas telas funcionarem contra o backend real.
- A QA-03 (#217 e #218) só acrescenta rótulos e `testID`; entra junto com o topo de cada pilha.
- O PR de integração (`chore/e5-integracao`) **não** é mergeado: depois que as duas pilhas
  estiverem na `main`, ele perde o sentido e é fechado.

## 6. Conflitos entre as pilhas

As duas pilhas partem da mesma `main` (`06f2d22`). O PR de integração fez
`git merge --no-ff origin/feat/e5-qa-03-atividades` sobre `origin/feat/e5-qa-03-principal`.
Arquivos tocados pelas duas pilhas e como cada um ficou:

| Arquivo                                                | Resultado do merge | Resolução                                                                                                                                                                              |
| ------------------------------------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/patients/detail/PatientDetailScreen.tsx` | conflito           | Ficam os três botões: "Iniciar sessão" e "Atividades para {nome}" (ATV-09) só para paciente **não arquivado** (PAC-11), e "Arquivar paciente" só para o dono de paciente não arquivado |
| `src/mocks/README.md`                                  | conflito           | As duas seções ficam: "Equipe, status, recorrência, push e ajuda (API-07, levas 2 a 4)" e, depois dela, "Apagar campos (FEC-06, PP-05)"                                                |
| `src/components/ds/DsButton.tsx`                       | automático         | A mesma mudança nas duas pilhas (`testID` da QA-03); nenhum conflito                                                                                                                   |
| `src/components/ds/Field.tsx`                          | automático         | Idem                                                                                                                                                                                   |
| `src/features/auth/LoginForm.tsx`                      | automático         | `testID` de login (pilha A) sobre o fluxo do convite (pilha B)                                                                                                                         |
| `src/features/plans/detail/PlanDetailScreen.tsx`       | automático         | FEC-06 (apagar próxima revisão e notas) sobre a QA-03 da pilha B                                                                                                                       |

Outros pontos de contato (`src/mocks/install.ts`, `TaskDetailScreen`, `ResourcesScreen`) só foram
mudados por uma das pilhas e não conflitam. Quando as pilhas forem mergeadas na `main`, quem
mergear a segunda pilha vai ver os mesmos dois conflitos e deve resolvê-los do mesmo jeito.

## 7. Testar tudo de uma vez pelo PR de integração

```bash
git fetch origin
git switch -c teste-e5 origin/chore/e5-integracao
pnpm install --frozen-lockfile
# .env (não versionado): EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_USE_MOCKS=true pnpm start --clear                       # sem equipe
EXPO_PUBLIC_USE_MOCKS=true EXPO_PUBLIC_MOCK_TEAM=admin pnpm start --clear         # administrador(a)
EXPO_PUBLIC_USE_MOCKS=true EXPO_PUBLIC_MOCK_TEAM=professional pnpm start --clear  # profissional
```

- Login no mock: `educadora.mock@labirinto.test` com qualquer senha.
- `EXPO_PUBLIC_MOCK_TEAM` escolhe o cenário de equipe (`none`, o padrão; `admin`;
  `professional`). Convites válidos: `AB3K7MPQ` (profissional) e `KM4W9RTD` (administrador);
  `TENTAT22` responde `429`.
- Os cenários e as lacunas dos mocks estão em `src/mocks/README.md`; o roteiro de casos por
  tarefa, no [PLANO-TESTES](PLANO-TESTES.md), e os fluxos Maestro em `.maestro/`.
- `pnpm start` abre no Expo Go. Push (NOT-02) só funciona num development build
  (`pnpm start:dev`, BLD-01); no Expo Go a tela de preferências funciona e o registro do token é
  ignorado.
