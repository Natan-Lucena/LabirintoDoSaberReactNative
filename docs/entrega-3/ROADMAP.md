# Entrega 3 — Roadmap

> Planejamento escrito em 2026-10-28 pelo orquestrador, a partir do estado da `main` depois do
> PR #75 (V1 da Entrega 2). As tarefas estão refinadas no [BACKLOG](BACKLOG.md) e o progresso
> fica no [TRACKING](TRACKING.md). Os pedidos ao backend estão em
> [PEDIDOS-BACKEND](PEDIDOS-BACKEND.md). Este documento não marca nenhuma implementação como
> pronta.
>
> **Estado em 2026-10-29:** as 23 tarefas de código estão na `main` (ver
> [ENTREGA-3](ENTREGA-3.md)); faltam FEC-01, QA-02, QA-03 e QA-04, de validação.

## 1. Objetivo

Fechar a V1 da Entrega 2 e completar as quatro abas do app (Início, Agenda, Pacientes e
Recursos) com tudo o que **a API atual já permite**, e acrescentar **um único domínio novo**
entregue pelo backend: **Planos com IA (PDI/PE)**.

Decisões do usuário (2026-10-28):

- a Entrega 3 cobre o fechamento da V1, as telas que já têm API e a qualidade;
- o backend entrega **só um domínio novo**; o escolhido é **Planos com IA** (G-48);
- os demais domínios sem API (Evolução, Escalas, Relatórios configuráveis, Equipe, Ajuda,
  Notificações e WhatsApp automático) ficam para depois.

## 2. Ponto de partida (evidência em 2026-10-28)

