# Plano de testes manuais — Entrega 4

Roteiro da rodada manual da Entrega 4 (QA-07), no emulador Android com o Expo Go e o **backend
real**, com os mocks desligados. Complementa os testes automatizados (Vitest) e serve de base
para os fluxos E2E (QA-02, Maestro), o checklist de acessibilidade (QA-03) e a homologação em
aparelhos (QA-04). O formato segue o [plano da Entrega 3](../entrega-3/PLANO-TESTES.md).

> **Esqueleto (2026-11-12). A rodada acontece depois de todas as tarefas de código, no emulador
> Android com autorização do usuário, contra o backend real.** Nenhum caso foi executado. As
> colunas "Resultado" ficam vazias até a rodada. Os passos usam a copy do [BACKLOG](BACKLOG.md) e
> do design; antes da rodada, a QA-07 (E4-11) confere cada passo contra a tela entregue e o
> contrato registrado pela API-04, e detalha os casos em `testes/` se preciso.

Legenda de prioridade: **P1** bloqueia a entrega, **P2** é importante, **P3** é refinamento.
Legenda do resultado: **OK**, **FALHA** (com o ID do caso e a captura), **N/A** (com o motivo)
ou **BLOQ** (bloqueado por outro caso).

Decisões que os casos respeitam (G-54 a G-60, em [GATES](../entrega-1/GATES.md)):

- **G-56:** ao finalizar a sessão, o app abre a **Evolução** no lugar da observação.
- **G-57:** os critérios vêm **só do PE da sessão**; sem PE, aviso com "Criar PE" e só o registro
  descritivo. O PDI não serve de reserva.
- **G-58:** o **PDF do relatório é gerado no app** (`expo-print`); o backend entrega o conteúdo.
- **G-59:** notificações **só dentro do app** (sino e lista), **sem push**.
- **G-60:** durante a aplicação, a faixa do escore parcial aparece marcada como **"parcial"**.
- **G-55:** o catálogo de escalas é do backend e somente leitura no app.

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
  testados, e **guarde o log do Metro desde a abertura** (caso FEC-05.3).
- **Conferência de que os mocks estão desligados:** o login com a conta de teste só funciona com
  o backend real; o login fictício dos mocks deve ser **recusado**. Se ele entrar, a variável não
  foi lida: pare e refaça o `pnpm start --clear`.
- **Conta de teste:** a "conta de teste do time" (credenciais com o orquestrador). **Não escreva
  credenciais, tokens nem e-mails neste documento, nas capturas ou nos relatos.**
- **Rede:** o backend fica na Vercel; a primeira chamada pode demorar (partida a frio). A
  geração por IA (plano, sugestão, insight, síntese, relatório) pode levar até 90 s
  (`AI_TIMEOUT_MS`, G-46); a tela mostra carregamento e, em erro, "Tentar novamente", **sem
  reenvio automático**.
- **Versão do backend:** anote a data da última leva conferida na API-04
  (`BACKEND-ENTREGUE.md`, quando existir). Caso que depende de leva não publicada fica **BLOQ**,
  não aprovado.

### 1.2 Dados de teste a criar

Todos fictícios, criados na própria rodada com a conta de teste. Nenhum dado de paciente real:
os nomes são sempre "Paciente Teste …".

| Dado                    | Como criar                                                                                                                        | Usado em                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Paciente A              | "Paciente Teste Um": **com foto**, com responsável (telefone fictício só com dígitos), **PE ativo** e PDI ativo                   | EVO, AVA, REL, SES-R, F1 a F4 |
| Paciente B              | "Paciente Teste Dois": **sem plano** (nem PE nem PDI)                                                                             | EVO-01.2, SES-R.11            |
| Paciente C              | "Paciente Teste Três": sem foto, **sem avaliações, sem evoluções e sem relatórios**                                               | PAC-05, EVO-02, REL-03        |
| Paciente de outra conta | Se existir uma conta de teste secundária, um paciente dela; só leitura, para as conferências de 403                               | BE-EV-06, BE-AV-07, BE-RP-06  |
| Caderno de atividades   | Reaproveitar um da V1 ou criar, com 2 ou 3 atividades                                                                             | SES-R, F1                     |
| Atendimentos            | Para o Paciente A: um "Pendente" hoje (sessão), um concluído sem evolução e dois seguidos para daqui a pouco (destaque, FEC-05.2) | SES-R, EVO-05, FEC-05         |
| Sessões finalizadas     | Ao menos uma finalizada **há mais de 25 h** sem evolução (para BE-NT-02) e uma recente; as demais nascem da rodada                | EVO-02, NOT-01, BE-EV, BE-NT  |
| Escala                  | A do catálogo do backend ("Escala de rastreio TDAH", G-55); uma aplicação em rascunho e uma concluída do Paciente A               | AVA, PAC-05, F2               |
| Relatórios              | Gerados nos casos REL-01 e REL-02: um por tipo, e uma tentativa com período vazio para o erro                                     | REL, F3                       |
| Anamnese                | Resposta de anamnese do Paciente A (da Entrega 3), com e sem síntese                                                              | PAC-05, PAC-09                |
| Conta de teste (senha)  | Para AUT-01 e REC-03 use a conta de teste combinada com o orquestrador, que **restaura a senha original** depois da rodada        | AUT-01, REC-03, F5, F6, BE-SN |

Se a conta de teste já tiver dados de rodadas anteriores, use-os só para leitura; crie os
próprios dados para os casos que alteram.

### 1.3 Como registrar a evidência

- Uma **captura de tela por caso** que falha, e uma por caso P1 que passa. Nome:
  `E4-<ID do caso>-<NN>.png` (por exemplo, `E4-EVO-01.2-01.png`), numeradas na ordem da rodada.
- **Sem dados pessoais:** só os dados fictícios da §1.2; nunca o e-mail da conta, o token, a
  senha, o código de recuperação, nem telefones reais. Confira o enquadramento antes de salvar
  (barra de notificações, teclado com sugestões, foto de perfil).
- **Dado clínico não vai para log nem para o relato:** o texto da evolução, as respostas das
  escalas, a síntese da anamnese e o conteúdo dos relatórios ficam só na tela do aparelho. O
  relato cita o ID do caso e o resultado, não o conteúdo.
- As capturas ficam **fora do repositório**; o relatório da rodada cita o nome do arquivo.
- Para os casos de backend (§5), anote o **método, o caminho e o status HTTP** da chamada
  observada (ferramenta de rede do Metro/Expo, log do app em desenvolvimento ou Swagger em
  `/api-docs/`). **Não copie corpo de resposta** com dados de pessoas, nem `educators` ou
  `_password`.
- Em cada caso, preencha a coluna "Resultado" (OK, FALHA, N/A, BLOQ). Falha vira tarefa de
  correção no BACKLOG/TRACKING com o ID do caso, e a correção entra num PR próprio com teste que
  a reproduz.
