# AGENTS.md — Como trabalhar no Labirinto do Saber Mobile

Este arquivo define a metodologia de trabalho neste repositório. Leia-o antes de
iniciar qualquer tarefa; o usuário não precisa repetir estas instruções.

Respeite as instruções de sistema e da ferramenta utilizada. Um pedido direto do
usuário pode alterar este processo: registre a exceção e o motivo. Instruções
específicas de subdiretórios complementam estas regras no respectivo escopo.

## 1. Contexto real do projeto

O projeto é identificado no README como `LabirintoDoSaberReactNative`. Sua arquitetura
mobile está definida em [Documentação do projeto](docs/PROJECT.md), que reúne a
arquitetura React Native + TypeScript e a referência global da API fornecida pelo
usuário. **Leia esse documento antes de planejar ou implementar funcionalidades.**
A base ainda não contém aplicação, manifesto de dependências ou testes: decisões
documentadas não equivalem a recursos implementados.

- A stack definida inclui Expo, Expo Router, TypeScript strict, TanStack Query,
  Zustand, Axios, React Hook Form/Zod, NativeWind, SecureStore e MMKV. Consulte a
  lista completa no documento; confirme versões e compatibilidade no bootstrap.
- Confirme gerenciador de pacotes, scripts e configuração instalada no discovery;
  não reabra escolhas documentadas sem evidência ou pedido do usuário. Decisões de
  2026-09-24 (detalhes em `docs/entrega-1/GATES.md`): **pnpm**; development build
  Expo para Android e iOS via EAS (não Expo Go); backend **local** com dados fictícios
  nos testes; fuso fixo `America/Sao_Paulo`; **Expo SDK 57, TypeScript 6 e Vitest**
  (versões validadas em `docs/bootstrap/COMPATIBILIDADE.md`, que é a referência de
  versões da T-102 em diante).
- O backend é externo a este repositório. Sua referência fornecida descreve o
  contrato de integração; não alegue validação contra seu código ou produção sem
  evidência. Preserve métodos, caminhos, formatos e erros, inclusive peculiaridades.
- Necessidades novas de API são dependências explícitas a negociar. Não invente
  endpoints ou campos para acomodar o cliente; consulte as pendências de integração
  do documento antes de implementar sessão, reenvio ou recuperação de senha.
- Ainda não existem comandos de instalação, execução, build ou teste comprovados.
  Depois do bootstrap, documente os comandos reais no README e atualize esta seção.
- A branch atual observada era `main`, com remoto `origin` configurado. Confira o
  estado real antes de operações Git; isso não autoriza commit nem push.
- Não importe regras de Next.js, WhatsApp ou caminhos de outros projetos.

No bootstrap, refine com o usuário as decisões que afetam o produto ou a stack e
não podem ser inferidas. A configuração mínima do ambiente de testes pode preceder
a primeira execução de testes, mas não a definição dos critérios de aceite.

## 2. Hierarquia: orquestrador → líderes técnicos → executores

### Planejamento obrigatório da primeira entrega

Antes de iniciar qualquer implementação desta entrega, leia nesta ordem:

1. [Documentação do projeto](docs/PROJECT.md): arquitetura e contrato da API.
2. [Roadmap da primeira entrega](docs/entrega-1/ROADMAP.md): escopo, sequência e marcos.
3. [Referências do design](docs/entrega-1/DESIGN.md): telas 01–07, chaves do
   protótipo, componentes e diferenças entre design e dados disponíveis.
4. [Backlog de US e tarefas](docs/entrega-1/BACKLOG.md): critérios de aceite,
   dependências, propriedade e verificações da tarefa selecionada.
5. [Tracking da entrega](docs/entrega-1/TRACKING.md): estado atual, bloqueios,
   responsável e próximo passo. **Este é o registro canônico do progresso.**

O backlog define o trabalho; o tracking registra sua execução. Planejamento
documentado não equivale a implementação concluída. Respeite os gates e decisões
pendentes: recomendações não são aprovações do usuário, e mock não prova integração.
Use os IDs do backlog em contratos, dispatches, evidências e relatos de handoff.
Consulte também [Gates e decisões](docs/entrega-1/GATES.md), a
[Matriz API × telas](docs/entrega-1/API-TELAS.md) e as
[Perguntas ao backend](docs/entrega-1/PERGUNTAS-BACKEND.md) antes de integrar cada fluxo.

**Atualização obrigatória do tracking:**

- Antes de começar: confira dependências e gates; registre responsável, estado,
  etapa do fluxo, arquivos sob sua propriedade e identidade do dispatch, se houver.
