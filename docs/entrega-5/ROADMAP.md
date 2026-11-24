# Entrega 5 — Roadmap

> Planejamento escrito em 2026-11-24, depois da Entrega 4, a partir do estado da `main`
> (`b171be5`, PR #184) e dos documentos de produto: o [BACKLOG da Entrega 2](../entrega-2/BACKLOG.md)
> (mapa completo do design e histórias US2-xx), o [ROADMAP da Entrega 2](../entrega-2/ROADMAP.md),
> o [GATES](../entrega-1/GATES.md) e o que ficou fora em
> [ENTREGA-4 §7](../entrega-4/ENTREGA-4.md#7-o-que-fica-fora-e-próximos-passos). As tarefas estão
> no [BACKLOG](BACKLOG.md), o progresso no [TRACKING](TRACKING.md) e o que o backend precisa
> construir na [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md) (resumo em
> [PEDIDOS-BACKEND](PEDIDOS-BACKEND.md)). Este documento não marca nenhuma implementação como
> pronta. **As decisões G-61 a G-72 são propostas até o usuário confirmar.**

## 1. Objetivo

Fechar o **mapa do produto** do design: o que o Figma Make propõe e o app ainda não tem.

A Entrega 4 fechou o ciclo clínico (evolução, avaliações, relatórios e notificações no app).
Faltam três frentes do design e dois ajustes de plataforma:

- o **banco de atividades completo**: jogos além do quiz, imprimíveis, habilidade, atividades
  prontas e a recomendação por paciente, com o resultado do jogo na evolução;
- o **trabalho em clínica**: equipe, papéis, convites e paciente compartilhado;
- a **gestão do dia a dia**: status e pendências dos pacientes, arquivamento, agenda mensal e
  recorrente;
- **push** das notificações (com development build) e a **central de ajuda**;
- a **validação** que ficou pendente desde a Entrega 3 (Maestro, TalkBack e aparelhos).

Proposta (G-61, a confirmar pelo usuário): entram os domínios novos do backend **Banco de
atividades, Equipe, Status de pacientes, Recorrência, Push e Ajuda**; ficam fora o WhatsApp
automático, a IA para gerar jogos e a escala clínica real (que é dado, não código).

## 2. Ponto de partida (evidência em 2026-11-24)

| Fato                                                                                                                               | Evidência                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| As 25 tarefas da Entrega 4 estão na `main` e foram validadas no emulador contra o backend real                                     | [ENTREGA-4](../entrega-4/ENTREGA-4.md); PRs #152 a #184                                   |
| Em Recursos, "Equipe e convites" e "Central de ajuda" ainda levam a "Em breve"                                                     | `src/features/resources/ResourcesScreen.tsx` (itens sem `destination`)                    |
| Na lista de pacientes, o filtro aparece como "Pendências · Em breve", desabilitado; a contagem "pacientes ativos" é o total        | `src/features/patients/list/PatientsListScreen.tsx`                                       |
| O banco de atividades filtra por Atividades, Grupos e Cadernos; não há Interativas/Imprimíveis, habilidade nem "Recomendado para"  | `src/features/activities/ActivitiesScreen.tsx`                                            |
| O motor de atividades tem o registro `type → componente`, só com o quiz (`multipleChoice`)                                         | `src/features/activities/engine/registry.ts`                                              |
| A API só tem `TaskType = multipleChoice \| multipleChoiceWithMedia`; nada de formato, habilidade, biblioteca ou resultado de jogo  | [PROJECT.md](../PROJECT.md#enums-e-uniões)                                                |
| Não há clínica, papel nem convite na API; existem `Student.educators` e `POST /student/assign-educator` (transferência por e-mail) | [PROJECT.md](../PROJECT.md#post-studentassign-educator)                                   |
| O app não tem tela de cadastro; `POST /educator/register` existe e não é usado                                                     | `app/(auth)/` (só `login` e `forgot-password`)                                            |
| A Agenda mostra a faixa da semana; o `MiniCalendar` mensal existe mas não é usado pela aba; `GET /appointment?from&to` já existe   | `src/features/appointments/components/MiniCalendar.tsx`; PROJECT (Entrega 4)              |
| As notificações são só no app (G-59); `expo-notifications`, `expo-dev-client` e `expo-video` não estão instalados                  | `package.json`; G-59                                                                      |
| Pontos em aberto do backend: RP-02, repetição diária das notificações, `timeToAnswer` antigo                                       | [BACKEND-ENTREGUE da Entrega 4 §6](../entrega-4/BACKEND-ENTREGUE.md#6-pontos-em-aberto)   |
| Não dá para apagar responsável, próxima revisão e notas do plano nem a mídia de uma atividade salva                                | [ESCOPO-ENTREGA-3 §11](../entrega-3/ESCOPO-ENTREGA-3.md#11-limitações-conhecidas); ATV-06 |
| QA-02 (Maestro), QA-03 (TalkBack) e QA-04 (Android físico e iOS) nunca foram feitas                                                | [TRACKING da Entrega 4](../entrega-4/TRACKING.md)                                         |
| Só a escala fictícia `DEMO-RASTREIO` existe; a real depende do responsável clínico (G-55)                                          | PROJECT (Escalas)                                                                         |

## 3. Escopo

### 3.1 Dentro

| Bloco                       | Tarefas                                          | Resultado                                                                                                                 |
| --------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| A — Base e pendências       | API-06, API-07, FEC-06                           | Contrato registrado; tipos e mocks do backend novo; limpar campos que hoje não se apagam                                  |
| B — Banco de atividades     | ATV-09, ATV-04a, ATV-04b, ATV-11, ATV-05, EVO-03 | Banco com filtros e recomendação, três jogos, editor dos tipos novos, imprimível em PDF e o resultado do jogo na evolução |
| C — Equipe                  | EQP-01, EQP-02, EQP-03, EQP-04                   | Criar a equipe, convidar por código, papéis, cadastro pelo convite e paciente compartilhado                               |
| D — Pacientes e agenda      | PAC-10, PAC-11, AGE-05, AGE-06                   | Status e "Pendências" na lista, arquivar, visão mensal e atendimentos recorrentes                                         |
| E — Push, ajuda e navegação | BLD-01, NOT-02, AJD-01, NAV-05                   | Development build Android, push e preferências, central de ajuda e o app sem "Em breve"                                   |
| F — Qualidade               | QA-08, QA-02, QA-03, QA-04                       | Roteiro manual, E2E com Maestro, acessibilidade e aparelhos                                                               |

**25 tarefas**: 21 de desenvolvimento e 4 de qualidade, o mesmo tamanho da Entrega 4. O
detalhe de cada uma está no [BACKLOG §4](BACKLOG.md#4-tarefas).

IDs novos: API-06, API-07, FEC-06, ATV-09, ATV-11, EQP-03, EQP-04, PAC-10, PAC-11, AGE-05,
AGE-06, BLD-01, NOT-02, NAV-05 e QA-08. ATV-04a, ATV-04b, ATV-05, EVO-03, EQP-01, EQP-02,
AJD-01, QA-02, QA-03 e QA-04 vêm do mapa da Entrega 2 e mantêm o ID (a ATV-04b junta as
subtarefas "b" e "d" do mapa).

### 3.2 Fora (não objetivos)

- **WhatsApp automático** (AGE-02 além do G-53) e **"Confirmar por WhatsApp"** por atendimento:
  exigem a API oficial do WhatsApp Business, modelos aprovados e custo por mensagem. O lembrete
  manual pelo `wa.me` continua.
- **IA para gerar jogos e imprimíveis:** a geração com IA (ATV-07) continua só na múltipla
  escolha.
- **Escala clínica real** (G-55): entra como dado no backend quando o responsável clínico
  enviar conteúdo, referência e licença; o app já é guiado por dados e não muda.
- **Acesso do administrador a todos os pacientes** e **relatórios da clínica** (G-62).
- **Publicação nas lojas** (Play Store e App Store) e **build de produção**: o development build
  da BLD-01 serve para testar o push e os aparelhos.
- **Escalas criadas pelo educador**, **financeiro** e **cobrança**.

## 4. Cobertura do produto

O que o mapa do produto (Entrega 2) propõe, a situação depois da Entrega 4 e onde entra.

| Item do produto                                                     | Depois da Entrega 4                              | Entrega 5                                    |
| ------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| ATV-01 Banco: formato, habilidade, recomendação, miniaturas         | Parcial: busca, categoria e tipo de conteúdo     | ATV-09                                       |
| ATV-02 Ver todas: paginação no servidor; "Jogar" e "Imprimir"       | Parcial: paginação no cliente, só "Jogar" o quiz | ATV-09, ATV-05                               |
| ATV-04 Tipos de atividade (a Forme a palavra, b Associe, d Memória) | Só o "c" (Leia e responda, o quiz)               | ATV-04a, ATV-04b                             |
| ATV-05 Imprimíveis                                                  | Não iniciado                                     | ATV-05                                       |
| ATV-06 Criar e editar atividade                                     | Concluída; não remove mídia salva                | FEC-06 (remover mídia), ATV-11 (tipos novos) |
| ATV-07 Atividades com IA                                            | Concluída, só múltipla escolha                   | Fora: IA para jogos                          |
| EVO-03 Atividade durante a sessão                                   | Não iniciado (G-35)                              | EVO-03                                       |
| EQP-01 Equipe e convites                                            | "Em breve"                                       | EQP-01, EQP-03                               |
| EQP-02 Permissões por papel; papel no perfil ("Administradora")     | Não iniciado                                     | EQP-02                                       |
| Paciente acompanhado por mais de um profissional                    | Só transferência (`assign-educator`)             | EQP-04                                       |
| AJD-01 Central de ajuda                                             | "Em breve"                                       | AJD-01                                       |
| NOT-01 Push                                                         | Só o sino e a lista (G-59)                       | BLD-01, NOT-02                               |
| PAC-01 Status do paciente, filtro "Pendências", pacientes ativos    | "Pendências · Em breve"                          | PAC-10, PAC-11                               |
| PAC-07 Apagar o responsável                                         | Não dá (campo vazio = não enviado)               | FEC-06                                       |
| Agenda: visão mensal                                                | Fora nas Entregas 3 e 4                          | AGE-05                                       |
| Agenda: recorrência                                                 | Fora nas Entregas 3 e 4                          | AGE-06                                       |
| AGE-02 WhatsApp automático e "Confirmar por WhatsApp"               | Só `wa.me` (G-53)                                | Fora: API do WhatsApp Business               |
| REC-01 Recursos sem "Em breve"                                      | Equipe e Ajuda em "Em breve"                     | NAV-05                                       |
| RP-02 Nome do paciente no relatório da escola                       | Nome completo; decisão pendente                  | G-71 (backend, PP-06); o app não muda        |
| Repetição diária das notificações                                   | Uma por dia por pendência; decisão pendente      | G-72 (backend, PP-07); o app não muda        |
| `timeToAnswer` antigo, em segundos                                  | Limitação do backend                             | PP-08 (backend)                              |
| G-55 Escala clínica real                                            | Só a fictícia                                    | Fora do app: dado do backend                 |
| QA-02, QA-03 e QA-04                                                | Nunca feitas                                     | QA-02, QA-03, QA-04 (com QA-08)              |

## 5. Decisões propostas

Propostas pelo planejamento em 2026-11-24. **Nenhuma está decidida**: cada uma tem
recomendação e alternativa, e o texto completo está no [GATES](../entrega-1/GATES.md).

| Gate | Decisão proposta                                                                                                                                                             | Alternativa                                                       | Bloqueia                 |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------ |
| G-61 | Escopo: Banco de atividades, Equipe, Status de pacientes, Recorrência, Push e Ajuda; fora WhatsApp automático, IA para jogos e escala real                                   | Só atividades e pacientes; equipe e push numa Entrega 6           | Todo o planejamento      |
| G-62 | Equipe: clínica com papéis `ADMIN` e `PROFESSIONAL`; o paciente tem dono e é **compartilhado explicitamente**; o `ADMIN` não vê os pacientes dos outros                      | O `ADMIN` vê todos os pacientes da clínica                        | EQP-01 a EQP-04          |
| G-63 | Convite por **código de 8 caracteres** (7 dias, uso único) compartilhado pelo `Share`; quem não tem conta cria no app ("Tenho um convite")                                   | Convite por e-mail enviado pelo backend, com link                 | EQP-01, EQP-03           |
| G-64 | Jogos da entrega: **Forme a palavra, Associe as cores e Memória visual**, com atividades prontas por seed no backend e editor manual no app                                  | Só "Forme a palavra"; os outros numa entrega seguinte             | ATV-04a, ATV-04b, ATV-11 |
| G-65 | Resultado do jogo (revê G-35): registrado por sessão, **fora do acerto** das análises atuais e mostrado na evolução, sem virar critério automático                           | Contar o jogo como acerto nas análises                            | EVO-03                   |
| G-66 | Imprimível: o backend guarda o conteúdo estruturado; **o app gera o PDF** com `expo-print`, como os relatórios (G-58)                                                        | O backend guarda um PDF pronto por atividade                      | ATV-05                   |
| G-67 | Push com **development build Android** (EAS, perfil `development`); o dia a dia continua no Expo Go; entram `expo-notifications` e `expo-dev-client`; iOS só com conta Apple | Continuar sem push (G-59)                                         | BLD-01, NOT-02, QA-04    |
| G-68 | Recorrência **semanal ou quinzenal**, de 2 a 26 ocorrências criadas de uma vez; a ocorrência em conflito é pulada; editar e cancelar "este e os seguintes"                   | Regra de repetição calculada na leitura, sem ocorrências gravadas | AGE-06                   |
| G-69 | Central de ajuda com conteúdo do backend e vídeo pelo **`expo-video`** (dependência nova); tutorial sem vídeo mostra os passos em texto                                      | Só texto no app, sem vídeo                                        | AJD-01                   |
| G-70 | Paciente **ativo ou arquivado**; arquivar pede confirmação e cancela os atendimentos futuros; o status do cartão e as pendências vêm do servidor                             | Status calculado no app a partir das listas que já existem        | PAC-10, PAC-11           |
| G-71 | RP-02: no relatório para a **escola**, o paciente aparece como **primeiro nome e inicial** ("Ana S.")                                                                        | Nome completo em todas as audiências (como hoje)                  | Backend (PP-06)          |
| G-72 | Notificação de pendência **uma vez por pendência**, sem repetir todo dia; "Atendimentos de hoje" continua diária                                                             | Repetir todo dia enquanto a pendência existir (como hoje)         | Backend (PP-07)          |

Decisões de produto que o backend confirma estão na
[ESPECIFICACAO-BACKEND §12](ESPECIFICACAO-BACKEND.md#12-decisões-de-produto-para-confirmar-com-o-backend).

## 6. Ondas

O app trabalha **com mocks fiéis à especificação enquanto o backend constrói** (G-29), e cada
tela é integrada quando a leva correspondente for publicada
([ESPECIFICACAO-BACKEND §11](ESPECIFICACAO-BACKEND.md#11-ordem-de-entrega-sugerida-levas)). Uma
tarefa só é concluída depois de testada contra o backend real.

| Onda  | Tarefas                                     | Depende do backend                                | Observação                                                           |
| ----- | ------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| E5-0  | AGE-05, QA-08 (esqueleto), BLD-01           | Não                                               | Começa já; BLD-01 só com autorização do usuário e conta Expo         |
| E5-1  | API-07 (atividades)                         | Mocks pela especificação; contrato real na leva 1 | Dono único de `src/api/types.ts`                                     |
| E5-2  | ATV-09, ATV-04a                             | Leva 1                                            | Arquivos disjuntos                                                   |
| E5-3  | ATV-04b, ATV-11                             | Leva 1                                            | —                                                                    |
| E5-4  | ATV-05, EVO-03                              | Leva 1                                            | EVO-03 mexe no player da sessão e na evolução                        |
| E5-5  | API-07 (equipe), EQP-01, EQP-03             | Leva 2                                            | EQP-03 é dona do login nesta onda                                    |
| E5-6  | EQP-02, EQP-04                              | Leva 2                                            | EQP-04 é dona da ficha nesta onda                                    |
| E5-7  | API-07 (pacientes e agenda), PAC-10, AGE-06 | Leva 3                                            | AGE-06 parte da Agenda já com a visão mensal (AGE-05)                |
| E5-8  | PAC-11, FEC-06                              | Leva 3                                            | —                                                                    |
| E5-9  | API-07 (push e ajuda), NOT-02, AJD-01       | Leva 4; NOT-02 depende da BLD-01                  | —                                                                    |
| E5-10 | NAV-05                                      | —                                                 | Por último: liga Recursos aos domínios entregues e remove "Em breve" |
| E5-11 | QA-08 (rodada), QA-03, QA-02                | —                                                 | Emulador só com autorização do usuário no momento                    |
| E5-12 | QA-04                                       | —                                                 | Android físico com o development build; iOS só com Mac ou iPhone     |

Regras de execução que continuam valendo (pedidos do usuário):

- trabalho **faseado**, com no máximo **2 workers** ao mesmo tempo;
- **uma tarefa = um PR**; merge só com CI verde;
- **testes só do essencial**: os AC `CT`/`UT` das fichas; o CI roda a suíte inteira;
- **emulador e build nativo só com autorização do usuário no momento**, depois das tarefas de
  código.

Caminho crítico:

```
backend leva 1 → API-07 → ATV-09 → ATV-04a → ATV-04b → EVO-03
  → backend leva 2 → EQP-01 → EQP-02 → EQP-04
  → backend leva 3 → PAC-10 → PAC-11 → NAV-05 → QA-08 → QA-02 → QA-04
BLD-01 (autorização) → backend leva 4 → NOT-02 → QA-04
```

O backend é o caminho crítico, como na Entrega 4. A BLD-01 é o segundo: sem o development
build, o push (NOT-02) e o Android físico da QA-04 não acontecem. Se uma leva atrasar, o app
adianta as telas com mocks e para antes da integração.

## 7. Riscos

| Risco                                                                                                        | Efeito                                      | Mitigação                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| A equipe muda a regra de acesso de **todas** as rotas clínicas do backend ("dono" → "dono ou compartilhado") | Vazamento entre educadores ou 403 indevidos | Regra única no backend com teste por domínio (BE-EQ-05, BE-EQ-06); QA-08 com dois educadores fictícios                      |
| Conteúdo pedagógico das atividades prontas e dos tutoriais não existe                                        | Banco e ajuda vazios                        | O editor (ATV-11) permite criar; tutorial sem vídeo mostra texto (AJ-03); dono do conteúdo definido no G-61                 |
| O development build depende de conta Expo, credenciais FCM e da máquina (build pesado no Windows)            | Push e Android físico parados               | BLD-01 na primeira onda, com autorização; build na nuvem (EAS) em vez de local; NOT-02 fecha com push só se a BLD-01 fechar |
| Dados de crianças na tela bloqueada                                                                          | Exposição de dados                          | Push genérico, sem nome de paciente (PU-03)                                                                                 |
| Jogos com toque fino (letras, cartas)                                                                        | Acessibilidade ruim                         | Alvos ≥ 44 e rótulos acessíveis nos AC; QA-03 cobre os jogos                                                                |
| Recorrência cria dezenas de atendimentos de uma vez                                                          | Agenda poluída por engano                   | Prévia com o número de ocorrências e as puladas antes de confirmar; "cancelar este e os seguintes"                          |
| Seis domínios novos no backend (a Entrega 4 teve quatro)                                                     | Blocos incompletos                          | Levas por prioridade; cada bloco fecha sozinho; push e ajuda podem ir para a Entrega 6                                      |
| Arquivos compartilhados (`types.ts`, ficha, lista de pacientes, Agenda, Recursos, login)                     | Conflitos entre PRs                         | Dono único por onda ([BACKLOG §3](BACKLOG.md#3-propriedade-de-arquivos-compartilhados))                                     |
| Homologação iOS sem Mac ou iPhone                                                                            | QA-04 incompleta                            | Registrar a pendência; não declarar iOS validado sem evidência                                                              |

## 8. Manutenção

O orquestrador atualiza este roadmap quando uma decisão do §5 for tomada ou quando o backend
publicar uma leva que mude o escopo. O progresso vai para o [TRACKING](TRACKING.md).
