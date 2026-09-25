# Plano de testes de navegação e comportamento — Entrega 1

Roteiro de testes manuais no app para validar a navegação e o comportamento esperado da
Entrega 1, com dados mockados (G-29). Complementa os testes automatizados (Vitest) e serve de
base para os fluxos E2E (Maestro, T-105/T-1001).

## 1. Ambiente e preparação

- **Plataforma:**
  - emulador Android `Pixel_3a_API_34`, com o development build `com.labirintodosaber.app` (T-108);
  - aparelho físico e iOS ficam pendentes.
- **Metro rodando** (`npx expo run:android` na primeira vez; depois, `pnpm start`), com a flag
  de mocks ligada (padrão em desenvolvimento).
- **Contas mock** (dados fictícios):

  | E-mail                          | Senha      | Resultado                                           |
  | ------------------------------- | ---------- | --------------------------------------------------- |
  | `educadora.mock@labirinto.test` | `senha123` | Login com sucesso (educadora "Aline Ribeiro Souza") |
  | `invalido.mock@labirinto.test`  | qualquer   | Erro "E-mail ou senha incorretos" (401)             |
  | `semrede.mock@labirinto.test`   | qualquer   | Erro de falta de conexão                            |

- **Estado dos mocks:** a sessão e os itens criados ficam **só em memória**. Fechar o app apaga o
  que foi criado e expira a sessão ("Sua sessão expirou"). Isso é esperado com mocks.
- **Registro:** para cada caso, anote Passou/Falhou, a plataforma e um print quando falhar.

Legenda de prioridade: **P1** bloqueia a demo, **P2** é importante, **P3** é refinamento.

## 2. Login e sessão

| ID     | Prio | Passos                                                           | Resultado esperado                                                                                |
| ------ | ---- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| NAV-01 | P1   | Abrir o app sem sessão                                           | Abre direto no **Login**: logo, card "Entrar", "Acesse sua conta para continuar"                  |
| NAV-02 | P1   | Entrar com a conta de sucesso                                    | Vai para a **Tela Inicial** com "Olá, Aline Ribeiro Souza!"                                       |
| NAV-03 | P2   | Enviar com os campos vazios                                      | Mensagens de validação nos campos; nenhuma requisição é enviada                                   |
| NAV-04 | P2   | E-mail com formato inválido                                      | "Digite um e-mail válido."                                                                        |
| NAV-05 | P1   | Entrar com `invalido.mock@...`                                   | "E-mail ou senha incorretos. Tente novamente." e o botão "Tentar novamente" aparece               |
| NAV-06 | P2   | Entrar com `semrede.mock@...`                                    | Mensagem de erro de conexão, sem reenvio automático                                               |
| NAV-07 | P2   | Tocar no ícone de olho da senha                                  | A senha alterna entre visível e oculta; o rótulo de acessibilidade muda ("Mostrar/Ocultar senha") |
| NAV-08 | P3   | Digitar o e-mail no teclado                                      | O teclado é de e-mail, sem maiúscula automática; espaços no fim são removidos                     |
| NAV-09 | P2   | Tocar em "Esqueci minha senha"                                   | Abre a tela de recuperação ("Em breve")                                                           |
| NAV-10 | P1   | Logado, fechar o app e abrir de novo                             | Volta ao Login com "Sua sessão expirou. Entre novamente." (mock em memória)                       |
| NAV-11 | P1   | Logado, tentar voltar para o Login com o botão Voltar do Android | Não volta para o Login; a guarda de sessão mantém o usuário na área logada                        |

## 3. Tela Inicial e tab bar

| ID      | Prio | Passos                                            | Resultado esperado                                                                                                        |
| ------- | ---- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| HOME-01 | P1   | Ver o cabeçalho e a tab bar                       | Título "Tela Inicial"; 4 abas: **Tela Inicial, Atividades, Alunos, Relatórios**, sem Agenda (G-31); nenhum rótulo cortado |
| HOME-02 | P1   | Ver o banner                                      | "Olá, {nome}! 👋" e "Você tem N sessões agendadas para hoje", com o botão "▶ Iniciar Sessão" à direita                    |
| HOME-03 | P2   | Conferir a contagem                               | Agendamentos **cancelados não entram na contagem**, mas aparecem na lista com o status "Cancelado" (G-13)                 |
| HOME-04 | P1   | Ver "Sessões de hoje"                             | Cards com o nome do aluno, o horário (fuso de São Paulo) e o status (Pendente/Concluído/Cancelado)                        |
| HOME-05 | P2   | Tocar num card de hoje                            | Abre "Em breve" (Agenda adiada, G-31)                                                                                     |
| HOME-06 | P2   | Ver "Últimas Sessões Realizadas"                  | Carrossel horizontal com avatar, nome do aluno e nome da sessão; "Ver todas →" abre "Em breve"                            |
| HOME-07 | P3   | Ver "Atividades Recentes"                         | 3 cards coloridos, cada um com ícone, título do caderno e tags; tocar abre "Em breve"                                     |
| HOME-08 | P1   | Trocar entre as 4 abas                            | Cada aba abre a tela certa; Relatórios mostra "Em breve"; a aba ativa fica destacada                                      |
| HOME-09 | P2   | Tocar no menu (☰) e no avatar do cabeçalho       | Abrem as telas "Em breve" correspondentes                                                                                 |
| HOME-10 | P3   | Deixar a tela sem internet (modo avião) e reabrir | Mostra o aviso de sem conexão com os dados salvos (cache persistido)                                                      |

