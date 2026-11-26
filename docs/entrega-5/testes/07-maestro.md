# Testes E2E — Maestro (QA-02, Entrega 5)

Fluxos em [`.maestro/`](../../../.maestro/README.md), escritos para o Expo Go no emulador Android
(`Pixel_3a_API_34`). Regras do roteiro da Entrega 3
([08-maestro-qa02](../../entrega-3/testes/08-maestro-qa02.md)) continuam valendo: Maestro fora do
projeto, backend real para a evidência final (mock só ensaia), dados por variável, nada de
credencial nos YAML.

> **Estado (2026-11-26): escritos, não executados.** O Maestro não foi instalado e o emulador
> não foi aberto. Textos e rótulos vêm do código desta branch e dos PRs abertos (#198, #200,
> #203); os do fluxo 4 vêm do card PAC-11 (a tarefa ainda não tem código). Cada fluxo precisa
> de um ensaio antes da evidência. AC-QA-02-01 (sete fluxos, duas execuções seguidas) segue
> **aberto**.

## 1. Fluxos escritos

| Arquivo                         | Fluxo                                                          | Origem / dependência                   | Modo            |
| ------------------------------- | -------------------------------------------------------------- | -------------------------------------- | --------------- |
| `01-login-atividades-jogo.yaml` | Login, Banco de atividades, "Forme a palavra" até "Muito bem!" | ATV-04a e ATV-09 (na pilha)            | M ou real       |
| `02-agenda-mensal.yaml`         | Agenda, visão "Mês", trocar de mês, "Semana"                   | AGE-05 (PR #198, fora desta pilha)     | M ou real       |
| `03-equipe-convite.yaml`        | Equipe e convites, criar equipe, "Compartilhar convite"        | EQP-01 (PR #200); leva 2 para o real   | MT `none`, real |
| `04-paciente-arquivar.yaml`     | Ficha, "Arquivar paciente", segunda confirmação, "Reativar"    | PAC-11 (sem código); leva 3 do backend | real            |

Os fluxos 2 a 4 só passam com as tarefas na `main`. Os demais fluxos do card (sessão, novo
paciente com PDI, escala, relatório, avulso e série semanal) seguem o
[08-maestro-qa02](../../entrega-3/testes/08-maestro-qa02.md) e ficam para quando houver as telas
e a autorização: **não escritos nesta rodada**.

## 2. Como rodar

Ver [`.maestro/README.md`](../../../.maestro/README.md). Evidência (fora do repositório): saída
do `maestro test` com código 0, relatório `--format=junit` e a gravação (`maestro record`);
commit e AVD no PR.

## 3. `testID` que faltam (nenhum foi acrescentado; código intocado)

Os fluxos usam texto e `accessibilityLabel`. Pontos frágeis, onde um `testID` estabilizaria:

| Elemento                                        | Onde                                                     | `testID` sugerido                                | Motivo                                                    |
| ----------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| Campos "Email" e "Senha"                        | `src/features/auth/LoginForm.tsx` › `Field`              | `login-email`, `login-password`                  | rótulo e `TextInput` têm o mesmo nome; o toque pode errar |
| "Entrar agora"                                  | `LoginForm.tsx` › `DsButton`                             | `login-submit`                                   | o texto "Entrar" também é título                          |
| Cartão da atividade "Forme a palavra"           | `src/features/activities/components/CatalogTaskCard.tsx` | `activity-card-<id>`                             | o título vem do servidor e muda; o regex pode colidir     |
| Letras e espaços do jogo                        | `engine/word-builder/WordBuilderActivity.tsx`            | `word-tile-<n>`, `word-slot-<n>`                 | letras repetidas têm o mesmo rótulo                       |
| Chips "Semana" e "Mês"                          | `src/features/agenda/AgendaScreen.tsx` (PR #198)         | `agenda-view-week`, `agenda-view-month`          | "Semana" e "Mês" aparecem em outros textos                |
| Setas do mês e dia do calendário                | `appointments/components/MiniCalendar.tsx`               | `calendar-day-<AAAA-MM-DD>`                      | o rótulo do dia muda com o mês e a contagem               |
| "Criar equipe", "Criar" e "Nome da clínica"     | `src/features/team/**` (PR #200)                         | `team-create`, `team-create-submit`, `team-name` | "Criar" é curto e comum                                   |
| "Arquivar" na confirmação e "Arquivar paciente" | tela PAC-11 (a escrever)                                 | `patient-archive`, `patient-archive-confirm`     | "Arquivar" é substring de "Arquivar paciente"             |

Os componentes `DsButton`, `Field`, `SelectField`, `DateField`, `TimeField` e `StaticPressable`
não repassam `testID` hoje; repassar a prop é uma mudança de uma linha em cada um, a revisar pelo
orquestrador antes da rodada.

## 4. Problemas conhecidos

- Primeira abertura do Expo Go: aviso de boas-vindas e "Development servers" (tratados no
  subfluxo). LogBox cobre botões: `tapOn: "Dismiss"`.
- IA (30 a 90 s) fica fora destes quatro fluxos; nos fluxos de plano e relatório use
  `extendedWaitUntil` com 90 s.
- A folha de compartilhamento do Android (fluxo 3) é fechada com `pressKey: back`; o Maestro não
  enxerga o conteúdo dela.
- Rodar Maestro no CI fica fora de escopo (exigiria emulador no GitHub Actions).
