# Entrega 2 — Tracking

> Registro canônico do progresso da Entrega 2. O trabalho está em [BACKLOG](BACKLOG.md), e o
> plano e as decisões em [ROADMAP](ROADMAP.md). Atualize este arquivo a cada transição de
> tarefa (AGENTS §2).

## 0. Próximo passo global

Estado em 2026-10-04: o marco **V1** está em andamento. A **EXPO-01** está na `main`
(`f7e507b`) e aguarda só a validação manual no Expo Go, feita pelo usuário ou quando ele pedir.

| #   | Ação                                                                                                                                                      | Responsável                                               | Condição de conclusão                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| 1   | Validar a EXPO-01 no Expo Go (AC-EXPO-01-01): `pnpm install` → `pnpm start` → abrir no Expo Go e navegar                                                  | Usuário (ou orquestrador, **só quando o usuário mandar**) | O app abre e navega sem erro de módulo nativo    |
| 2   | Onda **V1-1**: DS-01 a DS-05 (design system do Figma Make) e ATV-08 (upload de imagem e áudio)                                                            | Orquestrador → workers OpenCode                           | Na `main`, com testes                            |
| 3   | Resolver com o backend a **G-06** (vínculo sessão ↔ caderno) e a **G-07** (unidade do `timeToAnswer`), que bloqueiam SES-01, SES-02 e os tempos do REL-04 | Usuário + backend                                         | Resposta registrada em GATES e PERGUNTAS-BACKEND |
| 4   | Depois: ondas V1-2 a V1-8 (ver [BACKLOG §4.0](BACKLOG.md#40-marco-v1-prioridade))                                                                         | Orquestrador                                              | V1 ponta a ponta (QA-05)                         |

## 1. Estados

`pronta` (dependências ok), `em andamento`, `bloqueada` (com motivo), `em revisão`,
`concluída` (aceite e verificações), `cancelada`.

## 2. Tarefas do marco V1

| Tarefa                                           | Onda | Estado                               | Commit / evidência                                                                                                                                                    | Observação                                    |
| ------------------------------------------------ | ---- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| EXPO-01 Migração de volta para o Expo Go         | V1-0 | **em revisão**                       | `f7e507b` — 475/475 testes, typecheck, lint, check-docs e `expo export` com código 0; expo-doctor 20/21 (falha anterior: patch de expo, expo-constants e expo-router) | Falta o AC-EXPO-01-01 (abrir no Expo Go)      |
| DS-01 Tokens do novo tema                        | V1-1 | pronta                               | —                                                                                                                                                                     |                                               |
| DS-02 Ícones                                     | V1-1 | pronta                               | —                                                                                                                                                                     | `react-native-svg` (compatível com o Expo Go) |
| DS-03 Botões e controles                         | V1-1 | aguarda DS-01, DS-02                 | —                                                                                                                                                                     |                                               |
| DS-04 Campos e formulários                       | V1-1 | aguarda DS-01, DS-02                 | —                                                                                                                                                                     |                                               |
| DS-05 Cards e blocos                             | V1-1 | aguarda DS-01 a DS-03                | —                                                                                                                                                                     |                                               |
| ATV-08 Upload de imagem e áudio                  | V1-1 | pronta                               | —                                                                                                                                                                     | `expo-image-picker`, `expo-document-picker`   |
| DS-06 Migração visual das telas mantidas         | V1-2 | aguarda DS-01 a DS-05                | —                                                                                                                                                                     |                                               |
| NAV-01 Abas Início, Agenda, Pacientes e Recursos | V1-2 | aguarda DS-03                        | —                                                                                                                                                                     |                                               |
| NAV-02 Cabeçalho novo                            | V1-2 | aguarda DS-03                        | —                                                                                                                                                                     |                                               |
| HOME-01 (V1) Tela Início                         | V1-3 | aguarda NAV                          | —                                                                                                                                                                     |                                               |
| PAC-01 Lista de pacientes                        | V1-3 | aguarda NAV                          | —                                                                                                                                                                     |                                               |
| PAC-02 (V1) Cadastro de paciente                 | V1-3 | aguarda DS-04                        | —                                                                                                                                                                     |                                               |
| ATV-01 (V1) Banco de atividades                  | V1-3 | aguarda NAV                          | —                                                                                                                                                                     |                                               |
| CNT-01 Cadernos e grupos                         | V1-3 | aguarda DS-03, DS-05                 | —                                                                                                                                                                     |                                               |
| REC-01 (V1) Tela Recursos                        | V1-3 | aguarda NAV                          | —                                                                                                                                                                     |                                               |
| PAC-03 (V1) Ficha do paciente                    | V1-4 | aguarda PAC-01                       | —                                                                                                                                                                     |                                               |
| ATV-06 Criar e editar atividade (com mídia)      | V1-4 | aguarda DS, ATV-08                   | —                                                                                                                                                                     |                                               |
| ATV-07 Criar atividades com IA                   | V1-4 | aguarda DS                           | —                                                                                                                                                                     |                                               |
| SES-01 Iniciar sessão                            | V1-4 | **bloqueada (G-06)**                 | —                                                                                                                                                                     | Backend                                       |
| ATV-02 Detalhe da atividade                      | V1-5 | aguarda ATV-01                       | —                                                                                                                                                                     |                                               |
| ATV-03 Motor do player                           | V1-5 | aguarda ATV-02                       | —                                                                                                                                                                     |                                               |
| SES-02 Player da sessão                          | V1-5 | **bloqueada (G-06, G-07)**           | —                                                                                                                                                                     | Backend                                       |
| SES-03 Retomada                                  | V1-6 | aguarda SES-02                       | —                                                                                                                                                                     |                                               |
| SES-04 Encerrar e registro                       | V1-6 | aguarda SES-02                       | —                                                                                                                                                                     |                                               |
| REL-04 Relatório da sessão                       | V1-6 | aguarda SES-04 (G-07 para os tempos) | —                                                                                                                                                                     |                                               |
| REL-05 Relatórios do aluno                       | V1-7 | aguarda REL-04                       | —                                                                                                                                                                     |                                               |
| REL-06 Análise com IA (Markdown)                 | V1-7 | aguarda REL-05                       | —                                                                                                                                                                     |                                               |
| INT-01 Integração real                           | V1-8 | aguarda as telas                     | —                                                                                                                                                                     |                                               |
| QA-05 Teste ponta a ponta                        | V1-8 | aguarda INT-01                       | —                                                                                                                                                                     |                                               |

As demais tarefas da Entrega 2 (N2 a N6 fora da V1) ficam **não iniciadas** até a V1
fechar. A maioria depende de API que ainda não existe ([BACKLOG §2.3](BACKLOG.md#23-cobertura-da-api)).

## 3. Gates abertos que afetam a V1

| Gate | Pendência                                              | Bloqueia                    |
| ---- | ------------------------------------------------------ | --------------------------- |
| G-06 | Vínculo sessão ↔ caderno e fonte das tarefas do player | SES-01, SES-02              |
| G-07 | Unidade de `timeToAnswer`                              | SES-02, os tempos do REL-04 |

## 4. Histórico

| Data       | Itens             | Registro                                                                                                                                                                                                                                                                                    |
| ---------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-03 | Roadmap e backlog | Roadmap da Entrega 2 a partir do Figma Make (`25ec2fd`), backlog refinado com endpoints e cobertura da API (`d581ef4`), marco V1 e G-38 a G-41 (`556f258`)                                                                                                                                  |
| 2026-10-04 | EXPO-01           | MMKV/Nitro trocados por `expo-sqlite/kv-store` + AES-256-GCM (`@noble/ciphers`), mesma interface em `src/storage/mmkv.ts`; scripts voltam a `expo start`; COMPATIBILIDADE §9 com a auditoria do Expo Go (`f7e507b`). Executor Claude Sonnet 5 via Orca; revisão do orquestrador sem achados |
| 2026-10-04 | Handoff           | Documentação atualizada para a troca do orquestrador (Claude Code → OpenCode): AGENTS, CONTEXTO-SESSAO, este tracking e o §0 do TRACKING da Entrega 1                                                                                                                                       |
