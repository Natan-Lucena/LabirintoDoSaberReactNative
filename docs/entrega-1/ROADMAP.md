# Entrega 1 — Roadmap

> Visão de escopo, marcos, ordem e caminho crítico da primeira entrega do app mobile
> Labirinto do Saber. Detalhe das tarefas: [BACKLOG](BACKLOG.md). Estado real:
> [TRACKING](TRACKING.md). Decisões pendentes: [GATES](GATES.md). Design:
> [DESIGN](DESIGN.md). Cobertura da API: [API-TELAS](API-TELAS.md).
> Contrato de origem: [planejamento-entrega-1](../contracts/planejamento-entrega-1.md).

## 1. Situação de partida

Esta tabela registra o discovery anterior ao bootstrap, em 2026-09-24. Para o
estado atual, consulte [§3](#3-marcos) e o [TRACKING](TRACKING.md).

| Fato | Evidência | Impacto |
|---|---|---|
| Não há aplicação, manifesto, lockfile nem testes | Árvore do repositório em 2026-09-24: README, AGENTS, `docs/` | Tudo começa pelo bootstrap; nenhum comando do app existe ainda |
| Stack definida, não instalada | [PROJECT §3](../PROJECT.md#3-stack-técnica) | Versões e compatibilidade só no spike T-101 |
| Gerenciador e plataformas decididos em 2026-09-24 | [Decisões registradas](GATES.md#decisões-registradas): pnpm; dev build Android + iOS via EAS | T-101 pronta; iOS depende de conta Apple e aparelho do usuário |
| Só G-05, G-06 e G-07 abertos (backend) | [PERGUNTAS-BACKEND](PERGUNTAS-BACKEND.md) | Bloqueiam etapa Senha da recuperação, tela 05, `start` e player |
| Backend externo com lacunas de integração | [PROJECT, pendências](../PROJECT.md#pendências-de-integração-arquitetura) | Recuperação de senha, `start`, `answer` e retomada têm gates |
| Design acessado parcialmente | [DESIGN §1](DESIGN.md#1-fontes-e-acesso-real) | 01 e topo da 02 observados; demais telas pelo texto do discovery |
| Máquina de desenvolvimento Windows | Ambiente da sessão | Sem simulador iOS local; iOS depende de macOS ou EAS (G-01) |

## 2. Escopo

**Dentro:** bootstrap (projeto, qualidade, testes, ambiente, build de
desenvolvimento), componentes reutilizáveis e tokens, infraestrutura de API, sessão
segura e cache criptografado, Login, tela 01 (recuperação de senha), estrutura de
tabs, Home (02/03), fluxo de sessão 04 → 05 → 06 com encerramento e observação,
Agenda 07 com formulário, edição, remarcação e exclusão, e homologação.

**Fora (não objetivos propostos em [GATES](GATES.md#não-objetivos-propostos-precisam-de-confirmação-não-bloqueiam)):**
Relatórios, Relatório da Sessão, Plano de Ensino, CRUD de alunos, catálogo completo,
cadastro, perfil, anamnese, IA, PDF, notificações/push/WhatsApp, biometria, tema
escuro e uso offline completo. Destinos visíveis no design que levam a essas áreas
são tratados por G-10 e G-09, não implementados automaticamente.

**Invariantes:** o frontend não altera contratos da API; nenhum campo, endpoint ou
métrica é inventado; acerto não é calculado no cliente; testes antes da implementação;
mutação de resultado desconhecido é reconciliada, nunca repetida às cegas; nenhuma
troca de conta expõe dados de outro educador.

**Escopo não encolhe por gate:** a recuperação de senha completa (T-404) faz parte da
entrega mesmo bloqueada; homologar sem ela exige decisão explícita de redução de escopo
([GATES, regra 5](GATES.md#regras)). Sentry (T-109) **saiu** da entrega por decisão do
usuário (G-20).

**Encerramento da sessão (decisão do usuário):** última resposta → `finish` →
observação com Pular/Salvar → Home, sem "Continuar sessão" (G-16 resolvido).

## 3. Marcos

Estado em 2026-09-24: M0 concluído, exceto G-05 a G-07 (backend); M1 em andamento
(T-101 e T-102 concluídas; T-103 e T-108 prontas; T-104 em execução). Para a etapa
atual da T-104, consulte o [TRACKING](TRACKING.md#0-próximo-passo-global).

| Marco | Objetivo | Tarefas | Gates que precisam estar resolvidos | Saída verificável |
|---|---|---|---|---|
| M0 — Decisões | Destravar bootstrap e caminho crítico | — | Concluído em 2026-09-24, exceto G-05–G-07 (backend) | Decisões em GATES e TRACKING; perguntas ao backend enviadas |
| M1 — Bootstrap | Projeto executável e verificável | T-101–T-108 | — | Comandos reais no README com códigos de saída; dev build Android e iOS (EAS) |
| M2 — Fundação | Componentes e dados reutilizáveis | T-201–T-205, T-301–T-306 | — | Testes UT/CT verdes; primitivos observados em emulador |
| M3 — Acesso e estrutura | Root integrado, entrar, recuperar senha, navegar | T-402, T-502, T-401, T-403, T-404, T-501 | G-05 para T-404 | App sobe pelo root; Login real contra o backend local; 401 volta ao Login |
| M4 — Home | Telas 02/03 | T-601–T-603 | — | Estados com e sem agenda observados |
| M5 — Sessão | Telas 04–06 e encerramento | T-701–T-704, T-801–T-804 | G-06, G-07 | Sessão completa, encerramento → Home, retomada após fechar o app |
| M6 — Agenda | Tela 07 e CRUD | T-901–T-905 | — | CRUD com dados de teste; fuso `America/Sao_Paulo` verificado |
| M7 — Homologação | Evidência em aparelho | T-1001–T-1003 | — (conta Apple e aparelho iOS para AC-108-02) | Matriz tela × plataforma × aparelho; todas as tarefas concluídas ou redução de escopo registrada |

M4, M5 e M6 podem correr em paralelo depois de M2 e de T-502/T-501, desde que os
arquivos sejam disjuntos (ver recursos compartilhados no TRACKING §3).

### Integração

Cada módulo é testado isoladamente **e** ligado ao app por um dono explícito, para
não sobrar componente solto:

| Ponto de integração | Dono | Como |
|---|---|---|
| Root: providers, fontes, guarda de sessão | T-502 | Dona de `app/_layout.tsx`; teste de integração do root |
| Root: prompt de retomada | T-803 | Edição serial restrita no ponto de extensão de T-502 |
| Provider de queries nos testes | T-304 | Edição serial de `src/test-utils/render.tsx` |
| Etapa 3 da recuperação | T-404 | Edição serial de `ForgotPasswordFlow.tsx` (T-403) |
| `start` na tela 05 | T-704 | Edição serial de `ContentStep.tsx` (T-703) |
| Pendências e encerramento no player | T-803 → T-804 | Edições seriais de `PlayerScreen.tsx` (T-802) |
| Formulário, excluir e Montar Plano na Agenda | T-904 → T-905 | Edições seriais de `AgendaScreen.tsx` (T-903) |

## 4. Ordem das telas

1. **Login** — dependência funcional de todas as outras; entra depois do root (T-502).
2. **01 Recuperar senha** — etapas 1–2 (T-403) liberadas; etapa 3 (T-404) aguarda G-05 e continua no escopo.
3. **Estrutura de tabs e header** — base de 02, 03 e 07.
4. **02/03 Home** — uma tela, dois estados.
5. **04 Escolher aluno** → **05 Nome e conteúdo** → **06 Sessão e encerramento** — fluxo com estado compartilhado.
6. **07 Agenda** — pode avançar em paralelo ao item 5.

## 5. Caminho crítico

```
T-101 → T-102 → T-104 → T-106 → T-301 → T-305 → T-701 → T-702
      → T-703 (G-06) → T-704 (G-06) → T-802 (G-06, G-07)
      → T-803 → T-804 → T-1001 → T-1003
```

São 15 níveis de dependência. Folgas relevantes: T-303 (G-04) e T-304 terminam um
nível antes de T-701/T-702 precisarem deles; o ramo de interface
`T-201 → T-202 → T-801 → T-802` tem folga de 4 níveis, e o ramo do root
`T-402 → T-502 → T-803` tem folga de 3. Os gates de backend (G-05 a G-08) têm o maior
risco de atraso, porque dependem de outro time; **G-06 está no caminho crítico** e
precisa de resposta antes da onda 9 (tela 05). As perguntas estão em
[PERGUNTAS-BACKEND](PERGUNTAS-BACKEND.md).

## 6. Ondas sugeridas

Ondas indicam paralelismo possível, não obrigação de ocupar executores. Cada onda é
o nível topológico mais cedo da tarefa, calculado a partir das dependências do
BACKLOG (ver TRACKING §6). Uma tarefa só entra quando dependências estão concluídas
e gates resolvidos; gates abertos podem empurrá-la para ondas posteriores.

| Onda | Tarefas | Observação |
|---|---|---|
| 1 | T-101 | Única; versões validadas; concluída |
| 2 | T-102 | Única; cria manifesto (R-01) e instala a stack |
| 3 | T-103, T-104, T-108 | Instalações serializadas por R-01; T-108 exige G-01 |
| 4 | T-105, T-106, T-201, T-302, T-306 | |
| 5 | T-107, T-202, T-203, T-204, T-301, T-303 | |
| 6 | T-205, T-304, T-305, T-602, T-801, T-902 | T-304 edita `render.tsx` (R-04) |
| 7 | T-402, T-601, T-701, T-901 | |
| 8 | T-502, T-702 | T-502 é a integração do root |
| 9 | T-401, T-403, T-501, T-703 | (T-109 cancelada, G-20) |
| 10 | T-404, T-603, T-704, T-903 | |
| 11 | T-802, T-904 | |
| 12 | T-803, T-905 | |
| 13 | T-804 | |
| 14 | T-1001, T-1002 | |
| 15 | T-1003 | |

## 7. Riscos principais

| Risco | Efeito | Mitigação no plano |
|---|---|---|
| Backend não esclarece vínculo conteúdo ↔ sessão (G-06) | Player não pode ser integrado | Enviar em M0; M4 e M6 seguem sem ele |
| Autorização de `update-password` indefinida (G-05) | Etapa 3 da recuperação atrasa | T-403 entrega etapas 1–2; T-404 isolada, continua no escopo; redução só por decisão do usuário |
| `start`, `answer`, `finish` e `observation` sem idempotência | Sessão duplicada, respostas duplicadas ou perdidas | Reconciliação pela listagem do aluno antes de qualquer nova mutação (T-704, T-803, T-804; G-08); conflito visível em vez de repetição automática |
| Módulos entregues isolados e nunca ligados | Telas que passam nos testes mas não funcionam juntas | Dono da integração (T-502) e edições seriais com teste de integração (§3 Integração) |
| Troca de conta expõe dados de outro educador | Vazamento de dados de crianças | Isolamento por `educatorId` (G-04, AC-303-04, AC-701-04) |
| Sessões órfãs após sair do player | Sessões nunca finalizadas no servidor | G-21 decidido: retomada oferece "Retomar" ou "Encerrar agora" |
| iOS sem conta Apple ou aparelho | AC-108-02 e homologação iOS pendentes | Usuário providencia; senão, pendência explícita em T-1003 |
| Incompatibilidade nativa (MMKV, NativeWind, Reanimated) | Bootstrap atrasa | Spike T-101 antes de criar o projeto |
| Sem macOS para E2E iOS | Maestro só em Android | iOS validado manualmente no dev build EAS; não declarar E2E iOS sem evidência |
| Tipografia do design ilegível em aparelho | Retrabalho visual | G-17 antes de T-201 |
| Backend local diferente do de produção | Integração validada só localmente | G-19 decidido (backend local, dados fictícios); registrar a versão do backend usada nas evidências |

## 8. Manutenção deste roadmap

O orquestrador atualiza marcos e ordem quando um gate for resolvido de forma que
mude escopo ou dependências; mudanças de tarefa vão ao BACKLOG com histórico no
TRACKING. Este planejamento não marca nenhuma implementação como pronta.