- O relatório final da rodada segue o modelo do [QA-05](../entrega-2/QA-05-RELATORIO.md) (seção
  "Entrega 4"), com data, plataforma, commit testado e a lista de rotas exercitadas.

## 2. Casos por tarefa

Um caso por critério `MAN` do [BACKLOG](BACKLOG.md), mais os critérios `CT` que só se confirmam
no emulador, para as 25 fichas, na ordem do backlog. Quando o critério da ficha é `UT`, `CT` ou
`REV`, o caso é a confirmação **na tela real**; ele não substitui o teste automatizado.

### 2.1 Bloco A — Base, senha e pendências

#### API-04 e API-05 — Contrato, tipos e mocks

| ID       | P   | Passos                                                                                                                                     | Resultado esperado                                                                                                                                     | Resultado |
| -------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| API-04.1 | P2  | Antes da rodada, liste as rotas exercitadas nos casos desta seção e confira cada uma no `docs/PROJECT.md` (Parte II) e no Swagger          | Toda rota usada está no PROJECT.md com corpo, resposta e erros; as diferenças em relação à especificação estão no BACKEND-ENTREGUE (AC-API-04-01 e 02) |           |
| API-05.1 | P2  | Com `EXPO_PUBLIC_USE_MOCKS=true`, abra uma tela de cada domínio (Evolução, Avaliações, Relatórios, sino); depois repita com o backend real | Mesma estrutura de campos nos dois modos; nenhum campo do mock some ou sobra no real. Divergência vira correção do mock                                |           |
| API-05.2 | P2  | Provoque, no backend real, um erro de cada domínio novo (por exemplo, código de recuperação errado e período vazio de relatório)           | A mensagem aparece em português e sem o código técnico (AC-API-05-03)                                                                                  |           |

#### FEC-05 — Pendências da Entrega 3

| ID       | P   | Passos                                                                                                                                                                                                                                                                              | Resultado esperado                                                                                                                                                                          | Resultado |
| -------- | --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| FEC-05.1 | P1  | Início → iniciar sessão (ou Agenda → "Iniciar sessão") até a **escolha do paciente**. Compare o avatar do Paciente Teste Um (com foto) com o da lista de Pacientes                                                                                                                  | O Paciente Teste Um aparece **com a foto**, igual à lista; o Paciente Teste Três (sem foto) mostra as iniciais (E-09, AC-FEC-05-01)                                                         |           |
| FEC-05.2 | P1  | Crie dois atendimentos hoje para o Paciente A, um terminando em poucos minutos e o seguinte logo depois. Abra a **Início** e a **Agenda** e **não feche o app**: espere passar o fim do primeiro (ou avance o relógio do emulador)                                                  | O "Próximo atendimento" da Início e o "Atendimento atual" da Agenda passam ao seguinte em até um minuto, **sem reabrir a tela**; ao sair e voltar à tela, também atualizam (AC-FEC-05-02)   |           |
| FEC-05.3 | P1  | Com o log do Metro limpo (`pnpm start --clear`), abra o app, entre e percorra Início, Agenda (inclusive o seletor de data e de hora), Pacientes, Recursos e a sessão                                                                                                                | O log **não mostra** os avisos de API obsoleta de `SafeAreaView` nem de `DateTimePicker` (E-11, AC-FEC-05-03, `MAN`). Outro aviso novo é anotado, não aprovado                              |           |
| FEC-05.4 | P1  | No Android, abra cada tela que trocou o `SafeAreaView`: `ActivityPlayScreen` (jogar a atividade), `StudentReportsScreen` (relatório do aluno), `FinishSessionScreen` (finalizar), `StudentStep` (escolha do paciente) e `ContentStep` (escolha do caderno). Confira o topo e a base | O conteúdo **não passa por baixo** da barra de status, do recorte da câmera nem da barra de navegação; botões da base ficam tocáveis. Teste com a navegação por gestos e com os três botões |           |
| FEC-05.5 | P3  | Agenda com atendimentos cancelados: compare o número do cabeçalho com os cartões                                                                                                                                                                                                    | Mantém a contagem atual, **sem os cancelados** (E-10 decidida); nada mudou                                                                                                                  |           |

#### AUT-01 — Recuperação de senha com código

| ID       | P   | Passos                                                                                                                                              | Resultado esperado                                                                                                                                                        | Resultado |
| -------- | --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AUT-01.1 | P1  | Login → "Esqueci a senha". Informe o e-mail da conta de teste e envie                                                                               | Passa ao passo do **código de 6 dígitos**; a mensagem do envio é a mesma do caso AUT-01.2 (SN-02)                                                                         |           |
| AUT-01.2 | P1  | Repita o envio com um e-mail que não existe                                                                                                         | **A mesma mensagem e o mesmo avanço** do caso anterior; nada revela se a conta existe                                                                                     |           |
| AUT-01.3 | P1  | Digite o código recebido por e-mail e confirme                                                                                                      | Badge **"Código verificado"** e o passo da nova senha. A nova senha **não pode ser enviada antes** do código verificado (AC-AUT-01-01)                                    |           |
| AUT-01.4 | P1  | Digite um código errado; depois deixe vencer; depois erre várias vezes seguidas                                                                     | Mensagem própria para cada erro: código inválido, vencido e muitas tentativas (AC-AUT-01-02)                                                                              |           |
| AUT-01.5 | P2  | Peça "Reenviar código" e observe o botão                                                                                                            | O botão fica **desabilitado por 60 s** com a contagem e volta depois (AC-AUT-01-03)                                                                                       |           |
| AUT-01.6 | P1  | No passo final, informe a confirmação diferente da nova senha; depois a senha igual à **anterior**; depois uma senha válida com a confirmação igual | Confirmação diferente impede o envio; senha igual à anterior mostra a mensagem do erro; a válida **volta ao login** com o aviso "Senha alterada. Entre com a nova senha." |           |
| AUT-01.7 | P1  | Entre com a **nova** senha e, em seguida, tente com a antiga                                                                                        | A nova entra; a antiga é recusada (veja BE-SN-03 para o token antigo)                                                                                                     |           |
| AUT-01.8 | P2  | Durante o fluxo, confira o log do Metro e feche e reabra o app no passo do código                                                                   | Nenhuma senha nem código no log (AC-AUT-01-04); ao reabrir, o fluxo **recomeça** pelo e-mail, sem guardar o código                                                        |           |

#### REC-03 — Trocar senha no perfil

