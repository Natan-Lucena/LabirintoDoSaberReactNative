# Contrato — Documentação do projeto

## Objetivo e escopo

Registrar em `docs/PROJECT.md` a arquitetura mobile e a referência global da API
fornecidas pelo usuário, com link de leitura obrigatória no `AGENTS.md`.
Não implementar o aplicativo, instalar dependências, modificar o backend ou fazer
commit/push. O pedido anterior de publicação já foi concluído e não se estende a esta entrega.

## Discovery e decisões

- Base atual: README com título, AGENTS de metodologia; sem código ou scripts.
- A stack mobile foi definida pelo usuário; não confundir decisão com instalação.
- A API é uma referência externa fornecida pelo usuário. Não foi verificada nesta
  tarefa contra código do backend ou endpoints em produção.
- Usar um documento único com duas partes: arquitetura mobile e referência global
  da API. Preservar contratos, métodos, caminhos, tipos, validações e erros.
- A implementação interna do backend não é escopo deste repositório.
- Observações de sessão só são enviadas após `finish`, conforme API. Um rascunho
  anterior é local; não inventar suporte do servidor.
- Lacunas de integração devem aparecer separadas, sem alterar a referência:
  associação de conteúdo não consta no body de start; unidade de timeToAnswer não
  foi informada; reenvio precisa reconciliar respostas para não duplicar;
  fluxo de token por email não explica como autorizar update-password.

## Critérios de aceite e verificações

- AC-01: documento em português preserva os oito tópicos de arquitetura fornecidos,
  stack completa, organização de código, módulos e requisitos de persistência.
- AC-02: referência inclui todos os 55 pares método/caminho fornecidos, tipos de
  domínio, autenticação, uploads, respostas, validações, erros e resumo de rotas.
- AC-03: AGENTS aponta para o documento e reconhece a stack como definida, ainda
  não implementada. Referência do backend prevalece sobre suposições do cliente.
- AC-04: não afirmar validação do backend ou implementação mobile; sem código,
  dependências ou comandos fictícios. Pendências de integração explícitas.
- AC-05: links relativos resolvem e diff não tem erros de whitespace.

Por ser documentação, testes automatizados de comportamento não se aplicam.
Antes da escrita, revisar estes critérios. Depois, conferir manualmente conteúdo
contra o briefing, contar os 55 endpoints no apêndice, resolver links locais e
executar `git diff --check` (para novos arquivos, também diff no-index contra NUL).
Nenhum servidor, build ou teste mobile se aplica à base atual.

## Propriedade, ferramentas e esforço

| Tarefa | Responsável / ferramenta / modelo | Esforço | Arquivos exclusivos | Dependências |
|---|---|---|---|---|
| Discovery, contrato, referência e revisão integrada | Orquestrador / OpenCode / openai/gpt-6-astra | Médio: coerência com regras locais | AGENTS.md e este contrato | Nenhuma |
| Escrever e verificar documento de produto | Executor / Claude Code / claude-sonnet-5 | Médio: preservar contratos extensos sem inventar detalhes | docs/PROJECT.md | Contrato aprovado e briefing entregue |
| Aplicar correções da revisão | Mesmo executor / Claude Code / claude-sonnet-5 | Baixo: ajustes especificados; reutilização evita novo contexto e inicialização | docs/PROJECT.md | Documento entregue e revisado |

Claude Code 2.1.281 autenticado e chamada com alias sonnet concluída: modelUsage
confirmou `claude-sonnet-5`. Orca 1.4.197 disponível; guia instalado consultado.
Uma única frente documental, um executor supervisionado no worktree atual.
Não há necessidade de líder intermediário ou paralelismo de executores.
Timeout de inicialização: 180000 ms; aguardar conclusão real em janelas renováveis.
Esforço é orientação; não aplicar flag não confirmada. Sem orçamento configurado.

## Histórico

- Contrato aprovado pelo orquestrador para o pedido de documentação do projeto.
- Briefing de conteúdo enviado ao executor como insumo de transcrição; o documento
  final versionado será a referência permanente, junto deste contrato de entrega.
- Orquestração: run `run_b5f53bafe936`; escrita `task_e3584abe1914` /
  `ctx_a3cda17b3145`; revisão corretiva `task_5529f50d6447` / `ctx_704810a47ee1`.
- Revisão: não inferir atomicidade de batch a partir de validação prévia, não
  restringir origem de mídia ao upload-media e manter requisito de criptografia
  como persistência. Lacunas identificadas na conciliação não são decisões do usuário.
- Ajuste editorial final: `task_659d3718a03a` / `ctx_19aba2883798`, mesmo executor
  e propriedade; removida declaração de task incompatível com a entrega integrada.
- Validação integrada: leitura integral do documento e revisão das correções;
  índice e link em AGENTS conferidos. `git diff --check` e verificações no-index
  dos arquivos novos sem erros de whitespace (somente aviso LF/CRLF).
  `git grep --no-index -c -E '^#### ' -- docs/PROJECT.md` e
  `git grep --no-index -c -E '^\| [0-9]+ \|' -- docs/PROJECT.md` retornaram 55
  cada (código 0). Usado Git para contagem porque `rg` não estava no PATH.
  Worker concluído, revisado e liberado; sem validação contra backend ou runtime mobile.
