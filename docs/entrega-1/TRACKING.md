# Entrega 1 — Tracking

> Estado **real** de gates, recursos compartilhados e tarefas da Entrega 1. Definições
> das tarefas: [BACKLOG](BACKLOG.md). Decisões: [GATES](GATES.md). Visão geral:
> [ROADMAP](ROADMAP.md).
>
> Em 2026-09-24 **nenhuma tarefa de implementação foi iniciada**. A conclusão do
> planejamento documental não torna nenhuma tarefa pronta, em andamento ou concluída.

## 0. Próximo passo global

| # | Ação | Responsável | Condição de conclusão |
|---|---|---|---|
| 1 | Enviar ao backend as perguntas de [PERGUNTAS-BACKEND](PERGUNTAS-BACKEND.md) (G-05, G-06, G-07; P4 opcional) | Usuário ou orquestrador | Data de envio registrada lá e no histórico (§7). **G-06 está no caminho crítico** (tela 05, onda 9) |
| 2 | Dispatch de T-101 (spike de compatibilidade, pnpm, `Intl`/fuso no Hermes) | Orquestrador → líder (classe C) | Linha de T-101 em `implementação` com dispatch registrado; ficha aberta em §4.1 |
| 3 | Providenciar conta Apple Developer e aparelho iOS para o dev build EAS (G-01) | Usuário | Disponíveis antes de T-108 (onda 3); senão, AC-108-02 vira pendência registrada |
| 4 | Deixar o backend local rodando com dados fictícios e acessível pela rede (G-19) | Usuário | Necessário a partir de T-401 (onda 9) para testes manuais; testes UT/CT usam mock |

Atualize esta tabela sempre que um item for concluído ou o próximo passo mudar.

## 1. Estados

**Quem escreve neste arquivo:** conforme AGENTS, em ondas com vários workers o
orquestrador é o único escritor; líderes e executores enviam as atualizações para
consolidação imediata. Em execução isolada, o responsável atualiza diretamente. Nunca
há edições concorrentes. A coluna "Decide" abaixo indica quem decide a transição,
não quem edita o arquivo.

| Estado | Significado | Decide |
|---|---|---|
| `bloqueada` | Há gate aberto listado na tarefa | Orquestrador, ao resolver o gate |
| `aguardando` | Sem gate aberto, mas há dependência não concluída | Automático ao concluir dependências (confirmado pelo líder) |
| `pronta` | Dependências concluídas e revisadas; gates resolvidos | Líder |
| `testes` | Executor escrevendo testes | Líder, no dispatch |
| `vermelho-revisado` | Testes falham pelo motivo esperado, com evidência | Líder |
| `implementação` | Executor implementando | Líder |
| `revisão` | Verde; líder revisando diff e evidências | Líder |
| `concluída` | Critérios atendidos, revisão aprovada, evidências registradas | Líder decide e comunica; orquestrador confirma no fim do marco |
| `impedida` | Parada durante execução (falha, dúvida, recurso ocupado) | Quem detectou; líder registra motivo |
| `cancelada` | Retirada do escopo por decisão registrada | Orquestrador |

Transições válidas: `bloqueada ⇄ aguardando → pronta → testes → vermelho-revisado →
implementação → revisão → concluída`; `revisão → implementação` quando há
correção; qualquer estado ativo `→ impedida → (estado anterior)`; qualquer estado
`→ cancelada`. Tarefas com checagem objetiva no lugar de testes vão de `pronta` direto
para `implementação`, registrando a checagem prevista.

Uma tarefa `concluída` que precisar mudar é **reaberta** para `implementação` com
motivo no histórico; nunca se cria outro ID para a mesma entrega.

## 2. Gates