| ID       | P   | Passos                                                                  | Resultado esperado                                                                                  | Resultado |
| -------- | --- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------- |
| REC-03.1 | P1  | Perfil → "Trocar senha". Confira os campos e o botão de mostrar/ocultar | Senha atual, nova e confirmação (6 a 100 caracteres), cada uma com mostrar/ocultar                  |           |
| REC-03.2 | P1  | Preencha com a senha atual **errada**                                   | O campo da senha atual é marcado com a mensagem do `INVALID_CURRENT_PASSWORD` (AC-REC-03-02)        |           |
| REC-03.3 | P1  | Preencha a confirmação diferente da nova                                | O envio é impedido, com mensagem no campo da confirmação (AC-REC-03-03)                             |           |
| REC-03.4 | P1  | Preencha tudo certo e envie; depois navegue por Início e Pacientes      | Confirmação de sucesso e o app **continua logado**: o token novo foi guardado (SN-08, AC-REC-03-01) |           |
| REC-03.5 | P2  | Teste senha nova com 5 e com 101 caracteres                             | Recusada no formulário, com a regra de 6 a 100 caracteres                                           |           |

### 2.2 Bloco B — Evolução da sessão

O reteste do fluxo de sessão inteiro está na §3.1.

#### EVO-01 — Evolução da sessão

| ID       | P   | Passos                                                                                                                                                                                         | Resultado esperado                                                                                                                                                                   | Resultado |
| -------- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| EVO-01.1 | P1  | Finalize uma sessão do Paciente A (com PE). Observe a tela seguinte                                                                                                                            | Abre a **Evolução** (não a observação): paciente e data, "PE · {tema}" com duração e número de critérios, e os **critérios sugeridos** do servidor (G-56, G-57, AC-EVO-01-01)        |           |
| EVO-01.2 | P1  | Finalize uma sessão do Paciente B (sem plano)                                                                                                                                                  | Aviso de que não há PE, com o atalho **"Criar PE"** (leva à criação de plano com o paciente e a data); só o registro descritivo. **Não** usa o PDI como reserva (G-57)               |           |
| EVO-01.3 | P1  | Em cada critério, marque Atingido, Parcial, Não atingido e Não observado; preencha tentativas e acertos ("8 de 10 tentativas") e uma nota curta. Remova um critério sugerido e inclua um livre | Cada escolha fica registrada na tela; o critério removido sai; o livre entra                                                                                                         |           |
| EVO-01.4 | P1  | Digite acertos **maiores** que as tentativas                                                                                                                                                   | O envio é bloqueado antes da chamada, com mensagem (AC-EVO-01-03)                                                                                                                    |           |
| EVO-01.5 | P2  | Em "Atualizar prontuário", escolha mudar o estado de uma meta ligada a um critério                                                                                                             | O estado novo da meta fica na tela e vai como `goalUpdates` (conferir no detalhe do plano depois de salvar, BE-EV-03)                                                                |           |
| EVO-01.6 | P1  | Toque em "Salvar e atualizar prontuário" e observe o botão durante o envio                                                                                                                     | O botão fica **desabilitado** e há **uma única** chamada `POST /session-evolution/`; depois, o painel "Evolução registrada" com "Ver prontuário" e "Voltar ao início" (AC-EVO-01-02) |           |
| EVO-01.7 | P1  | Altere algo e tente sair pelo botão da tela; repita com o Voltar do Android                                                                                                                    | Pede **confirmação** nas duas saídas; "Continuar editando" mantém tudo (AC-EVO-01-04)                                                                                                |           |
| EVO-01.8 | P1  | Com a Evolução aberta, feche o app (deslizar para fora) e reabra                                                                                                                               | Volta para a **Evolução da mesma sessão** (AC-EVO-01-05). Veja também SES-R.9                                                                                                        |           |
| EVO-01.9 | P1  | Com a Evolução já salva de uma sessão, abra de novo o fluxo dela (atalho da EVO-05 ou histórico)                                                                                               | `EVOLUTION_ALREADY_EXISTS` leva ao **registro existente**, sem duplicar (AC-EVO-01-06; BE-EV-01)                                                                                     |           |

#### EVO-02 — Prontuário e hub de evolução

| ID       | P   | Passos                                                                                                                                  | Resultado esperado                                                                                                                                                          | Resultado |
| -------- | --- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| EVO-02.1 | P1  | Ficha do Paciente A → "Ver prontuário"                                                                                                  | Histórico cronológico, **mais recente primeiro**: data, plano, "N de M critérios atingidos" e trecho do registro. A evolução recém-salva está no topo (AC-EVO-02-01)        |           |
| EVO-02.2 | P1  | Ficha do Paciente A, seção "Evolução recente"                                                                                           | Mostra as **duas últimas** evoluções, com "Ver prontuário"; o acerto das sessões continua na aba de relatórios do aluno                                                     |           |
| EVO-02.3 | P2  | Ficha do Paciente C (sem evolução)                                                                                                      | Estado vazio claro no prontuário e na seção da ficha, sem erro                                                                                                              |           |
| EVO-02.4 | P1  | Abra o detalhe de uma evolução; toque em "Editar", altere um critério e salve                                                           | O detalhe mostra critérios, registro, sugestão e metas atualizadas; a edição reabre o formulário **preenchido**, envia a lista completa e reflete no detalhe (AC-EVO-02-02) |           |
| EVO-02.5 | P1  | Recursos → "Evolução da sessão": veja "Sessões sem evolução" e "Evoluções recentes"; registre a evolução de uma sessão pendente e volte | O hub lista **todos os pacientes**; a sessão registrada **some** de "Sessões sem evolução" e entra em "Evoluções recentes" (AC-EVO-02-03)                                   |           |

#### EVO-04 — Sugestão para a próxima sessão (IA)

| ID       | P   | Passos                                                                  | Resultado esperado                                                                                                                                               | Resultado |
| -------- | --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| EVO-04.1 | P2  | Na Evolução, bloco "Sugestão para a próxima sessão" → "Gerar sugestão"  | Carregamento visível (até 90 s) e depois o texto num **campo editável**; sem diagnóstico. Em erro, "Tentar novamente", **sem reenvio automático** (AC-EVO-04-01) |           |
| EVO-04.2 | P2  | Edite o texto gerado e salve a evolução; reabra o detalhe               | O texto **editado** é o salvo em `nextSessionSuggestion` (AC-EVO-04-02)                                                                                          |           |
| EVO-04.3 | P2  | Monte a próxima sessão do Paciente A (escolha do paciente e do caderno) | A sugestão da **última evolução** aparece na montagem (AC-EVO-04-03)                                                                                             |           |

#### EVO-05 — Entradas para registrar a evolução

| ID       | P   | Passos                                                                                                     | Resultado esperado                                                                              | Resultado |
| -------- | --- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------- |
| EVO-05.1 | P1  | Agenda → detalhe de um atendimento `COMPLETED` cuja sessão **não** tem evolução                            | Mostra "Registrar evolução"; ao tocar, abre a Evolução **da sessão certa** (AC-EVO-05-01)       |           |
| EVO-05.2 | P1  | Início, agenda de hoje: atendimento concluído sem evolução                                                 | O atalho aparece e abre a Evolução da sessão certa                                              |           |
| EVO-05.3 | P1  | Ficha do paciente com sessão pendente                                                                      | O atalho aparece e abre a Evolução da sessão certa                                              |           |
| EVO-05.4 | P1  | Os três lugares acima, depois de salvar a evolução; e um atendimento não finalizado (Pendente, Confirmado) | O atalho **some** depois de registrada e **não aparece** para atendimento sem sessão finalizada |           |