| Fato                                                                                                        | Evidência                                                                |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| As 30 tarefas da V1 estão na `main`, validadas no emulador Android contra o backend real                    | PR #75; [ENTREGA-V1](../entrega-2/ENTREGA-V1.md)                         |
| A aba Agenda é um placeholder "Em breve"                                                                    | `app/(tabs)/agenda.tsx`                                                  |
| A lógica de agendamentos da Entrega 1 existe e está testada (consulta, seletores por dia, mutações)         | `src/features/appointments/**`, `src/api/endpoints/appointment.ts`       |
| "Editar paciente" e "Perfil" levam a "Em breve"; não existe função de `PUT /student/update/:id`             | `PatientDetailScreen.tsx`, `ResourcesScreen.tsx`, `src/api/endpoints/`   |
| **Não há botão "Sair" em nenhuma tela**; o `logout` existe só na store                                      | `src/stores/auth.ts`; busca por `logout` fora de testes                  |
| O contato com o responsável já abre o WhatsApp (`wa.me`) pela ficha                                         | `PatientDetailScreen.tsx` (`openContact`)                                |
| O passo "Paciente" da sessão já aceita `?studentId=` e pré-seleciona o paciente                             | `src/features/sessions/StudentStep.tsx`                                  |
| A Início e a lista de pacientes ainda navegam para rotas da Entrega 1 (`/students/…`)                       | `HomeScreen.tsx`, `PatientsListScreen.tsx`                               |
| As abas escondidas `activities` e `reports` são telas **da V1** (banco de atividades e relatórios do aluno) | `app/(tabs)/activities.tsx`, `app/(tabs)/reports.tsx`                    |
| Modelos de anamnese são **por educador**: sem modelo criado, não há o que preencher                         | [PROJECT.md](../PROJECT.md#anamnese-template--5-rotas)                   |
| `POST /educator/update-password` é público e não pede token nem a senha atual (G-05)                        | [PROJECT.md](../PROJECT.md#post-educatorupdate-password)                 |
| `PUT /appointment/:id` só aceita `scheduledAt` e `observation`: não há como cancelar mantendo o registro    | [PROJECT.md](../PROJECT.md#put-appointmentid)                            |
| Nenhuma rota de planos existe no contrato                                                                   | [BACKLOG da Entrega 2 §2.3](../entrega-2/BACKLOG.md#23-cobertura-da-api) |
| Todas as bibliotecas necessárias já estão instaladas (data, hora, documento, imagem, PDF, compartilhamento) | `package.json`                                                           |

## 3. Escopo

### 3.1 Dentro

| Bloco                    | Tarefas                                                                                | Resultado                                                                      |
| ------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| A — Fechamento da V1     | FEC-01, FEC-02, FEC-03, FEC-04, ATV-02                                                 | V1 ponta a ponta contra o backend real, sem pendência de código                |
| B — Telas com API pronta | NAV-03, API-03, AGE-01, AGE-02, AGE-03, AGE-04, SES-05, PAC-07, PAC-06, PAC-08, REC-02 | Quatro abas sem "Em breve" que dependa só do app, com o contrato de 2026-10-29 |
| C — Planos com IA        | PLN-00, PLN-01, PLN-02, PLN-03, PLN-04, PLN-05, PAC-04                                 | Gerar, revisar, salvar e acompanhar PDI/PE, contra a API do backend            |
| D — Qualidade            | QA-06, QA-02, QA-03, QA-04                                                             | Roteiro, E2E Maestro, acessibilidade e homologação Android e iOS               |

**27 tarefas** (23 do planejamento + API-03, SES-05 e FEC-04, que surgiram com a entrega do backend em 2026-10-29, + AGE-02 como botão do WhatsApp, G-53). O detalhe de cada uma está no [BACKLOG §4](BACKLOG.md#4-tarefas).

### 3.2 Fora (não objetivos)

- **Domínios sem API:** Evolução da sessão (EVO), Avaliações e escalas (AVA), Relatórios
  configuráveis e histórico de PDF (REL-01 a REL-03), Equipe (EQP), Central de ajuda (AJD),
  Notificações (NOT), envio automático de WhatsApp (o lembrete manual pelo `wa.me` entrou como AGE-02, G-53), tipos de atividade jogáveis (ATV-04) e
  imprimíveis (ATV-05).
- **Campos que a API não tem:** até 2026-10-28, tipo, duração e status do atendimento,
  responsável do paciente e profissão do educador. **Em 2026-10-29 o backend entregou todos**
  ([BACKEND-ENTREGUE](BACKEND-ENTREGUE.md)); continuam fora: "Confirmar por WhatsApp" por
  atendimento, síntese dedicada da anamnese e paginação.
- **Troca de senha no perfil** (G-49): o backend não entregou a troca autenticada em 2026-10-29.
- **Recuperação de senha** (G-05): segue como na Entrega 1.
- **Development build / EAS:** o app continua no Expo Go (G-41), salvo na homologação iOS (QA-04).

## 4. Telas

| Tipo           | Telas                                                                                                                                                            | Qtd. |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Novas          | Agenda (aba), Novo atendimento, Detalhe e edição do atendimento, Editar paciente, Anamnese, Perfil e conta                                                       | 6    |
| Novas (planos) | Lista de planos, Gerar plano com IA (com o rascunho editável), Detalhe do plano, Sugestões da IA                                                                 | 4    |
| Novas (G-50)   | Modelos de anamnese (lista) e Modelo de anamnese (criar e editar)                                                                                                | 2    |
| Alteradas      | Detalhe da atividade (visual novo), Ficha do paciente (aba Planos, Editar, Anamnese), Início (ações e cartão de sugestões), Recursos (Perfil, Planos e Anamnese) | 4    |
| Removidas      | Aba Alunos e Agenda da Entrega 1, ficha e cadastro de aluno da Entrega 1 (`/students/…`) (G-47)                                                                  | ~4   |

**Total de telas novas: 12** (com os modelos de anamnese, G-50 aprovada). As Sugestões da IA
(PLN-05) dependem da segunda leva do backend; sem ela, são 11.

## 5. Decisões

| Gate | Decisão                                                                                    | Estado                              |
| ---- | ------------------------------------------------------------------------------------------ | ----------------------------------- |
| G-47 | Limpeza da Entrega 1 (substitui a proposta G-33, que mandava remover telas que viraram V1) | **Resolvido (usuário, 2026-10-28)** |
| G-48 | Domínio novo do backend na Entrega 3: Planos com IA                                        | **Resolvido (usuário, 2026-10-28)** |
| G-49 | Troca de senha fica fora do perfil enquanto `update-password` não autenticar o pedido      | **Resolvido (usuário, 2026-10-28)** |
| G-50 | Modelos de anamnese (CRUD de templates) entram na Entrega 3                                | **Resolvido (usuário, 2026-10-28)** |
| G-51 | Mocks desligados por padrão em desenvolvimento                                             | **Resolvido (usuário, 2026-10-28)** |

| G-53 | WhatsApp sem API: botão `wa.me` com mensagem pronta (atendimento, Início e ficha) | **Resolvido (usuário, 2026-10-29)** |
| G-52 | Sugestões da IA geradas sob demanda ("Pedir sugestões"), não ao encerrar a sessão | **Resolvido (backend, 2026-10-29)** |

O texto completo, as alternativas e as recomendações estão em
[GATES](../entrega-1/GATES.md). **G-06** (vínculo sessão ↔ caderno) foi resolvido pelo backend
em 2026-10-29 (`taskNotebookId` no `start`; implementação no app pela SES-05). **G-05**
(recuperação e troca de senha) continua aberto.

## 6. Ondas

| Onda  | Tarefas                                          | Observação                                                            |
| ----- | ------------------------------------------------ | --------------------------------------------------------------------- |
| E3-0  | NAV-03 ✓, FEC-02 ✓, PLN-00 ✓                     | Concluídas                                                            |
| E3-1  | AGE-01 ✓, ATV-02 ✓, FEC-03 ✓                     | Concluídas                                                            |
| E3-2  | API-03 ✓, PAC-08 ✓                               | Concluídas                                                            |
| E3-3  | AGE-03 ✓, SES-05 ✓, PAC-07 ✓, REC-02 ✓, FEC-04 ✓ | Arquivos disjuntos (BACKLOG §3)                                       |
| E3-4  | AGE-04 ✓, FEC-01                                 | FEC-01 exige o emulador, com autorização do usuário                   |
| E3-5  | AGE-02 ✓                                         | Botão do WhatsApp (G-53); depois de PAC-07 e AGE-04 (mesmos arquivos) |
| E3-6  | PAC-06 ✓, PLN-01 ✓                               | Concluídas                                                            |
| E3-7  | PLN-02 ✓                                         | Concluídas                                                            |
| E3-8  | PLN-03 ✓, PAC-04 ✓                               | Concluídas                                                            |
| E3-9  | PLN-04 ✓                                         | Concluídas                                                            |
| E3-10 | PLN-05 ✓                                         | Sugestões sob demanda (G-52)                                          |
| E3-11 | QA-06 ✓                                          | Concluídas                                                            |
| E3-12 | QA-02, QA-03, QA-04                              | QA-04 exige aparelho físico e Mac/iPhone                              |

O trabalho segue **faseado** (pedido do usuário, 2026-10-29): o orquestrador avisa ao fim de cada
fase antes de seguir. **O emulador só roda depois de todas as tarefas de código** (pedido do usuário, 2026-10-29):
PLN-04, depois PLN-05 com QA-06 (roteiro escrito); por último, a rodada no emulador (FEC-01,
validação manual das telas, QA-02 e QA-03) e a QA-04 nos aparelhos, com autorização. No máximo 2 workers ao mesmo tempo (pedido do usuário); a ordem dentro de cada onda segue a
disponibilidade.

Caminho crítico:

```
API-03 → AGE-03 / SES-05 → AGE-04 → PLN-01 → PLN-02 → PLN-03 → PLN-04 → PLN-05 → QA-06 → QA-02 → QA-04
```

## 7. Riscos

| Risco                                                                                               | Efeito                       | Mitigação                                                                               |
| --------------------------------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| O contrato de planos atrasa ou muda depois de implementado                                          | Bloco C parado ou retrabalho | PLN-00 antes de qualquer código de planos; blocos A, B e D seguem                       |
| A geração de plano por IA é lenta                                                                   | Tela travada ou timeout      | Mesmo padrão da V1: `AI_TIMEOUT_MS` (G-46), carregamento e erro, sem reenvio automático |
| Excluir atendimento apaga o histórico (não há "cancelar")                                           | Perda de registro            | Confirmação explícita com o texto "Excluir"; pedido de status no backend                |
| Anamnese com dados sensíveis de crianças                                                            | Exposição indevida           | Nada de resposta em log; cache cifrado (G-41); logout limpa tudo (G-04)                 |
| Arquivos compartilhados entre tarefas (`HomeScreen`, `PatientDetailScreen`, `src/mocks/install.ts`) | Conflitos entre PRs          | Ondas com dono único por arquivo; o `install.ts` só recebe linhas novas                 |
| Homologação iOS sem Mac/iPhone disponível                                                           | QA-04 incompleta             | Registrar a pendência; não declarar iOS validado sem evidência                          |

## 8. Manutenção

O orquestrador atualiza este roadmap quando uma decisão do §5 for tomada ou quando o contrato
de planos (PLN-00) mudar o escopo. O progresso vai para o [TRACKING](TRACKING.md).
