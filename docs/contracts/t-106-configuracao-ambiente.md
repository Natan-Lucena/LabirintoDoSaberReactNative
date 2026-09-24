# T-106 - Configuracao de ambiente

## Objetivo

Implementar a T-106: configurar ambiente Expo e validar a URL da API antes do
uso pelo cliente HTTP. Perfis: desenvolvimento usa backend local e pode aceitar
HTTP; homologacao fica sem URL ate informacao real; producao exige HTTPS.

## Criterios

| ID        | Criterio                                         | Verificacao |
| --------- | ------------------------------------------------ | ----------- |
| AC-106-01 | URL ausente ou invalida falha explicitamente     | UT          |
| AC-106-02 | `.env.example` nao contem segredo nem IP pessoal | REV         |
| AC-106-03 | Homologacao e producao recusam HTTP              | UT + REV    |

Nenhuma URL de homologacao ou IP pessoal pode ser inventado. Nao ha chamada ao
backend, build nativo ou emulador nesta tarefa.

## Interfaces e propriedade

- `app.config.ts`: expoe apenas configuracao publica necessaria para o runtime.
- `src/config/env.ts`: le o ambiente e retorna URL valida ou erro explicito.
- `src/config/__tests__/env.test.ts`: cobre desenvolvimento HTTP, URL ausente/invalida
  e rejeicao de HTTP em homologacao/producao.
- `.env.example`: chaves sem valores sensiveis, usando URL de documentacao quando
  aplicavel e sem IP pessoal.

Executor Terra pode alterar somente `app.config.ts`, `app.json` se a migracao for
necessaria para evitar configuracoes Expo duplicadas, `src/config/**`, `.env.example`
e os testes correspondentes. O orquestrador e dono deste contrato e do TRACKING.

## Validacao e limites

Executar `pnpm run test`, `pnpm run typecheck`, `pnpm run lint`, `git diff --check`
e `python scripts/check-docs.py`. Sem dependencias novas, commit, push, CI, AGENTS,
GATES, backend real ou build nativo. Parar se precisar de campo ou URL nao documentado.

- 2026-09-24: contrato criado apos pedido direto do usuario para iniciar a T-106.