### 2.3 Bloco C — Avaliações e escalas

#### AVA-01 — Hub de avaliações

| ID       | P   | Passos                                                                                                           | Resultado esperado                                                                                                                                                 | Resultado |
| -------- | --- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| AVA-01.1 | P1  | Recursos → "Avaliações e escalas"                                                                                | "Nova aplicação" com "Escolher escala"; "Modelos disponíveis" (número de itens e tempo, "Aplicar escala") e "Aplicações recentes", todos **da API** (AC-AVA-01-01) |           |
| AVA-01.2 | P1  | Em "Aplicações recentes", compare a cor e o texto do `badge` de cada faixa com as faixas de severidade da escala | A cor segue a **severidade** e o texto é o **rótulo do servidor**, sem o app reescrever (AC-AVA-01-02)                                                             |           |
| AVA-01.3 | P1  | Deixe uma aplicação em rascunho e volte ao hub                                                                   | O rascunho aparece com **"Continuar"** (AC-AVA-01-03)                                                                                                              |           |
| AVA-01.4 | P3  | Conta sem aplicações                                                                                             | Estado vazio claro em "Aplicações recentes"                                                                                                                        |           |

#### AVA-02 — Aplicar escala

| ID       | P   | Passos                                                                         | Resultado esperado                                                                                                                                                                                   | Resultado |
| -------- | --- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AVA-02.1 | P1  | "Aplicar escala" a partir da ficha do Paciente A; responda a primeira pergunta | Vem com o paciente; uma pergunta por vez, com as **opções na ordem do servidor** (Nunca, Às vezes, Frequentemente, Muito); o progresso "N de M" avança a cada resposta **salva** (AC-AVA-02-01 e 02) |           |
| AVA-02.2 | P1  | Avance, volte e mude uma resposta já dada                                      | A resposta nova substitui a antiga e o escore parcial acompanha                                                                                                                                      |           |
| AVA-02.3 | P1  | Entre pelo hub (sem paciente) e toque em "Aplicar escala"                      | Pede para **escolher o paciente antes de começar** (AC-AVA-02-03)                                                                                                                                    |           |
| AVA-02.4 | P1  | Com o Paciente A já com rascunho da mesma escala, comece outra aplicação       | `DRAFT_ALREADY_EXISTS` **retoma o rascunho existente**, sem criar outro                                                                                                                              |           |
| AVA-02.5 | P1  | Desligue a rede (modo avião) e responda uma pergunta                           | A resposta falha, o app **não avança** e oferece **"Tentar novamente"**; religada a rede, funciona (AC-AVA-02-04)                                                                                    |           |

#### AVA-03 — Escore, insight e conclusão

| ID       | P   | Passos                                                                                                          | Resultado esperado                                                                                                                                           | Resultado |
| -------- | --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| AVA-03.1 | P1  | Responda metade da escala e observe a "Pontuação parcial"                                                       | Mostra N/M, o escore e a faixa marcada **"parcial"** (G-60); os números são os do servidor, não calculados no app (AC-AVA-03-01)                             |           |
| AVA-03.2 | P1  | Em qualquer ponto da aplicação, procure o aviso clínico                                                         | O **aviso clínico aparece sempre**, no parcial e no resultado (AC-AVA-03-02)                                                                                 |           |
| AVA-03.3 | P1  | Com itens faltando, observe "Concluir escala"                                                                   | Só habilita com **todos** os itens respondidos; se o servidor devolver `SCALE_INCOMPLETE`, a tela leva ao **primeiro item faltante** (AC-AVA-03-03)          |           |
| AVA-03.4 | P1  | Conclua a escala completa                                                                                       | A edição fica **travada** e abre o resultado (AVA-04) com a faixa definitiva, sem "parcial"                                                                  |           |
| AVA-03.5 | P2  | "Gerar insight" (insight preliminar); depois, force um erro (por exemplo, sem rede)                             | Carregamento, texto em português sem diagnóstico, ou erro com "Tentar novamente" e **sem reenvio automático**; **falhar não impede concluir** (AC-AVA-03-04) |           |
| AVA-03.6 | P1  | Em duas aplicações, responda **tudo no mínimo** e **tudo no máximo**; compare o resultado com a tabela da fonte | Escore e faixa **batem com a fonte** nos dois extremos (BE-AV-05 vista pela tela)                                                                            |           |

#### AVA-04 — Resultado da aplicação

| ID       | P   | Passos                                                     | Resultado esperado                                                                                                               | Resultado |
| -------- | --- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AVA-04.1 | P1  | Abra o resultado de uma aplicação concluída (hub ou ficha) | Escore total e **por subescala**, faixa, insight, data, aviso clínico e as respostas **item a item**, recolhíveis (AC-AVA-04-01) |           |
| AVA-04.2 | P2  | Abra o resultado de uma aplicação sem insight              | Aparece "Gerar insight"; ao gerar, o texto entra e o botão some                                                                  |           |

#### AVA-05 — Rascunhos

| ID       | P   | Passos                                                                       | Resultado esperado                                                                               | Resultado |
| -------- | --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------- |
| AVA-05.1 | P1  | Responda 3 perguntas e toque em "Salvar rascunho"; depois "Continuar" no hub | Sai com as respostas salvas; reabrir **retoma na primeira pergunta sem resposta** (AC-AVA-05-01) |           |
| AVA-05.2 | P1  | "Descartar rascunho" e cancele; repita e confirme                            | Pede **confirmação**; cancelar não remove; confirmar **remove da lista** (AC-AVA-05-02)          |           |

#### PAC-05 — Ficha: Avaliações

| ID       | P   | Passos                                                     | Resultado esperado                                                                                                                        | Resultado |
| -------- | --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| PAC-05.1 | P1  | Ficha do Paciente A → aba **Avaliações**                   | Lista as aplicações (escala, faixa, data) e o card "Anamnese" do paciente (AC-PAC-05-01)                                                  |           |
| PAC-05.2 | P1  | Toque em "Ver resultado", "Ver síntese" e "Nova avaliação" | "Ver resultado" abre a AVA-04; "Ver síntese" abre a PAC-09; "Nova avaliação" abre a AVA-02 **com o paciente já escolhido** (AC-PAC-05-02) |           |
| PAC-05.3 | P3  | Ficha do Paciente C                                        | Aba sem aplicações e sem anamnese: estado vazio e "Nova avaliação" disponível                                                             |           |

#### PAC-09 — Síntese da anamnese (IA)

