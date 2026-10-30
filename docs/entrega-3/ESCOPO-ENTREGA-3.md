# Entrega 3 — O que é entregue

> Documento de entrega do app **Labirinto do Saber**, escrito em 30/10/2026. Descreve o estado
> final da Entrega 3, com todas as correções da rodada de testes já incorporadas. É autocontido:
> não depende de nenhum outro documento para ser entendido.

## 1. Resumo

O Labirinto do Saber é um app para profissionais que acompanham crianças e jovens com
dificuldades de aprendizagem (psicopedagogos e educadores). Ele roda em Android e iOS, feito em
React Native com Expo, e conversa com um backend próprio.

A Entrega 3:

- fecha a primeira versão completa do app (a V1, entregue na Entrega 2);
- completa as quatro abas (**Início, Agenda, Pacientes e Recursos**) com tudo o que o backend
  oferece hoje;
- traz um recurso novo: **Planos com IA**, que gera e acompanha o PDI (Plano de Desenvolvimento
  Individual) e o PE (Planejamento Educacional) de cada paciente;
- revisa a acessibilidade do app;
- incorpora as correções encontradas nos testes do app no emulador Android, ligado ao backend
  real.

| Item                    | Valor                                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| Tarefas da entrega      | 27 (23 de desenvolvimento e 4 de validação), mais as correções da rodada de testes       |
| Áreas novas ou refeitas | Agenda, atendimento, anamnese, edição de paciente, perfil e conta, sessão, Planos com IA |
| Testes automatizados    | cerca de 1.000, rodados a cada mudança junto com checagem de tipos, lint e build Android |
| Execução                | Expo Go (Expo SDK 57); Android validado em emulador com o backend real                   |
| Backend                 | `https://labirinto-do-saber.vercel.app`                                                  |

## 2. Navegação

| Aba       | O que reúne                                                                           |
| --------- | ------------------------------------------------------------------------------------- |
| Início    | Próximo atendimento, agenda do dia, sugestões da IA pendentes e atalhos               |
| Agenda    | Semana dia a dia, atendimentos e todo o fluxo de agendamento                          |
| Pacientes | Lista, ficha, edição, anamnese, planos do paciente e contato pelo WhatsApp            |
| Recursos  | Perfil, Planos com IA, modelos de anamnese, atividades, cadernos, grupos e relatórios |

As telas antigas da primeira entrega foram removidas; toda a navegação leva às telas novas.

## 3. Agenda e atendimentos

### 3.1 Tela Agenda

- Cabeçalho com o mês e o ano; faixa da semana de segunda a domingo, com o dia de hoje marcado e
  setas para a semana anterior e a seguinte.
- Lista do dia escolhido em ordem de horário, com a contagem "N atendimentos" e, em cada item,
  horário, paciente, tipo e duração ("14:00 · 50 min").
- **Atendimento em destaque:** no dia de hoje, o primeiro atendimento pendente que **ainda não
  terminou** (início mais duração depois do horário atual). Os que já passaram sem ser concluídos
  continuam na lista, sem destaque.
- Status visíveis: "Concluído", com ícone; "Cancelado", com fundo suave, borda tracejada e texto
  legível.
- Estados de carregando, erro com "Tentar de novo", dia vazio ("Nenhum atendimento neste dia") e
  sem conexão, mostrando os dados já carregados.
- "Novo atendimento" abre o formulário com o dia escolhido já preenchido.

### 3.2 Novo atendimento, edição e remarcação

- Campos: paciente, data e horário (obrigatórios); tipo (texto livre, com as sugestões
  "Psicopedagogia" e "Avaliação"); duração (15 a 240 minutos, padrão 50); observação.
- O formulário recém-aberto não mostra erros. Depois da primeira interação, aparecem "Selecione o
  paciente", "Selecione a data" e "Selecione o horário" no campo que faltar. O botão só fica
  disponível com tudo válido.
- **Conflito de horário:** se o horário se sobrepõe a outro atendimento pendente, aparece "Já
  existe um atendimento nesse horário" no campo de horário, com o link "Ver atendimento".
  Atendimentos encostados (o fim de um igual ao início do outro) não conflitam.
- Editar e remarcar enviam só os campos alterados; o paciente do atendimento não muda.

### 3.3 Detalhe do atendimento