- Durante o trabalho: registre transições de etapa, evidências de testes, bloqueios,
  decisões necessárias e próximo passo. Não espere o encerramento da conversa.
- Ao bloquear: explicite motivo, responsável pela resolução e condição de desbloqueio;
  avance apenas em tarefas independentes liberadas.
- Ao entregar: registre arquivos, comandos reais, códigos de saída, resultados,
  plataformas observadas e limitações; encaminhe à revisão antes de concluir.
- Ao encerrar ou transferir contexto: atualize o próximo passo e o histórico;
  conclusão exige aceite, revisão e verificações aplicáveis, não apenas código escrito.

O orquestrador é o único escritor do tracking em ondas com vários workers;
executores enviam suas atualizações para consolidação imediata. Em execução isolada,
o agente responsável atualiza diretamente. Não permitir edições concorrentes desse
arquivo. Alterações de escopo/dependências precisam atualizar roadmap/backlog e
contratos afetados, preservando IDs e histórico, antes de novos dispatches.

O planejamento não substitui os contratos de implementação em `docs/contracts/`
nem o fluxo de testes antes da implementação. No bootstrap, confirmar versões,
gerenciador e scripts reais; atualizar README e o contexto deste AGENTS com evidências.

A metodologia é agnóstica ao modelo do orquestrador. Astra é uma escolha prevista,
não um requisito. O papel deve continuar funcionando se outro modelo o assumir.

### Orquestrador geral

- Recebe o pedido, mantém o contexto global e conduz discovery e refino.
- Decide escopo, prioridades, orçamento de esforço, dependências e critérios de aceite.
- Aprova contratos e delega frentes substanciais a líderes capazes, como Opus ou Sol.
- Supervisiona líderes, resolve conflitos entre frentes e revisa as entregas integradas.
- Pode ler código, diagnosticar, escrever contratos e metodologia, inspecionar logs
  e executar operações de ambiente/Git autorizadas.
- Não implementa código de produção. Delega testes, implementação e documentação
  de produto. A edição deste AGENTS.md e de contratos é responsabilidade direta permitida.

### Líder técnico de uma frente

Use Opus ou Sol, conforme disponibilidade e capacidade demonstrada para o problema.
O líder recebe uma frente fechada, por exemplo um CRUD, e responde por sua entrega.

- Aprofunda o diagnóstico local sem repetir desnecessariamente o discovery global.
- Refina o contrato da frente e submete mudanças de interface ao orquestrador.
- Divide testes e implementação entre executores com propriedade explícita de arquivos.
- Dispara executores em paralelo quando os escopos são independentes.
- Responde dúvidas, revisa diffs, interpreta falhas e coordena correções e integração.
- Entrega evidências consolidadas ao orquestrador; não repassa apenas alegações dos executores.

### Executores

- Implementam testes ou código dentro de uma lista fechada de arquivos e requisitos.
- Usam Sonnet/Terra para trabalho delimitado com julgamento local, após confirmar
  que o modelo selecionado tem capacidade adequada. Usam Haiku para trabalho mecânico.
- Não ampliam escopo, não alteram contratos por conta própria e não criam outra
  camada de agentes. Escalam dúvidas ao líder.

A profundidade padrão máxima é de três níveis. Tarefas pequenas e determinísticas
podem ir diretamente do orquestrador a um executor barato. Não crie um líder caro
apenas para executar um comando. Frentes grandes devem usar liderança intermediária
e execução paralela onde houver independência real.

## 3. Modelos, ferramentas e esforço

Claude Code e OpenCode são ferramentas de execução; modelo e ferramenta são escolhas
separadas. O projeto prevê Claude Code e OpenCode com modelos Anthropic, além dos
modelos disponíveis no ambiente que atendam aos papéis definidos aqui.

Antes do primeiro dispatch, confirme ferramentas, autenticação, modelos acessíveis
e suporte a delegação. Registre no contrato ou plano da tarefa:

| Campo | Conteúdo obrigatório |
|---|---|
| Papel | Orquestrador, líder ou executor |
| Ferramenta | Claude Code ou OpenCode, conforme disponibilidade real |
| Modelo | Nome e ID exato confirmado no ambiente |
| Esforço | Baixo, médio ou alto, com justificativa |
| Escopo | Entrega, arquivos, dependências e verificações |
| Limites | Concorrência, timeout e orçamento, quando configuráveis |

`Astra`, `Sol` e `Terra` são nomes fornecidos para este fluxo: confirme seu mapeamento
antes de usá-los. Não presuma que sejam IDs válidos, que pertençam à Anthropic ou que
estejam disponíveis em ambas as ferramentas. Também confirme versões/IDs de Opus,
Sonnet e Haiku. Nunca anuncie um modelo que a ferramenta não permite selecionar.