| ID       | P   | Passos                                                                  | Resultado esperado                                                                                               | Resultado |
| -------- | --- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------- |
| PAC-09.1 | P2  | Anamnese sem síntese → "Ver síntese"                                    | Mostra **"Gerar síntese"**; ao gerar, o texto e a data aparecem e o botão passa a "Gerar de novo" (AC-PAC-09-01) |           |
| PAC-09.2 | P2  | Edite a resposta da anamnese depois da síntese e abra a síntese de novo | Aparece o aviso **"A anamnese mudou depois desta síntese"** (`summaryOutdated`, AC-PAC-09-02)                    |           |
| PAC-09.3 | P2  | Gere a síntese sem rede                                                 | Erro com "Tentar novamente", sem reenvio automático                                                              |           |

### 2.4 Bloco D — Relatórios

#### REL-01 — Configurar relatório

| ID       | P   | Passos                                                                                      | Resultado esperado                                                                                                                             | Resultado |
| -------- | --- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| REL-01.1 | P1  | Recursos → "Relatórios"                                                                     | Aviso "Relatórios seguros por padrão"; Paciente, Tipo, Período e "Incluir no documento" com **tipos, seções e períodos da API** (AC-REL-01-01) |           |
| REL-01.2 | P1  | Troque o tipo de relatório e observe as seções                                              | As seções **permitidas mudam com o tipo** (AC-REL-01-02)                                                                                       |           |
| REL-01.3 | P1  | Escolha audiência família e depois escola; veja as seções sensíveis                         | Vêm **desmarcadas**; marcar uma mostra o **aviso** (RP-01)                                                                                     |           |
| REL-01.4 | P1  | Gere com um período **sem sessões**; depois tente uma seção não permitida, se a tela deixar | `REPORT_EMPTY_PERIOD` e `SECTION_NOT_ALLOWED` mostram mensagem em português (AC-REL-01-03)                                                     |           |
| REL-01.5 | P2  | Gere um relatório com síntese e observe o carregamento; depois falhe a geração (sem rede)   | Carregamento visível (até 90 s); no erro, mensagem e botão de tentar de novo, **sem reenvio automático**                                       |           |

#### REL-02 — Prévia, PDF e envio

| ID       | P   | Passos                                                                                                              | Resultado esperado                                                                                                                                                         | Resultado |
| -------- | --- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| REL-02.1 | P1  | Gere o relatório do Paciente A e veja a prévia                                                                      | "Relatório pronto", "PDF · N páginas" e o papel de prévia com **só as seções escolhidas**; **sem telefone, endereço, documento nem dado do responsável** (AC-REL-02-01)    |           |
| REL-02.2 | P1  | Toque em "Imprimir"; depois em "Enviar" e escolha um aplicativo de destino                                          | O PDF **imprime** (diálogo de impressão) e é **compartilhado** no Expo Go no Android (AC-REL-02-02, `MAN`); cada impressão e envio é registrado (`POST /report/:id/share`) |           |
| REL-02.3 | P2  | Depois do compartilhamento, confira o armazenamento temporário do app (se acessível) ou repita o envio várias vezes | Nenhum PDF temporário fica acumulado (AC-REL-02-03); o app não trava                                                                                                       |           |
| REL-02.4 | P2  | Gere um relatório quando a IA falhar (por exemplo, sem síntese)                                                     | Mostra o relatório **sem a síntese**, com aviso (`synthesisFailed`)                                                                                                        |           |
| REL-02.5 | P1  | Confira o log do Metro durante a geração, a impressão e o envio                                                     | **Nenhum dado do relatório** no log (AC-REL-02-04)                                                                                                                         |           |

#### REL-03 — Histórico de relatórios

| ID       | P   | Passos                                                                              | Resultado esperado                                                                                         | Resultado |
| -------- | --- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------- |
| REL-03.1 | P1  | Relatórios → histórico (geral e por paciente)                                       | Lista com tipo, período, data e **último envio**; cada item tem reabrir, reenviar e excluir (AC-REL-03-01) |           |
| REL-03.2 | P1  | Edite uma evolução usada num relatório já gerado; reabra o relatório pelo histórico | Mostra **o mesmo conteúdo da geração**, sem refletir a edição (RP-03, AC-REL-03-02)                        |           |
| REL-03.3 | P1  | Reenvie um relatório do histórico                                                   | O PDF do mesmo conteúdo é gerado e compartilhado; o "último envio" atualiza                                |           |
| REL-03.4 | P1  | Exclua um relatório: cancele, depois confirme                                       | Pede confirmação; confirmar remove da lista e do histórico geral                                           |           |
| REL-03.5 | P3  | Paciente C (sem relatórios)                                                         | Estado vazio claro                                                                                         |           |

### 2.5 Bloco E — Notificações e navegação

#### NOT-01 — Notificações no app

| ID       | P   | Passos                                                                                       | Resultado esperado                                                                                                                          | Resultado |
| -------- | --- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| NOT-01.1 | P1  | Com notificações não lidas, abra o app e volte ao foco vindo de outra tela                   | O sino mostra o **contador**, atualizado ao abrir e ao voltar ao foco. Com o TalkBack, o rótulo é "N notificações não lidas" (AC-NOT-01-01) |           |
| NOT-01.2 | P1  | Abra a lista: confira a ordem, o destaque das não lidas e role até carregar a próxima página | Lista paginada, não lidas em destaque                                                                                                       |           |
| NOT-01.3 | P1  | Toque numa notificação de evolução pendente e noutra de plano                                | Marca como **lida** e navega ao destino certo; o contador cai em um (AC-NOT-01-02)                                                          |           |
| NOT-01.4 | P2  | Toque numa notificação cujo destino foi apagado (exclua o plano antes)                       | Mostra **"não está mais disponível"**, sem travar nem tela em branco                                                                        |           |
| NOT-01.5 | P1  | "Marcar todas como lidas"                                                                    | O contador **zera** e o destaque some (AC-NOT-01-03)                                                                                        |           |
| NOT-01.6 | P1  | Com o app em segundo plano, espere ou provoque uma notificação nova                          | **Nenhum push** chega (G-59); a notificação só aparece no sino ao abrir o app                                                               |           |

#### NAV-04 — Recursos e atalhos para os domínios novos

| ID       | P   | Passos                                                                                                         | Resultado esperado                                                                                                     | Resultado |
| -------- | --- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| NAV-04.1 | P1  | Em Recursos, toque em "Evolução da sessão", "Avaliações e escalas" e "Relatórios"; na Início, "Aplicar escala" | Cada um abre o hub certo (EVO-02, AVA-01, REL-01 com acesso ao histórico); **nenhum** leva a "Em breve" (AC-NAV-04-01) |           |
| NAV-04.2 | P2  | Em Recursos, confira Equipe e Central de ajuda                                                                 | Continuam em **"Em breve"**                                                                                            |           |
| NAV-04.3 | P2  | Percorra as abas e o botão Voltar de cada destino acima                                                        | Nenhuma rota órfã nem tela antiga de relatórios da V1 aberta por engano (AC-NAV-04-02); o relatório da sessão continua |           |

