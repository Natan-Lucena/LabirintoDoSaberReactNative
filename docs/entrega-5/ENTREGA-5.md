# Entrega 5: o que foi feito

> Resumo consolidado da Entrega 5, escrito em 2026-11-26 e atualizado em 2026-11-27 (código na
> `main`, backend publicado e rodada no emulador). O registro canônico do progresso
> continua sendo o [TRACKING](TRACKING.md); as fichas estão no [BACKLOG](BACKLOG.md), o plano e
> as decisões no [ROADMAP](ROADMAP.md) e no [PLANO](PLANO.md), o contrato pedido ao backend em
> [CONTRATOS-BACKEND](CONTRATOS-BACKEND.md), o roteiro da rodada manual no
> [PLANO-TESTES](PLANO-TESTES.md) e a ordem de revisão e merge dos PRs em [PILHAS](PILHAS.md).

## 1. Resumo

- **Objetivo:** fechar o mapa do produto com o **banco de atividades** completo (jogos,
  imprimíveis e o resultado do jogo na evolução), a **equipe da clínica** (papéis, convites e
  paciente compartilhado), o **status e o arquivamento** dos pacientes, a **agenda mensal e
  recorrente**, o **push** (com development build) e a **central de ajuda**, mais a QA pendente.
- **O código das 25 tarefas está na `main`** desde 2026-11-27, mas a entrega **ainda não está
  concluída**: faltam o development build e o push (BLD-01, NOT-02), a QA com Maestro, TalkBack e
  aparelhos (QA-02, QA-03, QA-04) e os seeds de conteúdo em produção. O app foi feito
  **mock-first** (G-29) e depois alinhado ao contrato real do backend (API-06, #222).
- **Na `main`:** a pilha B (#194, #197, #198, #200, #203, #205 a #216, #218, #221, #223), o
  contrato real (#222) e a pilha A (#195, #196, #199, #201, #202, #204, #217, #220), mais os PRs
  anteriores #189 a #192 (API-07 leva 1, ATV-04a, ATV-04b, EVO-03). Os conflitos entre as pilhas
  foram resolvidos como no [PILHAS §6](PILHAS.md). O PR de integração #219 foi fechado sem merge:
  cumpriu seu papel de revisão e teste. O CI da `main` está verde.
- **Backend:** os PRs #35 a #42 dele eram empilhados e só o #35 chegou à `main`; o PR #43 levou o
  resto (merge em 2026-11-27) e a produção responde às rotas da Entrega 5. Os **seeds** da
  biblioteca e da ajuda ainda não foram rodados em produção (biblioteca e tutoriais vazios).
- **Validação:** typecheck, lint, Vitest/RNTL e bundle Android, mais **três rodadas no emulador
  Android** (mocks, backend local e produção; ver §8). Push e development build, Maestro,
  TalkBack e aparelhos físicos **não** foram testados.

## 2. O que o app ganhou

| Bloco | Área                     | O que o profissional consegue fazer                                                                                                                                                                 | Tarefas e PRs                                          |
| ----- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| A     | Contrato e tipos         | Contrato detalhado pedido ao backend (levas 1 a 5); tipos, endpoints de leitura e mocks de todas as levas                                                                                           | #194, API-07 (#189, #197); API-06 espera as levas      |
| A     | Pendências das E3 e E4   | **Apagar** a próxima revisão e as notas do plano, os dados do responsável e a mídia da atividade                                                                                                    | FEC-06 (#201, #202)                                    |
| B     | Banco de atividades      | Filtrar por formato, habilidade e origem; ver as **atividades prontas** da biblioteca e **duplicar para editar**; ver a **recomendação** para o paciente; abrir "Atividades para {nome}" pela ficha | ATV-09 (#195, #202)                                    |
| B     | Jogos                    | Jogar **Forme a palavra**, **Associe as cores** e **Memória visual**                                                                                                                                | ATV-04a (#190), ATV-04b (#191)                         |
| B     | Criar e editar           | Criar e editar os tipos novos (os três jogos e o imprimível), com mídia e habilidades                                                                                                               | ATV-11 (#199, #202)                                    |
| B     | Imprimíveis              | Ver a prévia, gerar o **PDF** no aparelho e imprimir ou compartilhar                                                                                                                                | ATV-05 (#196, #202)                                    |
| B     | Jogo na sessão           | Jogar durante a sessão, com o **resultado do jogo** registrado e mostrado na evolução, fora do acerto das análises (G-65)                                                                           | EVO-03 (#192)                                          |
| C     | Equipe                   | **Criar a equipe**, gerar e compartilhar **convites** (código de 8 caracteres), renomear, revogar convites, mudar papéis e remover membros, sair da equipe                                          | EQP-01 (#200, #206), EQP-02 (#205)                     |
| C     | Convite                  | **Criar conta pelo convite** ("Tenho um convite") ou **entrar numa equipe** pelo perfil                                                                                                             | EQP-03 (#203, #206)                                    |
| C     | Paciente compartilhado   | Compartilhar o paciente com um colega ("Quem acompanha"); ver o selo "Compartilhado por"                                                                                                            | EQP-04 (#207, #211)                                    |
| D     | Status dos pacientes     | Ver o **status** de cada paciente e as **pendências** (plano para revisar, avaliação, anamnese, evoluções), vindos do servidor                                                                      | PAC-10 (#208)                                          |
| D     | Arquivamento             | **Arquivar** (cancelando os atendimentos futuros) e **reativar** o paciente; lista de arquivados                                                                                                    | PAC-11 (#209, #211)                                    |
| D     | Agenda                   | **Visão mensal** com calendário; atendimentos **recorrentes** (semanal ou quinzenal, 2 a 26 ocorrências), editar e cancelar "só este" ou "este e os seguintes"                                      | AGE-05 (#198, #206), AGE-06 (#210)                     |
| E     | Development build e push | Configuração do **development build** Android (EAS); **push** das notificações e **preferências** por tipo                                                                                          | BLD-01 (#212, #215), NOT-02 (#213, #215)               |
| E     | Central de ajuda         | Tutoriais com **vídeo** (`expo-video`) ou passos em texto                                                                                                                                           | AJD-01 (#214)                                          |
| E     | Navegação                | App sem telas "Em breve": os 9 itens de Recursos e o banner do perfil abrem telas reais                                                                                                             | NAV-05 (#216)                                          |
| F     | Qualidade                | Plano de testes manuais, fluxos **Maestro** (`.maestro/`), roteiros de acessibilidade e de homologação em aparelhos; rótulos de acessibilidade e `testID` nas telas                                 | QA-08, QA-02, QA-04 (#204); QA-03 e QA-02 (#217, #218) |

Dependências novas (G-67, G-69): `expo-dev-client`, `expo-notifications` e `expo-video`. O
`pnpm start` passou a abrir no Expo Go (`--go`), e o development build usa `pnpm start:dev`.

## 3. Contrato com o backend

- O contrato pedido está no [CONTRATOS-BACKEND](CONTRATOS-BACKEND.md), em cinco levas: **1**
  atividades e resultado de jogo; **2** equipe; **3** status do paciente, recorrência e `null`
  (PP-05); **4** push e central de ajuda; **5** ajustes pequenos (G-71, G-72, PP-08, PP-10, PP-11).
- **As levas foram publicadas** (a produção responde às rotas da Entrega 5 desde o PR #43 do
  backend, 2026-11-27). A **API-06** (contrato real no `PROJECT.md`, tipos e mocks ajustados às
  diferenças) entrou no #222 e as pilhas foram mergeadas na sequência. Esta seção descreve o que
  foi pedido; o que o backend entregou está em [BACKEND-ENTREGUE](BACKEND-ENTREGUE.md).
- Telas que já existiam continuam funcionando contra o backend de hoje: toda chamada nova nelas
  tem **fallback silencioso** (`404` sem código conhecido = recurso ainda não publicado). As telas
  novas (Equipe, Ajuda, preferências de push) mostram erro contra o backend atual, o que é
  esperado.
- Exceções que **não podem ir para a `main` antes da leva**: a aba Atividades da pilha A
  (`GET /task/catalog` e `GET /task/skills`, leva 1) e a FEC-06 (`null` e `""`, leva 3).

## 4. Decisões tomadas na entrega

| Gate | Decisão                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| G-61 | Escopo: atividades, equipe, status dos pacientes, recorrência e visão mensal, push com development build, central de ajuda e QA |
| G-62 | Clínica com `ADMIN` e `PROFESSIONAL`; o paciente tem um dono e é compartilhado explicitamente; o `ADMIN` não vê os dos outros   |
| G-63 | Convite por código de 8 caracteres, uso único, 7 dias, enviado pelo `Share`; conta nova pelo "Tenho um convite"                 |
| G-64 | Forme a palavra, Associe as cores e Memória visual; atividades prontas por seed, só leitura, com "Duplicar para editar"         |
| G-65 | Resultado do jogo por sessão, fora do acerto das análises; aparece na evolução como informação                                  |
| G-66 | O backend guarda o conteúdo do imprimível; o app gera o PDF com `expo-print`                                                    |
| G-67 | Development build Android pelo EAS só para push e aparelhos; o dia a dia segue no Expo Go                                       |
| G-68 | Recorrência semanal ou quinzenal, 2 a 26 ocorrências gravadas; conflito pula a ocorrência                                       |
| G-69 | Conteúdo da ajuda no backend; vídeo pelo `expo-video`; sem vídeo, passos em texto                                               |
| G-70 | Paciente ativo ou arquivado; arquivar cancela os atendimentos futuros; status e pendências vêm do servidor                      |
| G-71 | Relatório `SCHOOL` com primeiro nome e inicial do sobrenome (backend, PP-06)                                                    |
| G-72 | Uma notificação por pendência, sem repetir todo dia (backend, PP-07)                                                            |

Detalhes em [GATES](../entrega-1/GATES.md).

## 5. Qualidade e validação

- **CI** (documentação, typecheck, lint, testes e bundle Android) verde em cada PR das pilhas.
- **Revisão de código** por agente nas duas pilhas; os achados foram corrigidos nos PRs
  `fix/e5-revisao-*` (#202, #206, #211, #215).
- **PR de integração** (#219, `chore/e5-integracao`, fechado sem merge): as duas pilhas juntas, com
  typecheck, lint, a suíte inteira (**1796 testes em 276 arquivos**) e
  `npx expo export --platform android` com código 0.
- **Rodada no emulador** (2026-11-26/27, §8): mocks, backend local e produção, com os resultados
  no [PLANO-TESTES](PLANO-TESTES.md).
- **Não feito:** fluxos Maestro (QA-02); TalkBack (QA-03); development build, push real e Android
  físico (BLD-01, NOT-02, QA-04); iOS. Nada disso foi declarado validado.

## 6. Pontos de implementação que vale saber

- **Permissões pelo papel:** `usePermissions` (EQP-02) lê o papel de `GET /educator/me`; sem
  equipe, o app se comporta como antes.
- **Cenários dos mocks:** `EXPO_PUBLIC_MOCK_TEAM=none|admin|professional` escolhe a equipe;
  convites válidos `AB3K7MPQ` e `KM4W9RTD`, `TENTAT22` responde `429`. Lista em
  `src/mocks/README.md`.
- **Push só no development build:** no Expo Go nada de `expo-notifications` é carregado e a tela
  de preferências mostra o aviso; o `projectId` vem de `extra.eas.projectId`, que o `eas init` da
  conta do dono grava (BLD-01).
- **PDF do imprimível:** gerado no aparelho, com o nome do paciente só no conteúdo, nunca no nome
  do arquivo.
- **Convite e senha:** nada do corpo vai para log; o código só circula em parâmetro de rota e em
  memória.

## 7. O que falta

| Item                                       | Situação                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Seeds da biblioteca e da ajuda em produção | Não rodados; biblioteca e tutoriais vazios em produção                                     |
| PR #44 do backend                          | Aberto: troca a carta COELHO por GATO no seed do jogo da memória (COELHO quebrava a linha) |
| PR de correções do teste no emulador       | Aberto: os defeitos 1 a 4 do §8                                                            |
| Voltar de "Atividades para {paciente}"     | Leva à aba Início em vez da ficha (P3); não corrigido                                      |
| Leva 5 (G-71, G-72, PP-08, PP-10, PP-11)   | Só backend; o app não muda                                                                 |
| Maestro (QA-02)                            | Fluxos escritos em `.maestro/`; falta autorizar a instalação e rodar no emulador           |
| TalkBack (QA-03)                           | Rótulos e `testID` no código; falta a conferência manual com TalkBack                      |
| Development build e push (BLD-01, NOT-02)  | Configuração pronta; falta a conta Expo, o `eas init`, a autorização do build e o teste    |
| Android físico e iOS (QA-04)               | Roteiro pronto; falta aparelho Android e Mac/iPhone                                        |
| Vídeos da central de ajuda                 | Dependem do conteúdo publicado pelo backend                                                |
| Escala clínica real (G-55)                 | Depende do responsável clínico; entra como dado                                            |

## 8. Validação no emulador (2026-11-26/27)

Emulador Android (AVD Medium_Phone, Android API 37) com o Expo Go, em três rodadas. As capturas
ficam guardadas fora do repositório (pasta prints-entrega-5). Resultado caso a caso no
[PLANO-TESTES](PLANO-TESTES.md).

1. **Mocks** (`EXPO_PUBLIC_USE_MOCKS=true`, cenários `admin` e `professional`), com uma branch
   local que reunia todos os PRs. OK: banco de atividades, filtros e recomendação "Recomendado
   para"; os três jogos; imprimíveis e PDF (o nome da criança não é salvo); criar "Forme a
   palavra" com a validação de "GAT0"; arquivar e reativar; lista com status e Pendências; equipe
   como admin e como profissional; `LAST_ADMIN`; convite com criação de conta e "senhas não
   conferem"; paciente compartilhado (o profissional não vê Editar, Compartilhar nem Arquivar);
   série semanal com prévia; resultado do jogo na sessão; central de ajuda; preferências de
   notificação.
2. **Backend da Entrega 5 rodando na máquina** (topo da pilha do backend, MongoDB em Docker,
   seeds de biblioteca, ajuda e escalas, contas fictícias), com mocks desligados. OK: catálogo com
   biblioteca; imprimível em sequência (depois da correção); duplicar atividade pronta; sessão com
   jogo ("Resultado registrado"); evolução com "Atividades da sessão" e relatório com "Atividades
   jogadas"; criar equipe e convite; conta nova pelo convite como Profissional; compartilhar e
   remover acesso; status vindos do servidor e Pendências; arquivar com 6 atendimentos futuros
   (segunda confirmação, "Manter" e cancelamento confirmado na API); Arquivados; reativar com
   toast; série semanal com 1 conflito pulado e "Ver atendimento"; mês com pontos; "Este e os
   seguintes" (conferido na API); remover responsável (FEC-06); central de ajuda sem vídeo;
   preferência de push salva no servidor; criar "Forme a palavra" (`POST /task/create` 201).
3. **Produção, depois do deploy do backend:** Atividades, Pacientes (Pendências), Equipe ("Você
   ainda não faz parte de uma equipe") e Ajuda ("Os tutoriais ainda não foram publicados")
   respondem.

**Defeitos encontrados** (os quatro primeiros estão no PR de correções do teste no emulador):

| #   | Defeito                                                                                          |
| --- | ------------------------------------------------------------------------------------------------ |
| 1   | A prévia do imprimível "Sequência" aparecia em branco                                            |
| 2   | O calendário do mês aparecia em inglês                                                           |
| 3   | "Convites ativos" não atualizava depois de criar um convite                                      |
| 4   | O aviso da série dizia "1 não foram criados"                                                     |
| 5   | Voltar de "Atividades para {paciente}" leva à aba Início em vez da ficha (P3); **não corrigido** |

Observação (não é defeito): a contagem "Semanal · N de M" conta só os atendimentos criados.

**Não testado:** push e development build (BLD-01 precisa de conta Expo e de autorização do build
nativo); vídeo da ajuda (sem conteúdo); IA, upload e e-mail no backend local (chaves falsas);
resultado de jogo recusado (403/404) e `LAST_ADMIN` no backend real; Maestro (QA-02); TalkBack
(QA-03); aparelhos (QA-04).

## 9. Números

- **25 tarefas** com o código na `main`; faltam as validações de BLD-01 e NOT-02 (development build
  e push), QA-02, QA-03 e QA-04.
- **28 PRs das pilhas mergeados** (8 da pilha A, 20 da pilha B) mais o #222 (contrato real); o PR de
  integração #219 foi fechado sem merge.
- **Testes:** **1796 testes em 276 arquivos** na suíte do PR de integração (a `main` tinha 1561
  depois da EVO-03); o total atual da `main` não foi recontado aqui.

## 10. Como rodar

```bash
pnpm install --frozen-lockfile
# .env (não versionado):
#   EXPO_PUBLIC_APP_ENV=development
#   EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app
#   Os mocks ficam desligados por padrão; para o modo mock: EXPO_PUBLIC_USE_MOCKS=true
#   Cenário de equipe nos mocks: EXPO_PUBLIC_MOCK_TEAM=none|admin|professional
pnpm start --clear      # Expo Go
pnpm start:dev          # development build (push)
```

Contra o backend real, use só a conta de teste e pacientes fictícios.