| Classe / modelo de referência | Responsabilidade típica | Esforço inicial |
|---|---|---|
| Orquestrador capaz, como Astra | Discovery global, refino, prioridades e aprovação final | Médio; alto com ambiguidade ou risco |
| Opus / Sol | Liderança de frentes, arquitetura, contratos complexos, desenho de testes e diagnóstico difícil | Médio ou alto |
| Sonnet / Terra | Escrita de testes e implementação com decisões locais e contrato definido | Médio |
| Haiku | Subir projeto, rodar testes/scripts, coletar logs e aplicar mudanças completamente especificadas | Baixo |

Escolha pelo julgamento necessário, não pelo número de arquivos. Antes de cada
dispatch, avalie ambiguidade, risco de erro, alcance das mudanças e facilidade de
verificação. Aplique esforço via flag somente se a ferramenta/modelo suportar;
caso contrário, mantenha-o como orientação registrada, sem inventar flags.

- Executar uma suíte é mecânico; interpretar uma falha desconhecida pode exigir Opus/Sol.
- Escrever testes de regras de negócio exige julgamento; não é automaticamente tarefa de Haiku.
- Terra não deve ser presumido equivalente a Sonnet sem confirmar suas capacidades.
- Se o executor falhar por ambiguidade, refine o contrato antes de repetir.
  Se faltar capacidade, escale o modelo e registre o motivo.
- Não abra quatro executores se dois resolvem o trabalho com menos coordenação.
  Não imponha contagem fixa de modelos nem desperdice paralelismo seguro.

Se a ferramenta não suportar líderes criando executores, o líder devolve as specs
e o grafo de dependências; o orquestrador realiza os dispatches em seu nome, mantendo
a revisão técnica no líder. Se delegação estiver indisponível, informe o bloqueio
e peça autorização para execução direta, sem fingir que houve workers.

### Comandos Orca

Use estes comandos como referência operacional quando Orca estiver disponível:

```bash
# criar o Run (uma vez por objetivo)
orca orchestration run-create --objective "<objetivo>" --json

# criar task (repita por task)
orca orchestration task-create --json \
  --task-title "T1 <titulo curto>" \
  --display-name "T1 <label>" \
  --deps '["task_xxx"]' \
  --spec "<spec completa e auto-contida>"

# disparar worker
orca orchestration worker-start --task <task_id> \
  --worktree current --agent claude --model <haiku|sonnet|opus> \
  --timeout-ms 180000 --json

# esperar mensagens
orca orchestration check --wait --timeout-ms 540000 --json
orca orchestration check --ack <delivery_id> --wait --timeout-ms 540000 --json

# responder pergunta de worker
orca orchestration reply --id <msg_id> --body "<resposta>"

# liberar worker settled
orca orchestration worker-release --dispatch <dispatch_id> --json

# estado
orca orchestration task-list --json
orca orchestration dispatch-show --task <task_id> --json
```

Sempre passe `--timeout-ms 180000` ao executar `worker-start`. O timeout padrão de
60 segundos é insuficiente e pode gerar `agent_prompt_stalled` quando dois workers
sobem juntos. Nesse caso, libere o dispatch morto com `worker-release` e redispare
o worker com `--retry-of <dispatch_id>`, após confirmar que o dispatch está em estado
terminal.

## 4. Fluxo obrigatório e gates

**Receber tarefa → discovery → refino → escrita de contratos → escrita de testes →
implementação → validação de testes.**

Cada etapa produz uma saída verificável. Não pule uma etapa silenciosamente.

| Etapa | Responsável principal | Apoio delegado | Saída / condição para avançar |
|---|---|---|---|
| Receber tarefa | Orquestrador | — | Objetivo, resultado esperado e restrições registrados |
| Discovery | Orquestrador; Opus/Sol para investigação especializada | Haiku coleta resultados de comandos conhecidos | Diagnóstico com evidências e lacunas |
| Refino | Orquestrador + líder Opus/Sol | Usuário decide ambiguidades bloqueantes | Escopo, não objetivos e critérios de aceite testáveis |
| Contratos | Líder Opus/Sol, com aprovação do orquestrador | Sonnet/Terra detalham aspectos locais | Interfaces, invariantes, propriedade de arquivos e dependências aprovadas |
| Escrita de testes | Sonnet/Terra, com revisão do líder | Haiku executa os testes | Testes ligados ao contrato; falha esperada demonstrada quando aplicável |
| Implementação | Sonnet/Terra sob o líder | Haiku aplica alterações determinísticas | Código satisfaz o contrato e é revisado |
| Validação de testes | Líder interpreta; orquestrador aprova | Haiku executa verificações reproduzíveis | Evidências de aprovação, regressões verificadas e limitações explícitas |