## 4. Fluxo de sessão (etapas 1 e 2)

| ID     | Prio | Passos                                                         | Resultado esperado                                                                                  |
| ------ | ---- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| SES-01 | P1   | Na Tela Inicial, tocar em "Iniciar Sessão"                     | Abre a **tela 04** (etapa 1), "Escolha o aluno que participará desta sessão", com os alunos do mock |
| SES-02 | P2   | Buscar um aluno por nome (com e sem acento)                    | A lista filtra, sem diferenciar acento nem maiúscula                                                |
| SES-03 | P1   | Tentar "Próximo Passo" sem escolher aluno                      | Não avança (botão desabilitado ou mensagem)                                                         |
| SES-04 | P1   | Escolher um aluno e tocar em "Próximo Passo"                   | Abre a **tela 05** (etapa 2)                                                                        |
| SES-05 | P1   | Na tela 05, tentar iniciar sem nome ou sem conteúdo            | "Iniciar Sessão Agora" fica desabilitado                                                            |
| SES-06 | P2   | Nome com mais de 100 caracteres                                | Mensagem de validação (G-15)                                                                        |
| SES-07 | P2   | Alternar entre os chips Cadernos, Grupos e Atividades e buscar | Cada chip lista o seu tipo; a busca filtra; um chip sem resultado mostra o estado vazio             |
| SES-08 | P1   | Preencher o nome, escolher um conteúdo e tocar em "Voltar"     | Volta à tela 04 com o aluno ainda selecionado; ao avançar de novo, o nome e o conteúdo continuam lá |
| SES-09 | P1   | Tocar em "Iniciar Sessão Agora"                                | Abre o placeholder do player ("Em breve"); o início real da sessão é a T-704, pendente              |

## 5. Atividades (gestão de conteúdo)

| ID      | Prio | Passos                                                                             | Resultado esperado                                                                                |
| ------- | ---- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| CONT-01 | P1   | Abrir a aba Atividades                                                             | Lista mista com filtros **Ver Tudo, Cadernos, Grupos, Atividades**, busca e paginação de 10 em 10 |
| CONT-02 | P2   | Tocar em cada filtro                                                               | Só aparece o tipo escolhido; cada card mostra a faixa/ícone do tipo, o título e as tags           |
| CONT-03 | P2   | Buscar por nome                                                                    | Filtra pelo campo exibido, sem diferenciar acento nem maiúscula                                   |
| CONT-04 | P1   | Tocar em "+ Criar novo conteúdo"                                                   | Abre a escolha entre Caderno, Grupo e Atividade                                                   |
| CONT-05 | P1   | **Criar Grupo:** preencher o nome, escolher uma categoria e salvar                 | Volta para a lista, e o grupo aparece no filtro Grupos com "0 atividades"                         |
| CONT-06 | P2   | Criar Grupo sem nome ou sem categoria                                              | O botão não envia, ou aparece a mensagem de validação                                             |
| CONT-07 | P1   | **Criar Atividade:** enunciado, categoria, 2 alternativas, "Marcar" em uma, salvar | Volta para a lista, e a atividade aparece no filtro Atividades com "2 alternativas"               |
| CONT-08 | P2   | Criar Atividade com só 1 alternativa, ou sem marcar a correta                      | Não envia; mensagem de validação                                                                  |
| CONT-09 | P3   | Tocar em Imagem ou Áudio da atividade                                              | Desabilitados, com o selo "Em breve"                                                              |
| CONT-10 | P1   | **Criar Caderno:** nome, categoria, escolher um grupo com atividades, salvar       | Volta para a lista, e o caderno aparece no filtro Cadernos                                        |
| CONT-11 | P2   | Criar Caderno sem grupo com atividades                                             | O botão fica desabilitado, com o aviso "Selecione ao menos um grupo com atividades"               |
| CONT-12 | P2   | No Criar Caderno, tocar em "+ Criar Grupo", criar e voltar                         | O grupo novo aparece na grade de seleção                                                          |
| CONT-13 | P2   | Cancelar em qualquer tela de criação                                               | Volta sem salvar                                                                                  |
| CONT-14 | P3   | Textos no singular                                                                 | "1 atividade" e "1 tarefa", sem "1 atividades"                                                    |

## 6. Detalhes de caderno, grupo e atividade

