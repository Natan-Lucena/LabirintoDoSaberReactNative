# Entrega 3: o que foi feito

> Resumo consolidado da Entrega 3, escrito em 2026-10-29. O registro canônico do progresso
> continua sendo o [TRACKING](TRACKING.md); as fichas estão no [BACKLOG](BACKLOG.md), o plano
> e as decisões no [ROADMAP](ROADMAP.md) e o roteiro da rodada manual no
> [PLANO-TESTES](PLANO-TESTES.md).

## 1. Resumo

- **Objetivo:** fechar a V1 da Entrega 2, completar as quatro abas do app com o que a API
  permite e entregar o domínio **Planos com IA** (PDI e PE).
- **23 das 27 tarefas estão na `main`** (PRs #78 a #111): todas as tarefas de código e o roteiro
  de testes. A suíte tem **933 testes** (eram 763 no início), e typecheck, lint, testes e bundle
  Android passam no CI.
- **Faltam 4 tarefas, todas de validação** no emulador e em aparelhos (seção 5). Pela regra
  combinada com o usuário, o emulador só roda depois de todas as tarefas de código e quando ele
  autorizar.
- O trabalho foi **faseado**: cada fase terminou com os PRs revisados, CI verde, merge e um PR de
  documentação, e só seguiu com a autorização do usuário.

## 2. O que o app ganhou

| Área          | O que o profissional consegue fazer                                                                                                                                                                                                                                                                                                                                                  | Tarefas e PRs                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Agenda        | Ver a semana dia a dia (atendimento atual em destaque, concluídos e cancelados); agendar com paciente, data, horário, tipo e duração; ver o detalhe e remarcar, editar, concluir, cancelar sem apagar, reativar e excluir; ser avisado de conflito de horário; iniciar a sessão pelo atendimento (que fica concluído ao encerrar); enviar lembrete pelo WhatsApp com mensagem pronta | AGE-01 (#79), AGE-03 (#90), AGE-04 (#92), AGE-02 (#97)                    |
| Pacientes     | Editar o paciente e o responsável (nome, telefone e parentesco); contatar o responsável pelo WhatsApp; montar modelos de anamnese; preencher, ver e editar a anamnese do paciente, com anexo; ver a aba "Planos" e o "PDI vigente" na ficha                                                                                                                                          | PAC-07 (#94), PAC-08 (#88), PAC-06 (#100), PAC-04 (#105)                  |
| Planos com IA | Ver a lista de planos; gerar um PDI ou PE com IA; editar o rascunho, salvar e compartilhar; abrir o plano com metas e progresso, mudar o status das metas, editar, registrar revisões e encerrar; pedir sugestões da IA e aceitar ou descartar; ver o cartão de sugestões na Início                                                                                                  | PLN-01 (#101), PLN-02 (#103), PLN-03 (#106), PLN-04 (#108), PLN-05 (#111) |
| Conta         | Abrir o perfil (foto, nome, contato e profissão) e **sair da conta**, que antes não existia                                                                                                                                                                                                                                                                                          | REC-02 (#95)                                                              |
| Sessão        | A sessão fica ligada ao caderno no servidor, o que permite retomá-la em outro aparelho                                                                                                                                                                                                                                                                                               | SES-05 (#89)                                                              |
| Conteúdo      | Detalhe da atividade no visual novo; grupo de outro educador dentro de um caderno abre só para leitura                                                                                                                                                                                                                                                                               | ATV-02 (#81), FEC-03 (#82), FEC-04 (#98)                                  |
| Base          | Telas antigas da Entrega 1 removidas; o app usa o backend real por padrão (mocks só com `EXPO_PUBLIC_USE_MOCKS=true`); tipos e mocks alinhados ao contrato de 2026-10-29                                                                                                                                                                                                             | NAV-03 (#78), FEC-02 (#80), API-03 (#86)                                  |
| Qualidade     | Roteiro de testes manuais da Entrega 3, com 116 casos, fluxos entre telas e checklist de acessibilidade                                                                                                                                                                                                                                                                              | QA-06 (#110)                                                              |

O PR #84 corrigiu um teste instável da ATV-02. Os PRs de documentação de cada fase foram #76,
#77, #83, #85, #87, #91, #93, #96, #99, #102, #104, #107, #109 e #112.

## 3. Decisões tomadas na entrega

| Gate | Decisão                                                                             |
| ---- | ----------------------------------------------------------------------------------- |
| G-47 | A limpeza da Entrega 1 removeu só o que sobrou sem uso (substituiu a proposta G-33) |
| G-48 | Planos com IA foi o único domínio novo pedido ao backend                            |
| G-49 | Troca de senha fica fora do perfil                                                  |
| G-50 | Modelos de anamnese entraram na entrega                                             |
| G-51 | Mocks desligados por padrão em desenvolvimento                                      |
| G-52 | Sugestões da IA geradas sob demanda ("Pedir sugestões da IA")                       |
| G-53 | WhatsApp por botão `wa.me` com mensagem pronta, sem envio automático                |

Detalhes em [GATES](../entrega-1/GATES.md).

## 4. Pontos de implementação que vale saber

- **Erros com corpo:** o `ApiError` central guarda só a mensagem. O conflito de horário
  (`AppointmentApiError`, em `src/api/endpoints/appointment.ts`) e o PDI ativo existente
  (`PlanApiError`, em `src/api/endpoints/plans.ts`) leem o corpo do `409` localmente.
- **401 e logout:** o interceptor do cliente HTTP trata qualquer 401 como sessão expirada. Por
  isso a anamnese do paciente usa só a listagem por paciente, sem o detalhe por id.
- **Cache de planos:** todas as consultas de planos ficam sob o prefixo `["plan"]`
  (`planQueryKeys.all`), que é invalidado depois de qualquer escrita.
- **Destinos de planos** centralizados em `src/features/plans/routes.ts`.
- **Formulário de plano** comum à criação e à edição: `src/features/plans/draft/PlanForm.tsx`.
- **WhatsApp:** `src/utils/whatsapp.ts` monta o link e as mensagens (telefone do responsável,
  senão o do paciente).
- **Limitações conhecidas:** não é possível apagar um responsável já salvo nem limpar a próxima
  revisão e as notas de um plano (o servidor trata vazio como "não enviado").
- **Desvio de processo registrado:** na PAC-06 e na PLN-05, os testes foram escritos junto com
  a implementação, sem o vermelho registrado antes.

## 5. O que falta

| Tarefa | O que é                                                                                                                                                          | Precisa de                                     |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| FEC-01 | Exercitar no app, contra o backend real, as rotas da V1 que nunca rodaram (editar e excluir caderno, grupo e atividade; histórico de snapshots; últimas sessões) | Emulador, com autorização do usuário           |
| —      | Validação manual de todas as telas da Entrega 3 pelo [PLANO-TESTES](PLANO-TESTES.md)                                                                             | Emulador                                       |
| QA-02  | Fluxos automáticos com Maestro                                                                                                                                   | Emulador e autorização para instalar o Maestro |
| QA-03  | Acessibilidade (TalkBack, fonte grande, contraste e alvos de toque)                                                                                              | Emulador                                       |
| QA-04  | Homologação em Android físico e iOS                                                                                                                              | Aparelho Android e Mac ou iPhone               |

Cada uma tem roteiro detalhado em [testes/](testes/01-agenda.md) (o [PLANO-TESTES](PLANO-TESTES.md) é o
índice), com o resultado esperado, o código relacionado e o que verificar se falhar. As 28
[divergências](testes/00-divergencias.md) encontradas ao escrever os casos serão confirmadas na
rodada.

**Nenhuma tela da Entrega 3 foi aberta no app ainda:** tudo foi validado por testes automatizados
e pelo bundle Android no CI.

## 6. Como rodar

```bash
pnpm install --frozen-lockfile
# .env (não versionado):
#   EXPO_PUBLIC_APP_ENV=development
#   EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app
#   (mocks ficam desligados por padrão; para usar dados fictícios: EXPO_PUBLIC_USE_MOCKS=true)
pnpm start --clear
```

Com `EXPO_PUBLIC_USE_MOCKS=true`, o login fictício é `educadora.mock@labirinto.test` /
`senha123`.