### 2.6 Bloco F — Qualidade

| ID      | P   | Passos                                                                                                                                                                                           | Resultado esperado                                                                                                                | Resultado |
| ------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------- |
| QA-07.1 | P1  | Fechada a rodada, some os casos P1 das seções 2 a 5                                                                                                                                              | **Todos os P1 passam** no Android (emulador, backend real, mocks desligados); falhas viram tarefas com o ID do caso (AC-QA-07-01) |           |
| QA-02.1 | P2  | Rode os cinco fluxos Maestro: login → Início → iniciar sessão → salvar evolução; novo paciente → gerar PDI → salvar; aplicar escala → concluir; gerar relatório → compartilhar; novo atendimento | Os cinco passam no AVD Android, só com "Paciente Teste …" (AC-QA-02-01, `E2E`). Sem Maestro instalado, **N/A com o motivo**       |           |
| QA-03.1 | P2  | Percorra o checklist de acessibilidade das telas das Entregas 3 e 4 (TalkBack, fonte grande, contraste, alvos de 44), pelo roteiro da Entrega 3 ampliado                                         | O checklist fica **sem bloqueio** (AC-QA-03-01)                                                                                   |           |
| QA-04.1 | P3  | Registre a matriz tela × plataforma × aparelho (Android físico e iOS) pelo roteiro da Entrega 3                                                                                                  | A matriz fica registrada (AC-QA-04-01). Sem aparelho, **N/A com o motivo**; nunca aprovado sem evidência                          |           |

## 3. Fluxos entre telas

Cada fluxo segue **um conjunto de dados do começo ao fim**, conferindo o ponto de verificação
entre as telas (a consulta que precisa ser atualizada).

### 3.1 Reteste do fluxo de sessão inteiro (muda com a EVO-01)

A observação deixa de ser o último passo: o passo `awaitingObservation` agora significa
**aguardando evolução** (G-56). Todos os casos usam o Paciente A, com PE, e um caderno de 2 ou 3
atividades, salvo indicação.

| ID       | P   | Passos                                                                                                             | Resultado esperado                                                                                                                                                              | Resultado |
| -------- | --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| SES-R.1  | P1  | **Pela Agenda:** atendimento Pendente de hoje → "Iniciar sessão"                                                   | A sessão nasce ligada ao atendimento, com o paciente já escolhido; a escolha do caderno mostra só os cadernos **da conta**; a sugestão da última evolução aparece (EVO-04)      |           |
| SES-R.2  | P1  | **Pela Início:** "Próximo atendimento" → iniciar                                                                   | Mesmo resultado de SES-R.1, para o mesmo atendimento                                                                                                                            |           |
| SES-R.3  | P1  | **Pela ficha:** Paciente A → iniciar sessão                                                                        | Pergunta pelo caderno; usa o atendimento de hoje se existir; senão, sessão avulsa pela data                                                                                     |           |
| SES-R.4  | P1  | **Pelo botão de sessão (sem paciente):** escolha do paciente                                                       | A lista mostra a **foto** do Paciente A (FEC-05.1) e respeita a área segura (FEC-05.4)                                                                                          |           |
| SES-R.5  | P1  | Jogue as atividades do caderno do começo ao fim, avançando e voltando uma                                          | O progresso e o cronômetro funcionam; a tela de atividade respeita a área segura                                                                                                |           |
| SES-R.6  | P1  | Finalize a sessão (tela de finalizar)                                                                              | Vai para a **Evolução** (EVO-01.1), **sem** a tela de observação; o botão de finalizar não envia duas vezes                                                                     |           |
| SES-R.7  | P1  | Na Evolução, preencha o registro e salve                                                                           | O registro descritivo vira a observação da sessão (EV-08): confira no relatório da sessão que o texto aparece; o atendimento fica **Concluído**                                 |           |
| SES-R.8  | P1  | Em "Evolução registrada", toque em "Voltar ao início"; depois repita a sessão e use "Ver prontuário"               | Os dois botões levam ao destino certo; Início e Agenda **não** mostram mais "Registrar evolução" para essa sessão                                                               |           |
| SES-R.9  | P1  | **Retomada:** feche o app (a) durante a atividade, (b) na tela de finalizar e (c) na Evolução; reabra em cada caso | (a) volta à sessão no ponto em que estava; (b) volta a finalizar; (c) volta à **Evolução da mesma sessão**; o que não foi salvo na Evolução pode se perder, o que foi salvo não |           |
| SES-R.10 | P1  | Na Evolução, saia sem salvar (confirmando a saída)                                                                 | Pede confirmação; ao confirmar, a sessão fica **sem evolução** e aparece em "Sessões sem evolução" (EVO-02.5)                                                                   |           |
| SES-R.11 | P2  | Inicie uma sessão para o Paciente B (sem plano) e finalize                                                         | Evolução com o aviso "Criar PE" e só o registro; salvar funciona (EVO-01.2)                                                                                                     |           |
| SES-R.12 | P2  | Tente iniciar a sessão de um paciente que já tem sessão aberta                                                     | Mantém o comportamento da Entrega 3 (retomada ou aviso), sem criar sessão duplicada                                                                                             |           |

### 3.2 Demais fluxos

| ID  | P   | Fluxo e passos                                                                                                                                                                     | Ponto de verificação entre telas                                                                                                                                          | Resultado |
| --- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| F1  | P1  | **Sessão → evolução → prontuário.** Finalize uma sessão do Paciente A, salve a evolução, "Ver prontuário", abra o detalhe, "Editar" e salve; volte à ficha e ao hub de Recursos    | A evolução entra no topo do prontuário e da ficha (duas últimas); some de "Sessões sem evolução"; a edição aparece no detalhe; as metas do plano refletem o `goalUpdates` |           |
| F2  | P1  | **Ficha → escala → resultado.** Ficha do Paciente A → aba Avaliações → "Nova avaliação" → responda tudo → "Concluir escala" → resultado → volte à ficha e ao hub                   | O paciente vem escolhido; a aplicação concluída aparece na aba da ficha e em "Aplicações recentes" com a faixa; o rascunho antigo some                                    |           |
| F3  | P1  | **Relatório → PDF → envio.** Recursos → Relatórios → configure para o Paciente A (período com evoluções) → gerar → prévia → "Imprimir" e "Enviar" → histórico → reenviar           | O relatório aparece no histórico com o último envio atualizado; cada impressão e envio é registrado; PDF só com as seções escolhidas e sem dado de contato                |           |
| F4  | P1  | **Sino → destino.** Com uma notificação de evolução pendente, abra o app → sino → toque na notificação → registre a evolução → volte ao sino                                       | O contador cai ao tocar; o destino é a Evolução da sessão certa; depois de registrada, a notificação não volta; sem push em momento algum                                 |           |
| F5  | P1  | **Esqueci a senha → login.** Login → "Esqueci a senha" → e-mail → código → nova senha → login com a nova senha (o orquestrador restaura a senha original da conta de teste depois) | Volta ao login com o aviso de sucesso; entra com a nova e recusa a antiga; a Início carrega normalmente                                                                   |           |
| F6  | P1  | **Trocar senha no perfil → novo login.** Perfil → "Trocar senha" → senha atual, nova e confirmação → sucesso → navegue → "Sair" → login com a nova senha                           | Continua logado depois da troca (token novo, SN-08); o token antigo deixa de valer (BE-SN-03); o login pede a senha nova                                                  |           |

