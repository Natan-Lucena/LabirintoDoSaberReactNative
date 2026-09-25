# Contrato T-603 - Tela Home mockada

## Objetivo e escopo

Compor os estados 02 e 03 da Home a partir de `loadHomeData` da T-601, com
navegação e estados de carregamento, erro e cache offline. Escopo restrito a
`app/(tabs)/index.tsx`, `src/features/home/HomeScreen.tsx` e seus testes.

Não inclui dados, mocks, Agenda, telas de sessão, telas de relatório ou
validação visual em dispositivo/tablet (AC-603-05, MAN).

## Comportamento observável

- **AC-603-01:** com agenda mostra banner, "Sessões de hoje" e seus cards;
  sem agenda omite a seção e mostra "Atividades Recentes" com até três
  `ContentCard`, na ordem da T-601.
- **AC-603-02:** enquanto a query carrega mostra `LoadingState`; em erro mostra
  `ErrorState` com nova tentativa; sem conexão e dados em cache mostra
  `PendingBanner` e mantém o conteúdo disponível.
- **AC-603-03:** "Iniciar Sessão" abre `/session/student`; card de agenda abre
  `/appointments` com `date` igual a `dayKey(scheduledAt)`.
- **AC-603-04:** "Ver todas →", última sessão e atividade recente abrem
  `/shell/coming-soon` (G-10).

## Interface e decisões

`HomeScreen` não recebe props. Usa `useHomeQuery` da T-601, que preserva as
cinco chaves de recurso e permite que invalidações de agenda atualizem a Home.
Para os cartões, aluno ausente é exibido como "Aluno não encontrado"; tags de
caderno são categoria e quantidade de tarefas.

## Plano de testes

`src/features/home/__tests__/HomeScreen.test.tsx` cobre os dois estados,
loading/erro/cache offline e as navegações dos AC-603-01..04. AC-603-05 fica
pendente de observação em celular e tablet após autorização de build nativo.

## Limites e validação

Na fase 1 `HomeScreen` é um stub visual e os testes falham por comportamento
ausente; após aprovação, testes não são alterados. Validação: Vitest focado,
`pnpm run test`, `typecheck`, `lint`, Prettier, `check-docs`, `diff --check` e
export Android, removendo `dist-android` ao fim.

## Histórico

- 2026-09-25: contrato criado para fase vermelha da T-603.
- 2026-09-25: após revisão do vermelho, `useHomeQuery` foi autorizado em
  `useHomeData.ts`; uma chave agregada `["home"]` foi rejeitada porque não seria
  invalidada pelas mutações de Agenda (T-901).