| Status    | Ações disponíveis                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| Pendente  | Iniciar sessão, Enviar lembrete pelo WhatsApp, Remarcar, Editar, Marcar como concluído, Cancelar atendimento, Excluir |
| Cancelado | Reativar (só data e horário podem mudar), Editar observação, Excluir                                                  |
| Concluído | Editar observação                                                                                                     |

- Cancelar pede confirmação ("O atendimento fica na agenda como cancelado."); excluir também
  ("Excluir atendimento? Ele sai da agenda e não pode ser recuperado.").
- Regras seguidas: um atendimento concluído não muda mais de status; cancelado e concluído não
  aceitam mudança de horário, tipo ou duração (a observação pode mudar); reativar pode remarcar
  na mesma ação.
- Um atendimento que não existe mais mostra "Atendimento não encontrado" com "Voltar".

### 3.4 Lembrete pelo WhatsApp

- Disponível no detalhe do atendimento pendente e como ação "Lembrete" em cada item da agenda de
  hoje, na Início. Na ficha do paciente, o botão de contato usa o mesmo recurso.
- Abre o WhatsApp do aparelho com a mensagem já escrita; quem envia é o profissional. O app não
  envia nada sozinho e não registra o envio.
- Usa o telefone do responsável e, se não houver, o do paciente. O número sai só com dígitos e,
  para números nacionais, sempre com o código do país `55` (inclusive para quem tem DDD 55).
- Mensagem do lembrete: "Olá, {responsável}! Passando para lembrar do atendimento de {paciente}
  na {dia da semana}, {dd/mm}, às {hh:mm}. Qualquer imprevisto, é só avisar por aqui." (com "no
  sábado" e "no domingo"; sem o nome do responsável, começa com "Olá!").
- Mensagem de contato pela ficha: "Olá, {responsável}! Tudo bem? Aqui é {educador}, do
  acompanhamento de {paciente}."
- Sem telefone, o botão fica desabilitado com a dica "Paciente sem telefone cadastrado".

## 4. Pacientes

### 4.1 Lista

- Busca por nome, filtro "Com sessão hoje" e, em cada paciente, o "Próximo atendimento" (ignora
  cancelados e concluídos).
- **Foto do paciente** no avatar quando ele tiver foto; sem foto (ou se a foto não carregar),
  aparecem as iniciais coloridas.
- Cartões espaçados entre si e botão flutuante "Cadastrar paciente".

### 4.2 Ficha do paciente

A ficha tem duas abas: **Visão geral** e **Planos**.

- **Visão geral:**
  - foto ou iniciais, idade e dificuldades mapeadas;
  - responsável ("Responsável: {nome} ({parentesco})");
  - "Próxima sessão" (ignora atendimentos concluídos);
  - bloco **PDI vigente**, com título, vigência, progresso e "Ver plano completo"; sem PDI ativo,
    "Nenhum PDI ativo" com "Criar PDI";
  - linha **Anamnese**, com a data da última resposta;
  - contato pelo WhatsApp e "Iniciar sessão".
- **Planos:** os planos do paciente (ativos primeiro) e "Criar novo plano". A lista se atualiza
  logo depois de encerrar ou editar um plano.

### 4.3 Editar paciente e responsável

- O mesmo formulário do cadastro, com a seção **Responsável** (nome, telefone e parentesco,
  todos opcionais). O telefone é digitado com máscara e enviado só com dígitos.
- Envia só o que mudou; sem mudança, o botão "Salvar alterações" fica desabilitado.
- As dificuldades editadas substituem a lista anterior.
- Depois de salvar, a ficha e a lista mostram os dados novos. Em caso de erro, a mensagem aparece
  e o formulário continua preenchido.

### 4.4 Modelos de anamnese

- Acesso por Recursos → "Modelos de anamnese" e pela anamnese do paciente.
- Cada modelo tem título (1 a 200 caracteres), descrição (até 1000) e perguntas de quatro tipos:
  texto, múltipla escolha (uma opção), caixas de seleção (várias opções) e envio de arquivo. Cada
  pergunta pode ser obrigatória; é possível adicionar, remover e reordenar.
- Validações: "Informe o título", "Informe a pergunta", "Informe pelo menos duas opções" (nos
  tipos de escolha) e "Adicione pelo menos uma pergunta".
