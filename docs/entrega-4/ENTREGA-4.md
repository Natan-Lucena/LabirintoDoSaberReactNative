# Entrega 4: o que foi feito

> Resumo consolidado da Entrega 4, escrito em 2026-11-13. O registro canônico do progresso
> continua sendo o [TRACKING](TRACKING.md); as fichas estão no [BACKLOG](BACKLOG.md), o plano e
> as decisões no [ROADMAP](ROADMAP.md), o contrato publicado pelo backend em
> [BACKEND-ENTREGUE](BACKEND-ENTREGUE.md) e o roteiro da rodada manual no
> [PLANO-TESTES](PLANO-TESTES.md).

## 1. Resumo

- **Objetivo:** fechar o **ciclo clínico** do app, que antes terminava com a sessão:
  `atendimento → sessão → evolução → prontuário → avaliação → plano → relatório`. A entrega também
  corrigiu o fluxo de **senha** e acrescentou as **notificações** dentro do app.
- **As 25 tarefas estão concluídas** (PRs #152 a #179): código integrado ao backend publicado,
  roteiro de testes e rodadas manuais. O CI (documentação, typecheck, lint, testes e bundle
  Android) ficou verde em todos os PRs, e cada PR passou por revisão de código antes do merge.
- **Validação:** as rodadas manuais no emulador Android, contra o backend real, foram feitas pelo
  orquestrador e pelo colega Victor (issue #168). Os defeitos encontrados foram corrigidos (PR
  #179 e o PR de correções dos relatórios) e reverificados. Esta entrega é apresentada como
  validada.
- O backend publicou **as cinco levas** pedidas na
  [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md), e o app foi integrado ao contrato real.
- O trabalho foi **faseado**, com no máximo dois workers ao mesmo tempo, **uma tarefa por PR** e
  merge só com CI verde.

## 2. O que o app ganhou

| Bloco | Área                 | O que o profissional consegue fazer                                                                                                                                                                                                                                                                                                          | Tarefas e PRs                                                                                                             |
| ----- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| A     | Senha                | Recuperar a senha com **código de 6 dígitos** enviado por e-mail (com reenvio e limite de tentativas); **trocar a senha** no perfil sem sair da conta                                                                                                                                                                                        | AUT-01 (#157, #173), REC-03 (#159, #173)                                                                                  |
| A     | Pendências da E3     | Foto na escolha do paciente, destaque da Início e da Agenda que atualiza e fim dos avisos de API obsoleta                                                                                                                                                                                                                                    | FEC-05 (#154)                                                                                                             |
| B     | Evolução da sessão   | Ao finalizar a sessão, registrar a **evolução** (critérios, estado das metas e registro descritivo) no lugar da observação; ver o **prontuário** do paciente, o detalhe e o **hub** de evolução (pendentes e recentes); pedir à IA a **sugestão para a próxima sessão**; chegar à evolução pela Início, pela Agenda e pela ficha do paciente | EVO-01 (#158, #173), EVO-02 (#161, #173), EVO-04 (#165, #173), EVO-05 (#164, #173)                                        |
| C     | Avaliações e escalas | Abrir o **hub de avaliações**; **aplicar uma escala** pergunta a pergunta, com escore e faixa vindos do servidor; gerar o **insight** da IA; **concluir**, ver o **resultado** e retomar ou descartar **rascunhos**; ver a aba **Avaliações** na ficha; gerar a **síntese da anamnese** com IA                                               | AVA-01 (#162, #176), AVA-02 (#163, #176), AVA-03 e AVA-05 (#166, #176), AVA-04 (#167, #176), PAC-05 e PAC-09 (#169, #176) |
| D     | Relatórios           | **Configurar o relatório** (paciente, tipo, período, seções e audiência), com **síntese da IA**; ver a prévia, gerar o **PDF no aparelho**, **imprimir** e **compartilhar**; reabrir o **histórico** de relatórios                                                                                                                           | REL-01 e REL-02 (#174), REL-03 (#177)                                                                                     |
| E     | Notificações         | **Sino** com contador, **lista** paginada, abrir o destino da notificação e marcar como lida (uma ou todas); atalhos em **Recursos** e na **Início** para os domínios entregues, sem "Em breve"                                                                                                                                              | NOT-01 (#175), NAV-04 (#177)                                                                                              |
| Base  | Contrato e tipos     | Tipos, leitura e mocks de cada leva; rotas novas e contrato de planos no `PROJECT.md`                                                                                                                                                                                                                                                        | API-04 (#153, #172, #178), API-05 (#155, #160, #171)                                                                      |
| F     | Qualidade            | Roteiro de testes manuais da Entrega 4 e rodadas no emulador                                                                                                                                                                                                                                                                                 | QA-07 (#156 e rodadas na issue #168)                                                                                      |

Foram **12 telas novas** (o mesmo número da Entrega 3) e 6 alteradas, listadas no
[ROADMAP §4](ROADMAP.md#4-telas). Os PRs de documentação foram #152, #170, #172 e #178.

## 3. Integração com o backend

- O backend publicou **todas as cinco levas**: senha e evolução, escalas e síntese da anamnese,
  relatórios e notificações, mais os pequenos pedidos (por exemplo `GET /appointment?from&to` e a
  unidade de `timeToAnswer`). O contrato entregue está no [BACKEND-ENTREGUE](BACKEND-ENTREGUE.md).
- Até cada leva sair, o app trabalhou com mocks fiéis à especificação (G-29). Depois, **INT-1
  (#173)** e **INT-2 (#176)** trocaram os mocks pelo contrato real, e os relatórios e as
  notificações (#174, #175) foram feitos direto sobre ele. Os mocks e os tipos passaram a seguir o
  BACKEND-ENTREGUE.
- Diferenças em relação à especificação que o app trata (resumo; a lista completa está em
  [BACKEND-ENTREGUE §5](BACKEND-ENTREGUE.md#5-diferenças-em-relação-à-especificação-do-app)):
  - **Critérios da evolução:** sem PE na sessão, vêm do **PDI ativo**; a tela mostra "PDI · título"
    ou "PE · título", e o app envia o `planId` do contexto ao salvar.
  - **Evolução existente:** o contexto devolve `existingEvolutionId`, e o app abre o registro.
  - **Troca de senha:** `update-password` responde o texto "OK" (o app volta ao login), e todo
    token antigo passa a dar 401; a troca no perfil grava o token novo e continua logado.
  - **Escalas:** escore e faixa vêm do servidor; iniciar a mesma escala para o mesmo paciente
    retoma o rascunho; insight sem resposta mostra a orientação de responder ao menos um item.
  - **Anamnese:** `summaryOutdated` só vem no GET, então a tela relê depois de editar.
  - **Relatórios:** a síntese da IA é gerada na criação e pode levar até 90 s; se a IA falhar, o
    relatório sai sem síntese e com aviso. O PDF é gerado no aparelho (`expo-print`).
  - **Notificações:** lista paginada por cursor; o destino de `AGENDA_DAY` é uma data.
  - **Erros novos** (`NO_ANSWERS_YET`, `INVALID_PERIOD`, `INVALID_CURSOR` e outros) e erros de
    validação por campo (`errors[].field`) aparecem na tela.

## 4. Decisões tomadas na entrega

| Gate | Decisão                                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| G-54 | Escopo: Evolução, Avaliações, Relatórios, Notificações no app e senha; Equipe, Ajuda e atividades jogáveis ficam fora                       |
| G-55 | Catálogo de escalas mantido pelo backend; a real depende do responsável clínico (fonte e licença)                                           |
| G-56 | Depois de finalizar a sessão, o app abre a Evolução no lugar da observação                                                                  |
| G-57 | Critérios da evolução vêm das metas do PE da sessão; **revisto** para aceitar o **PDI ativo como reserva**, como o backend entregou (EV-12) |
| G-58 | O backend monta o conteúdo, a síntese e o histórico do relatório; o app gera o PDF                                                          |
| G-59 | Notificações só dentro do app (sino e lista), sem push, enquanto o app rodar no Expo Go                                                     |
| G-60 | Pontuação parcial da escala aparece como "parcial"; a definitiva vem na conclusão                                                           |

E-10 (a contagem da Agenda exclui os cancelados) foi mantida como estava. Detalhes em
[GATES](../entrega-1/GATES.md).

## 5. Qualidade e validação

- **CI:** documentação, typecheck, lint, testes e bundle Android verdes em todos os PRs.
- **Revisão de código** por agente em cada PR, antes do merge.
- **Rodadas manuais** no emulador Android (Expo Go), seguindo o [PLANO-TESTES](PLANO-TESTES.md),
  com a descrição e os comentários da issue #168 como roteiro e registro:
  - uma rodada com mocks pelo colega Victor, que registrou dezenas de casos e apontou os defeitos;
  - rodadas contra o backend real pelo orquestrador e pelo Victor, com a conta de teste e só
    pacientes fictícios.
- **Defeitos corrigidos:** o PR #179 tratou o Voltar do Android na aplicação da escala (AVA-02.2),
  o hub filtrado e empilhado depois de descartar o rascunho (AVA-05.2), a rolagem até o campo com
  erro na evolução (EVO-01.4), o teclado sobre "Aguarde N s…" (AUT-01.5), o login empilhado depois
  do logout (AUT-01.6), a mensagem de senha atual que não sumia (REC-03.2), o título do player
  colado na barra de status (FEC-05.4) e o ajuste do roteiro. Os defeitos dos relatórios achados
  nas rodadas com o backend real foram corrigidos em PR próprio. Todos foram reverificados.

## 6. Pontos de implementação que vale saber

- **Troca de senha invalida tokens:** o interceptor trata o 401 como sessão expirada, inclusive em
  outro aparelho; só a troca no perfil guarda o token novo.
- **Escore e insight vêm do servidor:** o app não calcula escore nem interpreta; o aviso clínico
  fica sempre visível e a IA não faz diagnóstico.
- **PDF:** gerado no aparelho; o arquivo temporário é apagado depois de compartilhar e nenhum
  conteúdo vai para log.
- **Relatório "seguro por padrão":** o app tira as seções sensíveis para as audiências FAMILY e
  SCHOOL.
- **Cache:** a invalidação segue o padrão por prefixo das consultas, como nos planos da Entrega 3.

## 7. O que fica fora e próximos passos

| Item                                                                                         | Situação                                                                  |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Equipe e convites (EQP-01, EQP-02)                                                           | Entrega à parte: muda o modelo para clínica com vários educadores         |
| Central de ajuda (AJD-01)                                                                    | Falta conteúdo e `expo-video`                                             |
| Atividades jogáveis e imprimíveis, resultado de atividade na sessão (ATV-04, ATV-05, EVO-03) | Exigem tipos novos de tarefa no backend                                   |
| Push das notificações                                                                        | Exige development build (G-59)                                            |
| Escala clínica real (G-55)                                                                   | Hoje só a escala fictícia de demonstração; depende do responsável clínico |
| RP-02: nome completo do paciente no relatório SCHOOL                                         | Pendente de decisão do produto com o backend                              |
| Repetição diária das notificações enquanto a pendência existir                               | Pendente de decisão do produto; mudança pequena no backend                |
| `timeToAnswer` antigo (respostas anteriores a 2026-10-09 em segundos, não migradas)          | Limitação conhecida do backend                                            |
| QA-02 (Maestro), QA-03 (acessibilidade com TalkBack) e QA-04 (Android físico e iOS)          | Seguem para a próxima entrega, ampliados com as telas novas               |
| WhatsApp automático, recorrência e visão mensal da agenda                                    | Fora de escopo                                                            |

Homologação iOS só conta com evidência em Mac ou iPhone; nada disso foi declarado validado.

## 8. PRs por tarefa

| Tarefa | PR(s)            |
| ------ | ---------------- |
| API-04 | #153, #172, #178 |
| API-05 | #155, #160, #171 |
| FEC-05 | #154             |
| AUT-01 | #157, #173       |
| REC-03 | #159, #173       |
| EVO-01 | #158, #173       |
| EVO-02 | #161, #173       |
| EVO-04 | #165, #173       |
| EVO-05 | #164, #173       |
| AVA-01 | #162, #176       |
| AVA-02 | #163, #176       |
| AVA-03 | #166, #176       |
| AVA-04 | #167, #176       |
| AVA-05 | #166, #176       |
| PAC-05 | #169, #176       |
| PAC-09 | #169, #176       |
| REL-01 | #174             |
| REL-02 | #174             |
| REL-03 | #177             |
| NOT-01 | #175             |
| NAV-04 | #177             |
| QA-07  | #156, #179       |

Documentação e decisões: #152 (G-54 a G-60), #170 e #178 (tracking), #172 (contrato entregue).

## 9. Como rodar

```bash
pnpm install --frozen-lockfile
# .env (não versionado):
#   EXPO_PUBLIC_APP_ENV=development
#   EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app
#   (mocks ficam desligados por padrão; para usar dados fictícios: EXPO_PUBLIC_USE_MOCKS=true)
pnpm start --clear
```

Contra o backend real, use só a conta de teste e pacientes fictícios.
