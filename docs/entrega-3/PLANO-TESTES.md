# Plano de testes manuais — Entrega 3

Roteiro da rodada manual da Entrega 3 (QA-06), no emulador Android com o Expo Go e o **backend
real**, com os mocks desligados. Complementa os testes automatizados (Vitest) e serve de base
para os fluxos E2E (QA-02, Maestro) e para o checklist de acessibilidade (QA-03). O formato
segue o [plano da Entrega 1](../entrega-1/PLANO-TESTES.md).

> **Estado deste documento (2026-10-29):** índice da rodada manual. Os casos detalhados estão na
> pasta [`testes/`](testes/01-agenda.md), um arquivo por área: cada caso traz o objetivo, os
> passos com a copy exata, o resultado esperado na tela e na rede (rota, corpo e status), onde
> está no código (rota, tela, componente, hook, chave de consulta, endpoint, mock e design
> system), os testes automatizados que já cobrem aquilo e, se falhar, as hipóteses e onde olhar.
> Nenhum caso foi executado; o emulador só roda quando o usuário autorizar. Os IDs dos casos são
> os mesmos da primeira versão deste roteiro (PR #110); os arquivos detalhados acrescentaram
> casos.

Legenda de prioridade: **P1** bloqueia a entrega, **P2** é importante, **P3** é refinamento.
Legenda do resultado: **OK**, **FALHA** (com o ID do caso e a captura), **N/A** (com o motivo)
ou **BLOQ** (bloqueado por outro caso).

## 1. Ambiente e preparação

### 1.1 Ambiente

- **Plataforma:** emulador Android (anote o AVD e a versão do Android) com o **Expo Go**.
  iOS e aparelho físico ficam para a QA-04.
- **Antes de abrir o emulador:** a máquina fica só com o Android Studio aberto, e a rodada só
  começa com a **autorização do usuário no momento** (AGENTS §7).
- **`.env`** na raiz do repositório, com:

  ```text
  EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app
  EXPO_PUBLIC_USE_MOCKS=false
  ```

- **Metro:** `pnpm start --clear` (limpa o cache do bundler depois de mudar o `.env`). Abra o app
  no Expo Go pelo QR code ou pelo atalho do emulador. Registre a branch e o hash do commit
  testados.
- **Conferência de que os mocks estão desligados:** o login com a conta de teste só funciona com
  o backend real; o login fictício dos mocks deve ser **recusado**. Se ele entrar, a variável não
  foi lida: pare e refaça o `pnpm start --clear`.
- **Conta de teste:** a "conta de teste do time" (e-mail e senha com o orquestrador). **Não
  escreva credenciais, tokens nem e-mails neste documento, nas capturas ou nos relatos.**
- **Rede:** o backend fica na Vercel; a primeira chamada pode demorar (partida a frio). A
  geração de plano por IA pode levar dezenas de segundos (caso PLN-02.2).

### 1.2 Dados de teste a criar

Todos fictícios, criados na própria rodada com a conta de teste. Nada de dado de paciente real.

| Dado                  | Como criar                                                                                                                                                                                  | Usado em                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Paciente A            | Pacientes → "Novo paciente": nome "Paciente Teste Um", idade 8, uma dificuldade; **com responsável** (nome, parentesco e telefone fictício só com dígitos, ex.: DDD 11 e número 90000-0000) | AGE, PAC-07, PAC-06, PAC-04, PLN, SES |
| Paciente B            | Mesmo caminho, **sem** responsável e **com** telefone de contato do paciente                                                                                                                | AGE-02 (telefone alternativo)         |
| Paciente C            | Mesmo caminho, **sem nenhum telefone**                                                                                                                                                      | AGE-02 (botão desabilitado)           |
| Caderno de atividades | Reaproveitar um da V1, ou criar em Recursos → Cadernos, com 2 ou 3 atividades                                                                                                               | SES, FEC-01                           |
| Modelo de anamnese    | Criado no caso PAC-08.1 (uma pergunta de cada tipo)                                                                                                                                         | PAC-08, PAC-06                        |
| Atendimentos          | Criados nos casos da Agenda; ao menos um "Pendente" hoje (para o fluxo F1), um para amanhã e um para a lixeira (excluir)                                                                    | AGE, SES, fluxos                      |
| Planos                | Criados nos casos PLN-02 e PLN-03; o Paciente A termina a rodada com **um PDI ativo** (para o `409` e para o PE)                                                                            | PLN, PAC-04                           |

Se a conta de teste já tiver dados de rodadas anteriores, use-os só para leitura; crie os
próprios dados para os casos que alteram.

### 1.3 Como registrar a evidência

- Uma **captura de tela por caso** que falha, e uma por caso P1 que passa. Nome:
  `E3-<ID do caso>-<NN>.png` (por exemplo, `E3-AGE-03.5-01.png`), numeradas na ordem da rodada.
- **Sem dados pessoais:** só os dados fictícios da §1.2; nunca o e-mail da conta, o token, a
  senha nem telefones reais. Antes de salvar, confira o enquadramento (barra de notificações,
  teclado com sugestões, foto de perfil).
- As capturas ficam **fora do repositório**; o relatório da rodada cita o nome do arquivo.
- Para os casos da §4 (backend), anote também o **método, o caminho e o status HTTP** da
  chamada observada (ferramenta de rede do Metro/Expo ou o log do app em desenvolvimento).
  **Não copie corpo de resposta** com dados de pessoas, nem valores de `educators`/`_password`.
- Em cada caso, preencha a coluna "Resultado" (OK, FALHA, N/A, BLOQ). Falha vira tarefa de
  correção no BACKLOG/TRACKING com o ID do caso, e a correção entra num PR próprio com teste que a
  reproduz.
- O relatório final da rodada segue o modelo do
  [QA-05](../entrega-2/QA-05-RELATORIO.md) (seção "Entrega 3"), com data, plataforma, commit
  testado e a lista de rotas exercitadas.

## 2. Casos por área (índice)

Antes da rodada, leia as [divergências encontradas](testes/00-divergencias.md): 28 achados por
leitura do código (defeitos prováveis, ajustes de UX, diferenças de documentação, lacunas de
teste e decisões pendentes), cada um com o caso e o arquivo relacionados.

| Arquivo                                                                  | Cobre                                                                                                                                                | Tarefas                                                | Casos | P1  |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----- | --- |
| [01-agenda](testes/01-agenda.md)                                         | Agenda semanal, novo atendimento, detalhe e ações por status, conflito de horário, iniciar sessão pelo atendimento, lembrete pelo WhatsApp           | AGE-01 a AGE-04                                        | 27    | 16  |
| [02-pacientes](testes/02-pacientes.md)                                   | Editar paciente e responsável, anamnese do paciente, modelos de anamnese, aba Planos e PDI vigente                                                   | PAC-04, PAC-06, PAC-07, PAC-08                         | 24    | 15  |
| [03-conta-sessao-conteudo-base](testes/03-conta-sessao-conteudo-base.md) | Perfil, foto e sair; sessão ligada ao caderno e retomada; detalhe da atividade; grupos de caderno; limpeza da Entrega 1; mocks desligados por padrão | REC-02, SES-05, ATV-02, FEC-02, FEC-03, FEC-04, NAV-03 | 21    | 13  |
| [04-planos](testes/04-planos.md)                                         | Lista, gerar com IA, rascunho e salvar, detalhe (metas, revisões, editar, encerrar), sugestões da IA e a tabela de tempos da IA                      | PLN-01 a PLN-05                                        | 30    | 17  |
| [05-fec01-rotas-v1](testes/05-fec01-rotas-v1.md)                         | Rotas da V1 ainda não exercitadas contra o backend real, rota a rota                                                                                 | FEC-01                                                 | 10    | 9   |

## 3. Fluxos entre telas e conferências do backend

[06-fluxos-e-backend](testes/06-fluxos-e-backend.md): os fluxos F1 a F5 (agenda → sessão →
concluído; ficha → editar → WhatsApp; anamnese; plano completo; perfil → sair), com o ponto de
verificação entre telas e a consulta que precisa ser invalidada, e as conferências do contrato
do backend (BE-01 em diante). São 24 casos, 21 deles P1.

## 4. Testes das tarefas de validação

| Tarefa                 | Arquivo                                                    | O que traz                                                                                                                                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QA-02 (Maestro)        | [08-maestro-qa02](testes/08-maestro-qa02.md)               | Pré-requisitos (instalação fora do projeto, com autorização), como o Maestro enxerga o app, os `testID` que faltam e os nomes propostos, os fluxos M-LOGIN, M-AGE, M-PAC, M-PLN e M-PRF passo a passo com seletor e asserção, e o esqueleto YAML de cada um |
| QA-03 (acessibilidade) | [07-acessibilidade-qa03](testes/07-acessibilidade-qa03.md) | Rótulos e papéis que existem no código, alvos de toque, contraste dos tokens, achados por leitura do código e o checklist das 16 telas da Entrega 3                                                                                                         |
| QA-04 (aparelhos)      | [09-aparelhos-qa04](testes/09-aparelhos-qa04.md)           | Matriz tela × plataforma × recurso nativo (câmera, galeria, áudio, documento, PDF, compartilhar, WhatsApp, teclado, área segura e fuso), 12 casos e o que verificar quando falhar                                                                           |

## 5. Como usar os arquivos detalhados

- Execute na ordem do índice da seção 2, depois os fluxos (seção 3) e, por fim, as tarefas de
  validação (seção 4).
- Em cada falha, use o bloco **"Se falhar"** do caso: ele separa erro do app de erro do backend
  (conferir a resposta na rede e reproduzir o cenário de mock indicado com
  `EXPO_PUBLIC_USE_MOCKS=true`) e aponta o arquivo e a função a investigar.
- Antes de abrir uma correção, rode os testes automatizados citados no caso com
  `pnpm exec vitest run <arquivo> --maxWorkers=1`.
- Registre o resultado na tabela da seção 6.2, com o ID do caso.

## 6. Critério de aceite da rodada e resultados

### 6.1 Critério (AC-QA-06-01)

- **Todos os casos P1 passam** no Android (emulador, Expo Go, backend real, mocks desligados):
  os arquivos da seção 2, os fluxos e as conferências da seção 3.
- Falhas P2 e P3 viram tarefas de correção no BACKLOG/TRACKING, com o ID do caso.
- Caso **não executado** por falta de dado ou de aparelho (por exemplo, SES-05.2 sem dois
  aparelhos) fica como **N/A com o motivo**, nunca como aprovado.
- Os resultados vão para o TRACKING e para a seção "Entrega 3" do QA-05-RELATORIO, com a data, a
  plataforma, o commit testado e os IDs que falharam.
- **Nenhuma credencial, token, e-mail ou dado pessoal** no relatório, nas capturas ou nos PRs
  de correção (AC-FEC-01-02).

### 6.2 Tabela de resultados (vazia)

| Arquivo                       | Casos    | P1      | OK  | FALHA | N/A | BLOQ | Observações |
| ----------------------------- | -------- | ------- | --- | ----- | --- | ---- | ----------- |
| 01-agenda                     | 27       | 16      |     |       |     |      |             |
| 02-pacientes                  | 24       | 15      |     |       |     |      |             |
| 03-conta-sessao-conteudo-base | 21       | 13      |     |       |     |      |             |
| 04-planos                     | 30       | 17      |     |       |     |      |             |
| 05-fec01-rotas-v1             | 10       | 9       |     |       |     |      |             |
| 06-fluxos-e-backend           | 24       | 21      |     |       |     |      |             |
| 07-acessibilidade-qa03        | 16 telas |         |     |       |     |      |             |
| 08-maestro-qa02               | 5 fluxos | 5       |     |       |     |      |             |
| 09-aparelhos-qa04             | 12       | 7       |     |       |     |      |             |
| **Total (casos)**             | **148**  | **103** |     |       |     |      |             |

Data da rodada: ______ · Emulador/Android: ______ · Commit testado: ______ · Executor: ______

## 7. Fora do escopo desta entrega (esperado como "Em breve" ou ausente)

Não conte como falha; confirme apenas que o app mostra "Em breve" (ou não oferece o recurso) e
**não quebra**.

- **Avaliações e escalas** (aba "Avaliações" da ficha, "Avaliações e escalas" em Recursos).
- **Evolução da sessão** (tela de evolução e "Evolução da sessão" em Recursos).
- **Equipe e convites**, **Central de ajuda** e **Notificações**.
- **Troca de senha** (G-49: o backend não entregou) e recuperação de senha completa.
- **Envio automático de WhatsApp** e registro do envio (o lembrete é manual, G-53).
- **Duração e tipo** como recursos de relatório; relatórios configuráveis; tipos de atividade
  imprimíveis.
- **Apagar** o nome do responsável, a próxima revisão ou as notas do plano depois de salvos
  (limitações do backend; ver os casos em [02-pacientes](testes/02-pacientes.md) e
  [04-planos](testes/04-planos.md)).
- **iOS, aparelho físico, câmera e áudio da ATV-08:** QA-04.