| ID     | Prio | Passos                                     | Resultado esperado                                                                                   |
| ------ | ---- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| DET-01 | P1   | Tocar num caderno da lista                 | Abre o **Detalhe do Caderno**: título, categoria e nº de tarefas, e a seção "Grupos do Caderno"      |
| DET-02 | P1   | No caderno, tocar num grupo                | Abre o **Detalhe do Grupo**: nome, categoria e a seção "Atividades do Grupo"                         |
| DET-03 | P1   | No grupo, tocar numa atividade             | Abre o **Detalhe da Atividade**: enunciado, alternativas com a correta marcada e o material de apoio |
| DET-04 | P1   | Voltar em cada nível                       | Atividade → Grupo → Caderno → lista, sem perder o filtro                                             |
| DET-05 | P1   | "Excluir" → "Cancelar" no modal            | Nada muda                                                                                            |
| DET-06 | P1   | "Excluir" → confirmar                      | Volta para a tela anterior, e o item some da lista                                                   |
| DET-07 | P2   | "Editar" em qualquer detalhe               | Abre "Em breve"                                                                                      |
| DET-08 | P3   | Grupo sem atividades ou caderno sem grupos | Mostra o estado vazio da seção                                                                       |

> O Detalhe da Atividade (UX5-A) estava em implementação quando este plano foi escrito. O DET-03
> depende dele.

## 7. Alunos

| ID     | Prio | Passos                                                                          | Resultado esperado                                                                                            |
| ------ | ---- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| ALU-01 | P1   | Abrir a aba Alunos                                                              | "Alunos organizados em ordem alfabética (N alunos)", cards em ordem A–Z com avatar, idade, gênero e objetivos |
| ALU-02 | P2   | Buscar aluno por nome                                                           | Filtra sem diferenciar acento nem maiúscula; sem resultado, mostra o estado vazio                             |
| ALU-03 | P1   | Tocar num aluno                                                                 | Abre o **detalhe**: avatar, nome, "N anos • gênero", endereço, contato do responsável e objetivos             |
| ALU-04 | P2   | No detalhe, tocar no botão de editar                                            | Abre "Em breve"                                                                                               |
| ALU-05 | P1   | Tocar em "+ Cadastrar Aluno" e preencher tudo                                   | Volta para a lista, e o aluno aparece em ordem alfabética com a contagem atualizada                           |
| ALU-06 | P1   | Depois do ALU-05, iniciar uma sessão                                            | O aluno novo aparece na tela 04                                                                               |
| ALU-07 | P2   | Cadastrar com campos vazios ou fora dos limites (idade 0 ou 60, telefone curto) | Mensagens de validação por campo; nada é enviado                                                              |
| ALU-08 | P2   | Adicionar e remover objetivos de aprendizado                                    | O chip entra e sai; é preciso pelo menos 1 para enviar                                                        |
| ALU-09 | P3   | Tocar em "Adicionar foto"                                                       | Desabilitado, com o selo "Em breve"                                                                           |

## 8. Comportamentos transversais

| ID     | Prio | Verificação                                                | Resultado esperado                                         |
| ------ | ---- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| TRV-01 | P1   | Botão Voltar do Android em todas as telas                  | Volta um nível; não sai do app nem volta para o Login      |
| TRV-02 | P2   | Botões de envio durante a requisição                       | Ficam desabilitados, sem envio duplo                       |
| TRV-03 | P2   | Erro de rede numa criação (desligar a internet)            | Mensagem de erro e nenhum reenvio automático (G-08)        |
| TRV-04 | P2   | Estados de carregando, vazio e erro com "Tentar novamente" | Aparecem nas listas (Home, Atividades, Alunos)             |
| TRV-05 | P3   | Leitor de tela (TalkBack) nas telas principais             | Botões e campos com rótulos em português; erros anunciados |
| TRV-06 | P3   | Texto do sistema em tamanho grande                         | Sem cortes nem sobreposição graves                         |
| TRV-07 | P3   | Tablet (checagem, G-01)                                    | O layout não quebra; o conteúdo fica centralizado          |

## 9. Fora do escopo desta entrega (esperado como "Em breve" ou ausente)

- **Agenda:** a tela, a criação e a edição de agendamentos (G-31). Os dados e componentes já existem.
- **Sessão depois da etapa 2:**
  - iniciar a sessão (T-704);
  - player da tela 06 (T-801 e T-802);
  - finalização e observação (T-803 e T-804).
- **Editar:** edição de aluno, caderno, grupo e atividade.
- **Mídia:** upload de foto, imagem e áudio.
- **Outras áreas:** relatórios, recuperação de senha completa (T-403 e T-404) e menu lateral.
- **Integração com o backend real** (T-1004).

## 10. Critério de aceite da rodada

- Todos os casos **P1** passam no emulador Android.
- Falhas P2 e P3 viram tarefas de correção no BACKLOG/TRACKING, com o ID do caso.
- Os resultados vão para o TRACKING (§7), com a data, a plataforma e os IDs que falharam.