- Um modelo que já tem respostas não pode ser editado nem excluído ("Este modelo já tem respostas
  e não pode ser alterado."). Excluir pede confirmação.

### 4.5 Anamnese do paciente

- Lista das anamneses respondidas, com o modelo, "Respondida em …" e "Editada em …".
- "Nova anamnese": escolher o modelo e preencher; cada tipo de pergunta usa o campo adequado. As
  perguntas de arquivo enviam o documento (até 10 MB) antes de salvar.
- Perguntas obrigatórias são conferidas antes do envio; erros vindos do servidor aparecem na
  própria pergunta.
- "Editar" reabre uma resposta já preenchida.
- Sem nenhum modelo cadastrado, a tela oferece "Criar modelo".
- O conteúdo das respostas nunca vai para os registros (logs) do app.

## 5. Sessão de atendimento

Uma sessão é o momento em que o profissional aplica atividades ao paciente pelo app, registrando
cada resposta.

### 5.1 Iniciar sessão

- **Pela Agenda, pela Início ou pela ficha do paciente**, "Iniciar sessão" vai direto para a
  montagem da sessão com aquele paciente, tendo o profissional logado como responsável. Não há
  tela de escolha de paciente nesses casos. Vindo de um atendimento, a sessão fica ligada a ele.
- Se o paciente já tem uma sessão aberta, aparecem "Retomar" e "Encerrar" antes de começar outra.
- Montagem: nome da sessão (1 a 100 caracteres) e escolha do conteúdo entre **Caderno, Grupo ou
  Atividade**, com busca. Título, busca e mensagens seguem o tipo escolhido ("Escolha o caderno",
  "Escolha o grupo", "Escolha a atividade").
- "Voltar" na montagem desiste da sessão sem deixar nada pela metade.
- Se o início falhar, a mensagem do servidor aparece e é possível tentar de novo; se o
  atendimento ligado não existir mais, o app oferece "Iniciar sem vínculo".

### 5.2 Durante e depois da sessão

- As atividades do conteúdo escolhido aparecem em sequência; cada resposta é enviada ao servidor,
  e respostas que não puderam ser enviadas são reenviadas.
- **Retomada:** se o app for fechado no meio, ao abrir de novo aparece "Sessão em andamento" com
  "Retomar" e "Encerrar agora". O aviso aparece só para a sessão que estava salva quando o app foi
  aberto, nunca por cima de uma sessão recém-iniciada.
- Uma sessão com **caderno** pode ser retomada em qualquer aparelho, porque o servidor guarda o
  caderno usado. Com grupo ou atividade avulsa, a retomada acontece no mesmo aparelho.
- Encerrar leva ao registro de uma observação e ao **relatório da sessão** (tempo, acertos por
  categoria e por tipo). O "Voltar" do relatório volta à tela anterior ou, se não houver, à Início.
- Uma sessão iniciada a partir de um atendimento marca esse atendimento como **Concluído** ao
  encerrar; Agenda e Início se atualizam.

## 6. Planos com IA (PDI e PE)

O **PDI** é o plano de médio prazo do paciente (3 ou 6 meses), com metas e revisões. O **PE** é o
planejamento de uma sessão específica, opcionalmente ligado ao PDI ativo. Cada paciente pode ter
no máximo um PDI ativo.

### 6.1 Lista de planos

- Acesso por Recursos → "Planos com IA" e pelo atalho "Criar plano" da Início.
- Seções "Em andamento" e "Encerrados"; cada plano mostra paciente, tipo (PDI ou PE), título,
  progresso e próxima revisão. Há filtro por tipo.
- Estados de carregando, erro, vazio ("Nenhum plano ainda") e sem conexão.

### 6.2 Gerar com IA

- Escolha do paciente (ou já definido, vindo da ficha), do tipo (PDI ou PE), do foco do
  planejamento e das dificuldades consideradas, que já vêm marcadas a partir das dificuldades do
  paciente (pelo menos uma).
- PDI: duração de 3 ou 6 meses. PE: data da sessão (hoje, por padrão), ligado ao PDI ativo quando
  ele existir.
- Opcional: usar uma anamnese já respondida pelo paciente como contexto para a IA.
- Durante a geração aparece "Gerando o planejamento…" (até 90 segundos). Em caso de erro, há
  "Tentar de novo"; o app nunca repete o pedido sozinho. O resultado é um rascunho, ainda não
  salvo.

### 6.3 Rascunho e salvar

- Tudo é editável antes de salvar: título, objetivo geral, metas com critério de sucesso (de 1 a
  10, com adicionar, remover e reordenar) e "Ajustes do profissional". A justificativa da IA
  aparece em "Por que essas metas", somente leitura.
- "Salvar PDI" ou "Salvar PE" grava o plano e abre o detalhe.
- Se o paciente já tem um PDI ativo: "Este paciente já tem um PDI ativo", com "Ver PDI ativo", sem
  perder o rascunho.
- "Compartilhar" envia uma síntese do plano em texto pelo compartilhamento do aparelho.
- Sair com um rascunho na tela pede confirmação ("Descartar o rascunho?").

### 6.4 Detalhe do plano

- Paciente, tipo, status, vigência, próxima revisão, objetivo geral e metas com status e barra de
  progresso. O progresso é calculado pelo servidor.
- O status de cada meta pode mudar entre Não iniciada, Em andamento, Atingida e Descontinuada.
- "Editar plano" reabre o formulário com os dados atuais; uma meta atingida não pode ser removida.
- "Registrar revisão" (nota e próxima revisão), com os erros mostrados dentro do formulário, e a
  lista "Revisões", com as datas no horário de Brasília.
- "Encerrar plano" como Concluído ou Cancelado, com confirmação ("Não é possível reabrir"). O
  plano encerrado fica somente leitura.
- Plano inexistente mostra "Plano não encontrado"; plano de outro profissional, "Sem acesso".
  Ambos com "Voltar".

### 6.5 Sugestões da IA

- No plano ativo, "Pedir sugestões da IA" pede à IA ajustes com base na evolução do paciente.
  Sem novidades, aparece "Sem sugestões novas para este plano".
- Cada sugestão descreve a mudança e **qual meta muda** (por exemplo: "Mudar a meta "Desenvolver
  a compreensão literal de textos curtos." para Em andamento"). Os tipos são: mudar o status de
  uma meta, criar uma meta, reescrever uma meta e agendar uma revisão.
- "Aceitar" aplica a mudança no plano; "Descartar" retira a sugestão. Uma sugestão que deixou de
  fazer sentido sai com "Esta sugestão não se aplica mais".
- Há uma tela com as sugestões pendentes de todos os planos, e a Início mostra o cartão "N
  sugestões da IA para revisar" (some quando não há nenhuma).

## 7. Conta e conteúdo

- **Perfil:** foto (enviada assim que escolhida), nome, e-mail (somente leitura), contato e
  profissão. "Salvar" envia só o que mudou. O banner de Recursos mostra a foto e a profissão.
- **Sair da conta:** recurso novo, com confirmação. Limpa a sessão de login, os dados guardados no
  aparelho e qualquer sessão de atendimento em andamento, e volta ao login.
- **Atividades:** detalhe no visual novo, com "Jogar", "Editar" e "Excluir" (com confirmação).
  Depois de editar, um único "Voltar" retorna ao detalhe.
- **Cadernos e grupos:** a biblioteca de cadernos é compartilhada entre os profissionais. Um
  caderno ou grupo de outro profissional abre só para leitura, com a indicação "Caderno de outro
  educador" e sem "Editar" e "Excluir"; o servidor também bloqueia essas ações para quem não é o
  dono.
- **Dados de exemplo:** o app usa o backend real por padrão. Um modo com dados fictícios pode ser
  ligado só para desenvolvimento.

## 8. Acessibilidade

- **Áreas de toque de 48 dp** em botão de voltar, botões de ícone, abas, controle segmentado,
  filtros e ações de texto, inclusive no Android.
- **Contraste mínimo de 4,5:1** em todos os textos: mensagens de erro no vermelho acessível
  (`#c53b3b`), textos secundários no cinza `#5a7471` e atendimento cancelado legível. Um teste
  automático impede a volta de cores sem contraste suficiente.
- **Leitores de tela (TalkBack e VoiceOver):** títulos de seção anunciados como cabeçalho, cartões
  com título e descrição, botões com nomes claros ("Remover pergunta 2", "Enviar lembrete pelo
  WhatsApp para {paciente}").

## 9. Backend

O app usa a API publicada no backend, com documentação Swagger em
`https://labirinto-do-saber.vercel.app/api-docs/`. A Entrega 3 passou a usar:

- **atendimentos:** criar, consultar, editar, mudar status (com detecção de conflito) e excluir;
- **sessões:** ligação da sessão ao caderno e ao atendimento;
- **pacientes:** dados do responsável e edição parcial;
- **profissional:** profissão, atualização do perfil e da foto;
- **conteúdo:** consulta de grupo por id;
- **anamnese:** modelos (criar, editar e excluir), respostas, edição de resposta e envio de
  arquivo;
- **planos:** criação, consulta, edição, metas, revisões, encerramento, geração com IA e
  sugestões.

Durante a entrega, o backend recebeu quatro correções, já em produção:

| Correção                  | O que mudou                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Senhas fora das respostas | Nenhuma resposta da API traz senha; o perfil do profissional sempre volta no mesmo formato da consulta      |
| Dificuldades do paciente  | A edição do paciente salva a lista de dificuldades                                                          |
| Dono do conteúdo          | Só o dono edita ou exclui caderno e grupo; os outros recebem "acesso negado"; inexistente, "não encontrado" |
| Acesso à anamnese         | Anamnese de outro profissional responde "acesso negado", sem confundir com sessão expirada                  |

## 10. Decisões tomadas na entrega

| Decisão                                                                                                 |
| ------------------------------------------------------------------------------------------------------- |
| A limpeza da primeira entrega removeu só o que ficou sem uso                                            |
| Planos com IA foi o único recurso novo pedido ao backend                                                |
| A troca de senha fica fora do perfil nesta entrega                                                      |
| Os modelos de anamnese fazem parte da entrega                                                           |
| Os dados fictícios ficam desligados por padrão                                                          |
| As sugestões da IA são geradas sob demanda, pelo botão "Pedir sugestões da IA"                          |
| O WhatsApp é aberto por link com mensagem pronta, sem envio automático                                  |
| O "próximo atendimento" é o primeiro que ainda não terminou, na Início e na Agenda                      |
| A biblioteca de cadernos é compartilhada; só o dono edita e exclui                                      |
| A sessão começa direto com o paciente do atendimento, e o conteúdo pode ser caderno, grupo ou atividade |

## 11. Limitações conhecidas

São regras do produto ou do backend, não defeitos:

- Não é possível apagar um responsável já salvo, nem limpar a próxima revisão e as notas de um
  plano: o servidor trata um campo vazio como "não enviado".
- Sessões com grupo ou atividade avulsa só podem ser retomadas no mesmo aparelho.
- Um plano encerrado não pode ser reaberto, e planos não são excluídos.
- A geração com IA pode levar dezenas de segundos (limite de 90 segundos).
- A troca de senha dentro do perfil fica para uma próxima entrega.

## 12. Fora do escopo

Evolução, Escalas e Equipe (telas previstas no design, ainda sem API); síntese dedicada da
anamnese; recorrência de atendimentos e lembretes automáticos; modelos de anamnese prontos; visão
mensal da agenda; aba "Avaliações" na ficha do paciente.

## 13. Como foi validado

- **Testes automatizados:** cerca de 1.000 testes cobrem regras, telas e integração com a API.
  Eles rodam a cada mudança, junto com checagem de tipos, lint e geração do pacote Android.
- **Testes manuais:** um roteiro com 148 casos (103 prioritários), cobrindo cada área, os fluxos
  entre telas (agenda → atendimento → sessão; ficha → edição; ficha → anamnese; plano: gerar →
  salvar → detalhe; perfil → sair), conferências do backend e acessibilidade, executado no
  emulador Android com o backend real.
- **Rodada de correções:** os defeitos encontrados nos testes manuais foram corrigidos, um a um,
  com um teste automático que reproduz cada defeito antes da correção, e retestados no emulador.

## 14. Como rodar

1. Instalar as dependências: `pnpm install --frozen-lockfile`.
2. Criar um arquivo `.env` na raiz com:
   ```
   EXPO_PUBLIC_APP_ENV=development
   EXPO_PUBLIC_API_BASE_URL=https://labirinto-do-saber.vercel.app
   ```
3. Iniciar com `pnpm start --clear` e abrir no Expo Go (leitura do QR code ou emulador).
4. Para usar dados fictícios em vez do backend, acrescentar `EXPO_PUBLIC_USE_MOCKS=true` ao `.env`.
