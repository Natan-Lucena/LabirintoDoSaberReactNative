# Contrato — Planejamento da primeira entrega

## Objetivo e escopo

Produzir planejamento executável, em português, da primeira entrega frontend mobile:
boilerplate, acesso/login, recuperação, Home, preparação/execução/encerramento de
sessão e Agenda CRUD. Nenhum código da aplicação será implementado nesta tarefa.
Referência técnica obrigatória: [PROJECT.md](../PROJECT.md). Backend externo inalterado.

## Fontes e discovery

- Repositório limpo na inspeção inicial; somente README, AGENTS e documentação.
- Briefing do usuário: telas 01 `senha`, 02 `home`, 03 `homeVazia`, 04 `sessaoAluno`,
  05 `sessaoNome`, 06 `sessaoPlayer`, 07 `agenda`.
- Protótipo: https://claude.ai/design/p/fe9f5a5d-00c3-4254-9797-0fba2801a1f3?file=Labirinto+V4+Mobile+-+Offline.html
- Arquivos referidos pelo usuário: `Labirinto V4 Mobile.dc.html`, versão
  `Labirinto V4 Mobile - Offline.html`, `components/v4/Components.bundle.js` e
  `components/v4/Components.d.ts`. Não presentes no checkout inicial.
- Claude Code autenticado; Orca 1.4.197 ativo, guia da versão consultado.
- Probe real com alias opus confirmou modelo `claude-opus-5-5`.

## Decisões e limites

1. Ordem estrutural: decisões bloqueantes/contratos, boilerplate, componentes e
   infraestrutura, login, Home, seleção do aluno, conteúdo, player/encerramento,
   agenda/integracão e homologação. Frentes independentes podem avançar em paralelo.
2. 02/03 são estados da mesma Home. Login é dependência funcional incluída.
3. Preservar as referências 01–07 e chaves do design em cada US relevante.
4. Não inventar endpoints, campos, métricas ou dados clínicos. `start` recebe
   studentId/name e retorna TaskNotebookSession, não uma lista de tarefas.
5. Explicitar gates de autorização da redefinição, vínculo conteúdo/sessão,
   unidade temporal, reconciliação e diferenças entre campos do design e da API.
6. Não resolver silenciosamente PE versus seleção de aluno, destinos externos
   (Relatórios/Atividades/Alunos/menu/avatar), plataformas de aceite ou acesso ao design.
   Recomendações são propostas, não decisões aprovadas pelo usuário.
7. Planejamento pode ser entregue com tarefas bloqueadas; implementação dessas
   tarefas só é liberada mediante resolução documentada. Separar trabalho pronto
   de trabalho condicionado, sem anunciar tudo como executável imediatamente.
8. Componentes web extraídos são referência visual, não presumidamente reutilizáveis
   em React Native. Tokens exatos do briefing devem ter referência local durável;
   adaptação de escala/acessibilidade exige critério explícito.

## Critérios de aceite

- AC-01: roadmap com escopo, marcos, ordem das telas, dependências e caminho crítico.
- AC-02: US/tarefas com IDs estáveis, propósito, fontes do design, requisitos,
  critérios verificáveis, testes prévios, arquivos exclusivos previstos, dependências,
  esforço/papel e parada/escalonamento. Ownership será confirmado no bootstrap.
- AC-03: tracking separado com todas as tarefas, estado inicial honesto, responsáveis,
  bloqueios, evidências, histórico e protocolo para atualizar antes/durante/depois.
- AC-04: AGENTS torna roadmap, backlog e tracking leitura e atualização obrigatórias.
- AC-05: catálogo de referências do design e matriz API/telas registram lacunas reais;
  informar precisamente o que Claude Code conseguiu acessar.
- AC-06: bootstrap contempla compatibilidade Expo/MMKV/NativeWind, builds nativos,
  scripts reais, testes mínimos, configuração, cache criptografado e SecureStore.
- AC-07: plano de testes cobre falhas de rede, 401, retomada, envio ambíguo, finish antes
  de observation, calendário/fuso, loading/empty/error e acessibilidade celular/tablet.
- AC-08: links locais válidos, IDs e dependências consistentes, diff sem whitespace.

## Verificação

Documentação: não criar testes artificiais. Revisar conteúdo contra briefing/API,
validar links, cobertura de IDs no tracking e grafo de dependências; executar
`git diff --check` e verificação dos arquivos novos. Comandos futuros do aplicativo
devem ser indicados como propostos até o bootstrap confirmá-los.

## Propriedade e execução

| Papel | Ferramenta / modelo | Esforço | Propriedade | Dependências |
|---|---|---|---|---|
| Orquestrador | OpenCode / openai/gpt-6-astra | Alto: conciliar escopo e gates | Este contrato e AGENTS.md | Discovery |
| Líder documental | Claude Code / claude-opus-5-5 | Alto: design, API e decomposição | docs/entrega-1/*.md | Este contrato |

Uma frente documental coesa, um worker no worktree atual; sem instalação, código,
commit ou push. O líder pode executar a documentação diretamente neste escopo
fechado; sem necessidade de outra camada para esta entrega documental.
Timeout inicial 180000 ms, aguardas renováveis; sem orçamento financeiro configurado.
Modelos de futuras implementações deverão ser confirmados no dispatch; não prometer
IDs disponíveis no futuro. Autenticação não comprova acesso ao link privado do design.

## Histórico

- 2026-09-24: contrato inicial aprovado pelo orquestrador para planejamento documental.
- Orquestração: run `run_6b6dd87bc59e`; escrita `task_c312de1f9319` /
  `ctx_3750554e0766`; revisão corretiva `task_eb99cd144228` / `ctx_c7dec7851dc4`.
- Revisão exige ownership explícito da integração, dependências reais de runners e
  providers, tratamento de mutações ambíguas e preservação do encerramento solicitado.
  O planejamento completo não autoriza redução de escopo por gates não resolvidos.
- 2026-09-24: o dispatch `ctx_c7dec7851dc4` parou por limite de uso antes de editar, e o
  orquestrador também parou. A pedido direto do usuário, Claude Code / `claude-opus-5-5`
  aplicou a revisão corretiva em execução direta, sem Orca (exceção registrada no
  TRACKING §7). Mudanças: T-502 como dona da integração do root e edições seriais
  (R-04, R-06, R-10 a R-13); dependências T-106/T-305/T-402; G-16 resolvido pelo
  briefing; G-21 criado; reconciliação de mutações ambíguas; isolamento entre
  educadores; regras 5 e 6 de GATES. 45 tarefas, 21 gates, 15 ondas. A revisão final
  do orquestrador sobre esta versão ainda não foi feita.