### Discovery

Inspecione instruções locais, `git status`, árvore, manifests, lockfiles, scripts,
testes e código relevante. Se existir aplicação, confira seu estado em runtime.
Apresente uma tabela curta de fatos, evidências e impactos antes de propor tasks.
Não transforme hipóteses sobre a stack ou o comportamento em fatos.

### Refino

Defina comportamento esperado, casos de erro, persistência, plataformas-alvo e
limites do trabalho. Faça até 2–3 perguntas focadas por rodada quando a resposta
mudar o resultado e não puder ser inferida; ofereça recomendação justificada.
Resolva decisões bloqueantes antes do dispatch. Descobertas novas reabrem o refino
e bloqueiam apenas as tarefas afetadas.

### Contratos

Guarde contratos em `docs/contracts/<assunto>.md`, criando o diretório quando necessário.
Para várias frentes, mantenha um contrato geral com referências aos contratos locais.
O orquestrador é dono do contrato geral; líderes editam somente o contrato atribuído.
Executores leem os contratos, mas não os alteram.

Cada contrato deve conter:

1. Objetivo, escopo, não objetivos e decisões aprovadas.
2. Comportamento observável e critérios de aceite identificados (ex.: `AC-01`).
3. Interfaces, tipos, validações, erros e regras de persistência, quando aplicáveis.
4. Estados de interface e requisitos de acessibilidade/plataforma, quando aplicáveis.
5. Plano de testes ligando cada critério à sua verificação.
6. Tabela de tarefas, arquivos exclusivos, dependências, modelos e esforço.
7. Comandos reais de validação e evidências exigidas.
8. Pendências, decisões deliberadas e histórico de alterações do contrato.

Contratos podem ser leves para tarefas pequenas. Mudanças incompatíveis exigem
aprovação do orquestrador e comunicação a todos os workers afetados antes de continuar.

### Testes antes da implementação

O líder desenha os cenários e os executores escrevem os testes a partir do contrato,
sem copiar a futura implementação. Cubra caminhos relevantes de sucesso, erro e
limite. Em bugs, crie primeiro uma reprodução automatizada quando viável.

Haiku executa os testes e devolve comando, código de saída e falhas. O líder confirma
que o estado vermelho decorre do comportamento ausente, e não de ambiente quebrado,
imports acidentais ou sintaxe inválida. Registre a evidência antes de liberar a
implementação da frente. No bootstrap, prepare primeiro o runner mínimo aprovado.

Para documentação, alterações puramente operacionais ou comportamento que só pode
ser verificado manualmente, registre a justificativa e uma checagem objetiva no
lugar de criar testes artificiais. Isso não dispensa validação.

### Implementação e validação

Implemente o mínimo necessário para satisfazer os contratos. Não enfraqueça testes,
remova asserts ou adicione skips para obter aprovação. Um teste incorreto pode ser
corrigido com justificativa e revisão do líder contra o contrato.

Após a implementação, execute testes novos e regressões pertinentes; rode lint,
checagem de tipos e build quando existirem e forem aplicáveis. Prefira validação
focada por executor e validação integrada após estabilizar a frente.

Em tarefas mobile, valide no ambiente disponível e registre plataforma e alvo:
Android/iOS, emulador/simulador/dispositivo. Testes unitários ou renderização web não
comprovam funcionamento nativo. Se a máquina não oferecer o alvo necessário, relate
a pendência; não declare um build iOS validado sem evidência.

## 5. Paralelismo, propriedade e supervisão

**Duas tasks só podem escrever em paralelo se seus conjuntos de arquivos forem
disjuntos e suas dependências estiverem satisfeitas.**

- Declare propriedade por caminho, incluindo testes, configuração e lockfiles.
- Arquivos compartilhados têm um único dono por onda; demais tarefas dependem dele.
- Testes devem estar escritos e revisados antes da implementação correspondente.
  Frentes independentes podem estar em etapas diferentes ao mesmo tempo.
- Nomeie um dono da integração para resolver imports, wiring e alterações transversais.
- Só dispare uma task quando suas dependências estiverem concluídas e revisadas.
- Não rode builds, instalações ou processos que disputem artefatos/portas em paralelo.
- O responsável por um worker acompanha sua execução até sucesso, falha ou cancelamento
  confirmado. Timeout não significa que o processo encerrou.