## 4. Registro formal da FEC-01 (herdado da Entrega 3)

A FEC-01 foi coberta na prática pelas rodadas no emulador da Entrega 3 (ver
[TRACKING §3](TRACKING.md#3-herdado-da-entrega-3)); o registro formal entra aqui. Para cada rota,
anote a **data, a tela, o resultado (OK ou divergência) e a captura**, e copie o resultado para a
seção "Entrega 4" do QA-05-RELATORIO. Os passos de cada caso estão em
[05-fec01-rotas-v1](../entrega-3/testes/05-fec01-rotas-v1.md).

| ID       | P   | Rota                                                             | Tela que a dispara                              | Data | Resultado |
| -------- | --- | ---------------------------------------------------------------- | ----------------------------------------------- | ---- | --------- |
| FEC-01.1 | P1  | `PUT /task-notebook/update`                                      | Editar caderno                                  |      |           |
| FEC-01.2 | P1  | `DELETE /task-notebook/delete/:id`                               | Detalhe do caderno ("Excluir Caderno")          |      |           |
| FEC-01.3 | P1  | `POST /task-group/create` e `GET /task-group/list-by-educator`   | Novo grupo e filtro "Grupos"                    |      |           |
| FEC-01.4 | P1  | `PUT /task-group/update`                                         | Editar grupo                                    |      |           |
| FEC-01.5 | P1  | `DELETE /task-group/delete/:id`                                  | Detalhe do grupo ("Excluir Grupo")              |      |           |
| FEC-01.6 | P1  | `PUT /task/update`                                               | Editar atividade                                |      |           |
| FEC-01.7 | P1  | `DELETE /task/delete/:id`                                        | Detalhe da atividade ("Excluir Atividade")      |      |           |
| FEC-01.8 | P1  | `GET /task-notebook-session/analysis/student/:studentId/history` | Relatório do aluno ("Histórico de snapshots")   |      |           |
| FEC-01.9 | P3  | `GET /educator/get-last-sessions`                                | Nenhuma tela chama a rota; **N/A com o motivo** |      |           |

Nenhuma credencial nem dado pessoal no relatório (AC-FEC-01-02).

## 5. Conferências do backend

Verificações do contrato contra o backend real, observáveis **pelo app** (rede do Metro) ou
pelo **Swagger** (`/api-docs/`), a partir dos critérios de aceite da
[Especificação para o backend](ESPECIFICACAO-BACKEND.md). Anote método, caminho e status HTTP;
não copie corpo de resposta. Caso cuja leva do backend ainda não foi publicada fica **BLOQ**,
com a leva citada.

### 5.1 BE-SN — Senha (§2.3)

| ID       | P   | Como verificar                                                                                                              | Resultado esperado                                                                                                     | Resultado |
| -------- | --- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| BE-SN-01 | P1  | No Swagger, `update-password` sem `token`; depois com token errado; depois com um código vencido (espere o prazo, AUT-01.4) | Sem `token`, **400**; errado, `INVALID_TOKEN`; vencido, `EXPIRED_TOKEN`. No app, as mensagens do AUT-01.4 correspondem |           |
| BE-SN-02 | P1  | Pelo app (AUT-01.1 e 01.2), compare o status do `generate-token` para um e-mail existente e para um inexistente             | **O mesmo 200** nos dois casos, sem diferença que revele a conta                                                       |           |
| BE-SN-03 | P1  | Guarde o token da sessão antes da troca e troque a senha (F5 ou F6); chame `GET /educator/me` com o token antigo            | O token antigo recebe **401**; o token novo, 200                                                                       |           |
| BE-SN-04 | P1  | Pelo app (REC-03.2) ou Swagger, `change-password` com a senha atual errada                                                  | `INVALID_CURRENT_PASSWORD`; senha não alterada                                                                         |           |

### 5.2 BE-EV — Evolução (§3.7)

| ID       | P   | Como verificar                                                                                                                                           | Resultado esperado                                                                                                                                                                                              | Resultado |
| -------- | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| BE-EV-01 | P1  | Salve a evolução de uma sessão finalizada (EVO-01.6); tente salvar de novo (EVO-01.9 ou Swagger)                                                         | A primeira grava; a segunda devolve **409 `EVOLUTION_ALREADY_EXISTS`**                                                                                                                                          |           |
| BE-EV-02 | P1  | No Swagger, `POST /session-evolution/` com o id de uma sessão **ainda aberta**                                                                           | **409 `SESSION_NOT_FINISHED`**                                                                                                                                                                                  |           |
| BE-EV-03 | P1  | Evolução com `goalUpdates` de uma meta para `ACHIEVED`; confira o progresso do plano na aba Planos. Depois encerre o plano e tente salvar outra evolução | O progresso do plano é **recalculado**; com o plano encerrado, a evolução inteira falha com **409 `PLAN_NOT_EDITABLE`**, sem gravar parte                                                                       |           |
| BE-EV-04 | P1  | Abra a Evolução de uma sessão com PE do atendimento (Paciente A) e de uma sessão sem plano (Paciente B)                                                  | Com PE, o `context` traz as metas do PE; sem plano, `plan` ausente e o aviso "Criar PE". Pela G-57, o app **não** usa o PDI como reserva, mesmo que o backend o traga; anote se o contexto trouxer metas do PDI |           |
| BE-EV-05 | P1  | Salve a evolução com um registro descritivo e abra o relatório da sessão (`report/:sessionId`)                                                           | A observação da sessão **mostra o registro descritivo salvo** (EV-08)                                                                                                                                           |           |
| BE-EV-06 | P2  | Com a conta secundária (ou o Swagger), leia e grave evolução de paciente de **outro educador**                                                           | **403** em leitura e em escrita                                                                                                                                                                                 |           |
| BE-EV-07 | P1  | Abra o hub (`pending`) com uma sessão finalizada recente e outra com mais de 30 dias; registre a evolução da recente                                     | Só entram as sessões finalizadas **sem evolução dos últimos 30 dias**; a registrada **some** da lista                                                                                                           |           |
| BE-EV-08 | P2  | "Gerar sugestão" (EVO-04.1) e confira a lista de evoluções                                                                                               | A sugestão responde em português, **sem diagnóstico**, e **não cria registro** de evolução                                                                                                                      |           |

### 5.3 BE-AV — Escalas (§4.7)

| ID       | P   | Como verificar                                                                                                                     | Resultado esperado                                                                                | Resultado |
| -------- | --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- |
| BE-AV-01 | P1  | Abra o hub (AVA-01.1) ou `GET /scale-template/` no Swagger                                                                         | Lista **ao menos uma escala**, com itens, opções, faixas, aviso e referência                      |           |
| BE-AV-02 | P1  | Inicie, responda metade e leia a aplicação (AVA-03.1)                                                                              | `score.partial = true` e `answered` igual ao número de respostas dadas                            |           |
| BE-AV-03 | P1  | Inicie duas vezes a mesma escala para o mesmo paciente (AVA-02.4)                                                                  | **409 `DRAFT_ALREADY_EXISTS`** com o id do rascunho                                               |           |
| BE-AV-04 | P1  | Conclua com item faltando (Swagger); depois conclua completa e tente alterar uma resposta                                          | `SCALE_INCOMPLETE` com os ids faltantes; completa, a aplicação fica **somente leitura**           |           |
| BE-AV-05 | P1  | Conclua três aplicações (respostas mínimas, máximas e uma intermediária) e compare escore e faixa com a tabela da fonte (AVA-03.6) | Escore e faixa **conferem com a fonte** nos três conjuntos                                        |           |
| BE-AV-06 | P3  | Depois de uma mudança de versão do catálogo (se houver), abra uma aplicação antiga                                                 | O escore da aplicação antiga **não muda**. Sem mudança de versão no período, **N/A com o motivo** |           |
| BE-AV-07 | P2  | Com a conta secundária (ou o Swagger), acesse aplicação de paciente de **outro educador**                                          | **403**                                                                                           |           |
| BE-AV-08 | P2  | Gere o insight (AVA-03.5)                                                                                                          | Texto em português, **sem afirmar diagnóstico**                                                   |           |

### 5.4 BE-RP — Relatórios (§6.5)

| ID       | P   | Como verificar                                                                   | Resultado esperado                                                                                               | Resultado |
| -------- | --- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------- |
| BE-RP-01 | P1  | Abra a configuração (REL-01.1) ou `GET /report/options` no Swagger               | Traz os **três tipos**, as seções com `sensitive` e os períodos                                                  |           |
| BE-RP-02 | P1  | Gere com uma seção fora do tipo (Swagger) e com período sem sessões (REL-01.4)   | `SECTION_NOT_ALLOWED` e `REPORT_EMPTY_PERIOD`                                                                    |           |
| BE-RP-03 | P1  | Gere um relatório para cada audiência e leia o conteúdo na prévia                | **Nenhum telefone, endereço, documento nem dado do responsável**, em nenhuma audiência                           |           |
| BE-RP-04 | P1  | Gere um relatório, edite uma evolução usada nele e reabra o relatório (REL-03.2) | O relatório já gerado **não muda** (RP-03)                                                                       |           |
| BE-RP-05 | P2  | Gere com a IA indisponível, se houver como forçar (REL-02.4)                     | O relatório é criado **sem síntese**, com `synthesisFailed: true`. Sem como forçar a falha, **N/A com o motivo** |           |
| BE-RP-06 | P2  | Com a conta secundária (ou o Swagger), leia relatório de **outro educador**      | **403**                                                                                                          |           |

### 5.5 BE-NT — Notificações (§7.5)

| ID       | P   | Como verificar                                                                                                 | Resultado esperado                                                                | Resultado |
| -------- | --- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------- |
| BE-NT-01 | P1  | Peça ao backend para rodar o cron duas vezes no mesmo dia; compare a lista e o contador no sino antes e depois | **Nenhuma notificação duplicada**. Sem como disparar o cron, **N/A com o motivo** |           |
| BE-NT-02 | P1  | Com uma sessão finalizada há 25 h sem evolução e outra com evolução, deixe o cron rodar e abra o sino          | Só a sem evolução gera **`EVOLUTION_PENDING`**                                    |           |
| BE-NT-03 | P1  | Leia o contador, toque numa notificação (NOT-01.3) e confira de novo; depois "Marcar todas como lidas"         | `read` **diminui** o `unread-count` em um; `read-all` **zera**                    |           |

## 6. Como usar este plano

- Execute na ordem: seção 2 (por tarefa), seção 3 (fluxos), seção 4 (FEC-01) e seção 5
  (backend). Os casos de IA (EVO-04, AVA-03.5, PAC-09, REL-01.5 e REL-02.4) vão por último, para
  não esgotar a cota do backend antes dos P1.
- Em cada falha, separe erro do app de erro do backend (conferir a resposta na rede e repetir o
  cenário com `EXPO_PUBLIC_USE_MOCKS=true`) e abra a correção com o ID do caso.
- Antes de abrir uma correção, rode os testes automatizados da tarefa com
  `pnpm exec vitest run <arquivo> --maxWorkers=1`.
- Casos P1 que dependem de leva do backend não publicada ficam **BLOQ** e impedem o fechamento da
  rodada (AC-QA-07-01).

## 7. Critério de aceite da rodada e resultados

### 7.1 Critério (AC-QA-07-01)

- **Todos os casos P1 passam** no Android (emulador, Expo Go, backend real, mocks desligados):
  as seções 2 a 5.
- Falhas P2 e P3 viram tarefas de correção no BACKLOG/TRACKING, com o ID do caso.
- Caso **não executado** por falta de dado, de leva do backend ou de aparelho fica como **N/A com
  o motivo** ou **BLOQ**, nunca como aprovado.
- Os resultados vão para o TRACKING e para a seção "Entrega 4" do QA-05-RELATORIO, com a data, a
  plataforma, o commit testado e os IDs que falharam.
- **Nenhuma credencial, token, e-mail, código de recuperação ou dado pessoal** no relatório, nas
  capturas ou nos PRs de correção. Nenhum dado clínico em log.

### 7.2 Tabela de resultados (a preencher na rodada)

| Seção                        | Casos | P1  | OK  | FALHA | N/A | BLOQ | Observações |
| ---------------------------- | ----- | --- | --- | ----- | --- | ---- | ----------- |
| 2.1 Base, senha e pendências |       |     |     |       |     |      |             |
| 2.2 Evolução da sessão       |       |     |     |       |     |      |             |
| 2.3 Avaliações e escalas     |       |     |     |       |     |      |             |
| 2.4 Relatórios               |       |     |     |       |     |      |             |
| 2.5 Notificações e navegação |       |     |     |       |     |      |             |
| 2.6 Qualidade                |       |     |     |       |     |      |             |
| 3.1 Reteste da sessão        |       |     |     |       |     |      |             |
| 3.2 Fluxos F1 a F6           |       |     |     |       |     |      |             |
| 4 FEC-01                     |       |     |     |       |     |      |             |
| 5.1 a 5.5 Backend            |       |     |     |       |     |      |             |