Detalhe em [GATES](GATES.md#tabela-de-gates) e decisões completas em
[GATES — Decisões registradas](GATES.md#decisões-registradas). Em 2026-09-24: 18
resolvidos; **abertos G-05, G-06 e G-07** (backend).

| Gate | Assunto | Decide | Estado | Decisão registrada | Decisor / data | Evidência |
|---|---|---|---|---|---|---|
| G-01 | Plataformas e alvos | Usuário | **resolvido** | Dev build Expo: Android (emulador + aparelho) e iOS via EAS; aceite em celular retrato, tablet como checagem | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-02 | Gerenciador e instalação | Usuário | **resolvido** | pnpm; instalação autorizada em T-101 e T-102 | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-03 | Dependências extras | Usuário | **resolvido** | Fontes Google via Expo, NetInfo, expo-audio, seletor de data/hora; lib de datas só se o Intl não bastar | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-04 | Chave MMKV e limpeza | Usuário + líder | **resolvido** | Proposta aprovada: logout apaga (sessão só com confirmação); 401 preserva sessão do mesmo educador; outra conta apaga tudo | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-05 | Autorização de `update-password` | Backend + usuário | aberto | — | — | — |
| G-06 | Conteúdo ↔ sessão | Backend + usuário | aberto | — | — | — |
| G-07 | Unidade de `timeToAnswer` | Backend | aberto | — | — | — |
| G-08 | Reenvio e reconciliação | Líder + usuário; backend | **resolvido** | Sem repetição automática; reconciliar pela listagem; tolerância de 2 min no start; conflito visível | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-09 | "Montar Plano da Sessão" | Usuário | **resolvido** | Revisto: abre a tela "Em breve" (protótipo leva ao Plano de Ensino por IA). Decisão anterior (tela 04) substituída | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-10 | Destinos fora do escopo e abas | Usuário | **resolvido** | Visíveis, abrem tela "Em breve"; 5 abas do design | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-11 | Conteúdo da Home | Usuário | **resolvido** | Só campos da API; "Olá, {nome}! 👋" sem título; vazio "Boas-vindas!" | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-12 | Campos de agendamento | Usuário | **resolvido** | Só campos da API; Editar = data/hora + observação; Remarcar = data/hora | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-13 | Fuso e filtros locais | Usuário | **resolvido** | Fuso fixo America/Sao_Paulo; CANCELLED fora da contagem e do resumo, visível na lista | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-14 | Dados do aluno em 04 | Usuário | **resolvido** | Idade • gênero, sem nível | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-15 | Conteúdo em 05 e nome | Usuário | **resolvido** | Proposta aprovada; nome da sessão obrigatório 1–100 | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-16 | Encerramento | Usuário | **resolvido** | Última resposta → `finish` → observação (Pular/Salvar) → Home; sem "Continuar sessão" | Usuário (briefing) / 2026-09-24; registrado na revisão corretiva | Briefing do usuário; Orca `msg_3462ead39480` |
| G-17 | Escala, toque e contraste | Usuário | **resolvido** | Proposta do DESIGN §4 aprovada | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-18 | Referências visuais faltantes | Usuário | **resolvido** | Montar com primitivos; aceite visual do usuário no app | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-19 | Ambiente e dados de teste | Usuário | **resolvido** | Backend local com dados fictícios | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-20 | Sentry | Usuário | **resolvido** | Adiar: redução de escopo; T-109 cancelada | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |
| G-21 | Política temporal e de abandono | Usuário | **resolvido** | Proposta aprovada: pausa em 2º plano; sair guarda a sessão; reabrir oferece Retomar/Encerrar agora | Usuário / 2026-09-24 | Conversa Claude Code; GATES § Decisões registradas |

## 3. Recursos compartilhados

Um único dono por vez. Quem precisa do recurso pede ao líder; o detentor é
registrado aqui (pelo escritor do tracking) antes da edição e liberado na revisão.

| Recurso | Arquivos | Dono padrão | Detentor atual |
|---|---|---|---|
| R-01 | `package.json`, `pnpm-lock.yaml`, `.npmrc` | T-102; depois, por pedido | livre (arquivos não existem) |
| R-02 | `app.json` / `app.config.ts`, `eas.json` | T-102 → T-106 → T-108 | livre |
| R-03 | `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css` | T-102, depois T-201 | livre |
| R-04 | `jest.config.*`, `jest.setup.ts`, `src/test-utils/` | T-104; `src/test-utils/render.tsx` depois T-304 (serial) | livre |
| R-05 | `README.md` | T-107, depois T-1003 | livre |
| R-06 | `app/_layout.tsx` | T-102 (mínimo) → **T-502 (dono da integração)** → T-803 (serial, só para montar o prompt de retomada) | livre |
| R-07 | `app/(tabs)/_layout.tsx` | T-501 | livre |
| R-08 | `src/api/types.ts` | T-305; mudanças posteriores só com revisão do líder contra a API | livre |
| R-09 | `src/theme/*` | T-201 | livre |
| R-10 | `src/features/auth/ForgotPasswordFlow.tsx` | T-403 → T-404 (serial: etapa 3) | livre |
| R-11 | `src/features/sessions/ContentStep.tsx` | T-703 → T-704 (serial: `start`) | livre |
| R-12 | `src/features/sessions/PlayerScreen.tsx` | T-802 → T-803 (serial: pendências) → T-804 (serial: encerramento) | livre |
| R-13 | `src/features/appointments/AgendaScreen.tsx` | T-903 → T-904 (serial: formulário) → T-905 (serial: excluir, Montar Plano) | livre |

A ordem "→" já é imposta pelas dependências do BACKLOG. Edições *(serial)* limitam-se ao
wiring descrito na tarefa e precisam de teste de integração.

## 4. Tarefas

`Estado` é o estado real em 2026-09-24. `Motivo` explica bloqueio ou espera.
Responsável e dispatch ficam vazios até o dispatch real; o papel previsto está no BACKLOG.

| ID | Título | Onda | Estado | Motivo | Responsável (papel/modelo confirmado) | Run / task / dispatch | Evidências | Atualizado |
|---|---|---|---|---|---|---|---|---|
| T-101 | Spike de compatibilidade | 1 | pronta | Dependências e gates atendidos; aguarda dispatch | — | — | — | 2026-09-24 |
| T-102 | Criar projeto Expo | 2 | aguardando | T-101 | — | — | — | 2026-09-24 |
| T-103 | Qualidade de código | 3 | aguardando | T-102 | — | — | — | 2026-09-24 |
| T-104 | Runner Jest/RNTL | 3 | aguardando | T-102 | — | — | — | 2026-09-24 |
| T-105 | Runner Maestro | 4 | aguardando | T-102, T-108 | — | — | — | 2026-09-24 |
| T-106 | Configuração de ambiente | 4 | aguardando | T-102, T-104 | — | — | — | 2026-09-24 |
| T-107 | Documentar comandos | 5 | aguardando | T-103, T-104, T-106 | — | — | — | 2026-09-24 |
| T-108 | Development build nativo | 3 | aguardando | T-101, T-102 | — | — | — | 2026-09-24 |
| T-109 | Sentry | — | cancelada | Redução de escopo decidida pelo usuário (G-20), 2026-09-24 | — | — | — | 2026-09-24 |
| T-201 | Tokens, tema e fontes | 4 | aguardando | T-102, T-104 | — | — | — | 2026-09-24 |
| T-202 | Primitivos de conteúdo | 5 | aguardando | T-201 | — | — | — | 2026-09-24 |
| T-203 | Primitivos de layout e ícones | 5 | aguardando | T-201 | — | — | — | 2026-09-24 |
| T-204 | Sobreposições | 5 | aguardando | T-201 | — | — | — | 2026-09-24 |
| T-205 | Estados comuns | 6 | aguardando | T-202 | — | — | — | 2026-09-24 |
| T-301 | Cliente HTTP e erros | 5 | aguardando | T-104, T-106 | — | — | — | 2026-09-24 |
| T-302 | Token seguro e auth store | 4 | aguardando | T-104 | — | — | — | 2026-09-24 |
| T-303 | MMKV criptografado | 5 | aguardando | T-101, T-104, T-302 | — | — | — | 2026-09-24 |
| T-304 | QueryClient e conectividade | 6 | aguardando | T-301, T-303 | — | — | — | 2026-09-24 |
| T-305 | Tipos e módulos de API | 6 | aguardando | T-102, T-104, T-301 | — | — | — | 2026-09-24 |
| T-306 | Datas e fuso | 4 | aguardando | T-104 | — | — | — | 2026-09-24 |
| T-401 | Login | 9 | aguardando | T-202, T-205, T-301, T-302, T-304, T-305, T-502 | — | — | — | 2026-09-24 |
| T-402 | Guarda de rotas e 401 | 7 | aguardando | T-102, T-301, T-302, T-304 | — | — | — | 2026-09-24 |
| T-403 | Recuperação: Email e Código | 9 | aguardando | T-202, T-203, T-205, T-304, T-305, T-502 | — | — | — | 2026-09-24 |
| T-404 | Recuperação: Senha | 10 | bloqueada | G-05 (backend); T-403 | — | — | — | 2026-09-24 |
| T-501 | Tabs, header e destinos | 9 | aguardando | T-203, T-205, T-502 | — | — | — | 2026-09-24 |
| T-502 | Composição do root (integração) | 8 | aguardando | T-201, T-304, T-402 | — | — | — | 2026-09-24 |
| T-601 | Dados da Home | 7 | aguardando | T-304, T-305, T-306 | — | — | — | 2026-09-24 |
| T-602 | Componentes da Home e ContentCard | 6 | aguardando | T-202 | — | — | — | 2026-09-24 |
| T-603 | Tela Home | 10 | aguardando | T-205, T-501, T-601, T-602 | — | — | — | 2026-09-24 |
| T-701 | Store do fluxo de sessão | 7 | aguardando | T-303, T-305 | — | — | — | 2026-09-24 |
| T-702 | Tela 04 | 8 | aguardando | T-202, T-203, T-205, T-304, T-305, T-701 | — | — | — | 2026-09-24 |
| T-703 | Tela 05 | 9 | bloqueada | G-06 (backend); T-602, T-702 | — | — | — | 2026-09-24 |
| T-704 | Início da sessão | 10 | bloqueada | G-06 (backend); T-301, T-701, T-703 | — | — | — | 2026-09-24 |
| T-801 | Componentes do player | 6 | aguardando | T-202 | — | — | — | 2026-09-24 |
| T-802 | Tela 06: respostas | 11 | bloqueada | G-06, G-07 (backend); T-704, T-801 | — | — | — | 2026-09-24 |
| T-803 | Pendências e retomada | 12 | aguardando | T-304, T-502, T-802 | — | — | — | 2026-09-24 |
| T-804 | Encerramento e observação | 13 | aguardando | T-204, T-205, T-803 | — | — | — | 2026-09-24 |
| T-901 | Dados da agenda | 7 | aguardando | T-304, T-305, T-306 | — | — | — | 2026-09-24 |
| T-902 | Componentes da agenda | 6 | aguardando | T-202, T-306 | — | — | — | 2026-09-24 |
| T-903 | Tela 07 | 10 | aguardando | T-205, T-501, T-901, T-902 | — | — | — | 2026-09-24 |
| T-904 | Formulário de agendamento | 11 | aguardando | T-202, T-204, T-901, T-903 | — | — | — | 2026-09-24 |
| T-905 | Excluir e Montar Plano | 12 | aguardando | T-204, T-904 | — | — | — | 2026-09-24 |
| T-1001 | Fluxos E2E | 14 | aguardando | T-105, T-401, T-403, T-404, T-603, T-804, T-904, T-905 | — | — | — | 2026-09-24 |
| T-1002 | Acessibilidade e layout | 14 | aguardando | T-401, T-403, T-404, T-603, T-702, T-703, T-804, T-903, T-904, T-905 | — | — | — | 2026-09-24 |
| T-1003 | Homologação e relatório | 15 | aguardando | T-108, T-1001, T-1002 | — | — | — | 2026-09-24 |

Totais em 2026-09-24, após as decisões do usuário: 45 tarefas; 1 `pronta` (T-101),
39 `aguardando`, 4 `bloqueada` (só por G-05, G-06 ou G-07), 1 `cancelada` (T-109),
0 em execução, 0 `concluída`. A coluna "Motivo" lista só gates abertos e dependências; os gates
resolvidos continuam valendo como decisão (ver GATES). Nenhuma tarefa sai do escopo por
estar bloqueada ([GATES, regra 5](GATES.md#regras)).

### 4.1 Fichas de execução

Ao sair de `aguardando`/`bloqueada` para `pronta`, a tarefa ganha uma ficha aqui,
mantida até a conclusão. Nenhuma ficha aberta em 2026-09-24.

```markdown
#### T-NNN — <título>
- Estado / etapa do fluxo: <pronta | testes | vermelho-revisado | implementação | revisão | impedida>
- Responsável: <papel> · <ferramenta> · <modelo confirmado> · esforço <baixo|médio|alto>
- Orca: run <id> · task <id> · dispatch <id>
- Arquivos sob propriedade: <lista fechada, incluindo testes e itens (serial)>
- Recursos reservados (§3): <R-NN>
- Bloqueio atual: <motivo> · quem resolve: <responsável> · condição de desbloqueio: <condição>
- Evidências: <comando → código de saída → resumo>; <MAN: plataforma, SO, aparelho>
- Próximo passo concreto: <ação>
```

## 5. Protocolos de atualização

Toda atualização altera a linha da tarefa (estado, responsável, dispatch, evidências,
data) **e** acrescenta uma linha no histórico (§7). Evidência é caminho de arquivo,
comando com código de saída, ID Orca ou captura; nunca apenas "worker disse que passou".

### Início (dispatch)
1. Líder confirma dependências `concluída` e gates resolvidos nesta página.
2. Confirma modelo e ferramenta disponíveis e registra papel/modelo exato.
3. Reserva recursos compartilhados necessários em §3.
4. Registra run, task e dispatch Orca (ou equivalente) e muda para `testes` (ou
   `implementação` quando a tarefa usa checagem objetiva).

### Bloqueio ou impedimento
1. Muda para `impedida` com motivo concreto: gate, dúvida, falha de ambiente, recurso ocupado.
2. Se for novo gate, o orquestrador o cria em GATES e em §2 antes de qualquer contorno.
3. Um worker parado continua sob supervisão até estado terminal confirmado; timeout não é encerramento.

### Vermelho revisado
Registrar comando, código de saída e resumo das falhas; o líder declara que a
falha decorre do comportamento ausente. Só então muda para `implementação`.

### Revisão
Registrar comandos verdes (testes da tarefa, regressões, `lint`, `typecheck`) com
códigos de saída, diff revisado e observações `MAN` com plataforma e aparelho. Pedidos
de correção voltam para `implementação` com o motivo no histórico.

### Conclusão
Só o líder decide que a tarefa está `concluída`, depois de conferir cada `AC` com sua
evidência, e comunica a decisão; o escritor do tracking (orquestrador em ondas com
vários workers, ou o responsável direto em execução isolada) registra a mudança,
libera recursos em §3 e move dependentes de `aguardando` para `pronta` quando
aplicável. O orquestrador confirma a conclusão do marco no ROADMAP.

### Handoff
Ao trocar executor, líder ou ferramenta: registrar o estado atual, arquivos tocados,
comandos já executados, pendências abertas e o próximo passo concreto. O novo
responsável lê BACKLOG, GATES e a linha da tarefa antes de agir; não repete discovery
já registrado.

### Evidências
Evidências extensas vão para `docs/entrega-1/evidencias/<ID>.md` (criado pela tarefa
que as produz, mediante pedido ao líder, ou por T-1002/T-1003). Não incluir tokens,
senhas, credenciais de contas de teste (referencie a conta por apelido, nunca por
email e senha), DSN, dados reais de alunos nem capturas com dados reais.

## 6. Verificação desta documentação

Planejamento documental produzido por Claude Code / `claude-opus-5-5` (Orca
`task_c312de1f9319`, dispatch `ctx_3750554e0766`) e corrigido na revisão corretiva
(`task_eb99cd144228`; o dispatch `ctx_c7dec7851dc4` parou por limite de uso antes de
editar, e as correções foram aplicadas em execução direta a pedido do usuário).
Checagens objetivas no lugar de testes automatizados (documentação), refeitas depois
da revisão corretiva:

| Checagem | Resultado |
|---|---|
| Dependências de cada tarefa no BACKLOG × grafo do BACKLOG §5 | Coincidem para as 44 tarefas ativas (T-109 cancelada, fora do grafo); 0 arestas faltando, 0 sobrando; nenhuma dependência desconhecida |
| Ciclos | Nenhum; 15 níveis topológicos, iguais às ondas do ROADMAP e da coluna "Onda" acima |
| Tarefas do BACKLOG × linhas deste TRACKING | 45 × 45; dependências de cada linha geradas a partir do BACKLOG; estado pela regra (gate aberto → `bloqueada`; sem dependências → `pronta`; senão `aguardando`) |
| Gates citados × gates definidos | 21 definidos em GATES e em §2 (18 resolvidos, 3 abertos); nenhuma referência a gate inexistente |
| Coluna "Bloqueia" de GATES × gates declarados nas tarefas | Iguais para os 21 gates |
| Links relativos e âncoras em `docs/entrega-1/*.md`, AGENTS e contrato de planejamento | Todos resolvem (0 problemas) |
| `git diff --check` e `git diff --no-index --check /dev/null <arquivo>` nos 7 arquivos novos | Código 0 no primeiro; nos demais, nenhum erro de whitespace (o código 1 é esperado porque há diferença); só aviso LF→CRLF |

Checagens executadas com scripts Python locais no scratchpad da sessão, sobre o
texto destes arquivos; não fazem parte do repositório.

## 7. Histórico

| Data | Item | Mudança | Por | Evidência |
|---|---|---|---|---|
| 2026-09-24 | Todos | Criação do tracking; todos os gates abertos; nenhuma tarefa iniciada | Líder documental (claude-opus-5-5) | Este arquivo |
| 2026-09-24 | Todos | Revisão corretiva do orquestrador (Orca `msg_3462ead39480`, `msg_f6414a044ad2`) aplicada: dependências T-106/T-305/T-402 corrigidas; T-502 criada como dona da integração do root; edições seriais R-04, R-06, R-10–R-13 declaradas; G-16 resolvido (sem "Continuar sessão"); G-21 criado; reconciliação de `start`/`finish`/`observation`/agendamentos especificada; isolamento entre educadores (G-04); `react-native-calendars` mantido; critérios de busca e preservação em T-703; escopo de T-404/T-109 não é reduzido por gate; próximo passo global e ficha por tarefa | Claude Code / claude-opus-5-5, execução direta a pedido do usuário (exceção ao fluxo Orca: o dispatch `ctx_c7dec7851dc4` parou por limite de uso) | §6; scripts de verificação |
| 2026-09-24 | Gates | Usuário decidiu G-01–G-04, G-08–G-15, G-17–G-21 (G-16 já resolvido). G-20 = redução de escopo: T-109 `cancelada`. T-101 → `pronta`. Só G-05, G-06, G-07 abertos; perguntas redigidas em PERGUNTAS-BACKEND. BACKLOG, ROADMAP, DESIGN e AGENTS atualizados com as decisões | Claude Code / claude-opus-5-5 (execução direta a pedido do usuário) | GATES § Decisões registradas; §6 |
| 2026-09-24 | Design | Protótipo conferido no fonte da versão Offline local (DESIGN §7): todas as dúvidas confirmadas. Usuário reviu G-09 ("Em breve"; AC-702-04 removido; T-905 deixa de depender de T-702) e complementou G-11 ("Atividades Recentes" no estado 03; `ContentCard` passa para T-602, T-703 depende de T-602) e G-12 (status e `color.success`). Conflitos C-15 a C-17 | Claude Code / claude-opus-5-5 | DESIGN §7; GATES histórico |