Quando Orca estiver disponível, use sua orquestração supervisionada. Carregue a
referência da versão instalada antes de executar comandos; não copie flags de outro
projeto. Registre run, task, dispatch e dependências. Aguarde a conclusão real,
responda perguntas e revise evidências antes de liberar o worker e reconhecer a entrega.
Um dispatch falho só deve ser liberado/retentado após confirmar seu estado terminal.

Com outra ferramenta, preserve o mesmo protocolo: identidade da tarefa, dependências,
mensagens, resultado terminal, revisão e liberação. Nunca trate uma chamada assíncrona
ou resumo de agente como prova de conclusão.

### Exemplo: CRUD

1. O orquestrador, por exemplo Astra, identifica a necessidade e refina as regras.
2. Delega a liderança a Opus (ou Sol), com objetivo, limites e critérios de aceite.
3. O líder define o contrato e pode planejar dois Sonnet e dois Terra, caso haja
   quatro escopos independentes e capacidade disponível.
4. Na onda de testes, executores escrevem suítes separadas para domínio, persistência,
   formulário e listagem. Haiku executa; o líder revisa os resultados esperados.
5. Na onda de implementação, os quatro executores podem trabalhar nos módulos
   correspondentes após estabilizar interfaces e satisfazer dependências.
6. O dono da integração conecta os módulos. Haiku executa as verificações; Opus/Sol
   interpreta falhas e revisa a frente. O orquestrador revisa a entrega final.

Os números são ilustrativos: a divisão real depende do código, do contrato e da
propriedade de arquivos, não de uma obrigação de ocupar quatro modelos.

## 6. Spec obrigatória de cada task

Todo worker começa sem o contexto da conversa. Entregue uma spec autocontida com:

- Objetivo, papel, ferramenta, modelo confirmado e esforço justificado.
- Contratos e instruções que deve ler antes de editar.
- Diagnóstico existente com evidências; investigar novamente somente lacunas ou contradições.
- Lista fechada de arquivos permitidos e arquivos compartilhados/proibidos.
- Dependências e requisitos numerados ligados aos critérios de aceite.
- Não objetivos e decisões deliberadas que não devem ser “corrigidas”.
- Comandos de verificação confirmados e resultado esperado em cada etapa.
- Critério de parada e situações que exigem pergunta ou escalonamento.
- Formato da entrega: arquivos alterados, resumo, comandos, códigos de saída,
  resultados, limitações e desvios do contrato.

Proibições padrão: não editar fora do escopo; não apagar arquivos nem descartar
trabalho alheio; não fazer commit/push; não adicionar dependências ou executar
instalações sem autorização explícita na spec; não alterar contratos; não mudar
copy factual, regras de negócio ou testes para mascarar falhas.

## 7. Ambiente e Git

- Confirme diretório e comandos antes de agir; no Windows, respeite PowerShell e
  não copie sintaxe Bash como se fosse compatível.
- Use o gerenciador indicado pelo lockfile e scripts reais do projeto. Se ainda
  não existirem, sua escolha faz parte do refino do bootstrap.
- **Build nativo e emulador só com autorização do usuário no momento.** Ele libera
  a máquina (só o Android Studio aberto) antes. Sem essa autorização, avance no que não
  exige compilação nativa e registre a pendência.
- Antes de subir um servidor, confira portas e processos. Registre PID e comando;
  ao encerrar, verifique processos filhos e não mate processos de outro projeto.
- Confirme que o runtime observado corresponde a este repositório. Em conexões
  mobile, considere a diferença entre localhost do computador e do dispositivo.
- Não registre credenciais, tokens ou dados pessoais em contratos, logs ou commits.
- Antes de editar, confira alterações preexistentes. Não faça reset, clean, checkout
  destrutivo ou remoções para obter uma árvore limpa.
- Commit, push e criação de PR exigem pedido explícito do usuário e ficam a cargo
  do orquestrador. Revise status e diff; inclua apenas arquivos da entrega autorizada.

## 8. Definição de pronto e comunicação

Uma frente está pronta quando o contrato foi atendido, o diff foi revisado pelo
líder, os testes/verificações aplicáveis passaram e a integração foi conferida.
O orquestrador revisa a entrega consolidada e suas evidências antes de encerrar.

O relato final deve separar:

1. **O que mudou:** resultado e arquivos relevantes.
2. **O que foi validado:** comandos, resultados e ambiente/plataformas observados.
3. **O que falta:** bloqueios, verificações não executadas e decisões pendentes.

Não afirme que funciona apenas porque um worker disse que funciona. Não declare
validação visual sem ter observado o app. Se causar um problema, diga isso e
registre sua correção ou pendência. Atualize esta metodologia quando fatos novos
do projeto tornarem as instruções desatualizadas.
