# T-303 - MMKV criptografado e persistência de cache

## Objetivo

Expor uma instância MMKV criptografada por educador, com chave gerada e
guardada no SecureStore, e a política de limpeza de G-04 (logout, expiração de
sessão, troca de educador), sem implementar comportamento nesta fase (fase
vermelha: contrato + testes + stubs sem comportamento). A ligação do
persister do TanStack Query (T-304) fica pendente de decisão sobre nova
dependência (ver "Pendências").

## Decisões aprovadas (G-04)

- Chave de criptografia (32 bytes) gerada aleatoriamente no primeiro uso e
  guardada no SecureStore; reaproveitada nas aberturas seguintes.
- Todo dado persistido (cache de queries e fluxo de sessão em andamento) fica
  associado ao `educatorId` que o gravou (instância MMKV por `educatorId`,
  não uma instância global).
- `reason: "logout"` apaga o cache de queries **e** o armazenamento do fluxo
  de sessão do educador atual. A confirmação de sessão em andamento antes de
  descartar é responsabilidade da T-701 (UI); esta tarefa só executa a
  limpeza quando o evento chega.
- `reason: "sessionExpired"` apaga apenas o cache de queries; preserva o
  armazenamento do fluxo de sessão em andamento do **mesmo** educador, para
  retomada após novo login.
- Troca de educador (`activateEducator` com um `educatorId` diferente do
  atual) apaga **todos** os dados persistidos do educador anterior antes de
  qualquer leitura do novo. Invariante: nenhuma troca de conta expõe cache ou
  sessão de outro educador.
- `educatorId` não vem da API nesta entrega (T-401 ainda vai carregar
  `GET /educator/me`); esta tarefa expõe uma função explícita para
  ativar/definir o educador atual, sem inventar chamada de rede.

## Critérios

| ID        | Resultado                                                                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-303-01 | Instância é criada com chave de criptografia vinda do SecureStore (gerada no primeiro uso, reaproveitada depois). — `UT`                                              |
| AC-303-02 | `logout` e `sessionExpired` limpam exatamente o que G-04 determina para cada evento (ver "Decisões aprovadas"). — `UT`                                                |
| AC-303-03 | Inspeção do arquivo MMKV em aparelho não mostra nomes de alunos em texto puro. — `MAN` (pendente de build autorizado; não verificável em teste unitário)              |
| AC-303-04 | Isolamento entre contas: ativar um `educatorId` diferente apaga tudo do anterior antes de qualquer leitura; nenhum cache/sessão do anterior é lido ou exibido. — `UT` |

## Interfaces

### `src/storage/encryption-key.ts`

- `getOrCreateEncryptionKey(): Promise<string>` — lê a chave do SecureStore
  (chave própria: `"labirinto.mmkv.encryptionKey"`); se ausente, gera 32
  bytes com `Crypto.getRandomBytesAsync(32)` de `expo-crypto` (**G-27**,
  autorizado pelo usuário em 2026-09-24: RN 0.86.3/Hermes não expõe
  `globalThis.crypto.getRandomValues` nem qualquer gerador criptográfico sem
  dependência nova; verificado em `node_modules` antes de perguntar), codifica
  em hex e grava via `SecureStore.setItemAsync` antes de retornar. Nunca usa
  `Math.random`. Falha do gerador propaga o erro (não cai para um gerador
  inseguro).
- Falha do SecureStore (leitura ou escrita) propaga o erro; não é engolida.

### `src/storage/mmkv.ts`

- `getStorage(educatorId: string): Promise<MMKV>` — retorna (criando se
  necessário) a instância MMKV do `educatorId`, com
  `id: \`labirinto.${educatorId}\``, `encryptionKey`de`getOrCreateEncryptionKey()`e`encryptionType: "AES-256"`. Instâncias são
mantidas em cache por `educatorId` no módulo (não recriam a cada chamada).
- `activateEducator(educatorId: string): Promise<MMKV>` — se o `educatorId`
  ativo (controlado internamente pelo módulo) for diferente do informado,
  apaga (`clearAll`/exclusão do arquivo) todos os dados MMKV do educador
  anterior **antes** de criar/retornar a instância do novo. Define o novo
  `educatorId` como ativo. Se for o mesmo já ativo, apenas retorna a
  instância existente sem apagar nada.
- `getActiveEducatorId(): string | null` — id atualmente ativo, ou `null` se
  nenhum foi ativado ainda.
- `clearQueryCache(educatorId: string): Promise<void>` — apaga somente as
  chaves de cache de queries (prefixo `query:`, ver "Convenção de chaves")
  da instância do `educatorId`; não apaga o armazenamento do fluxo de sessão.
- `clearSessionFlow(educatorId: string): Promise<void>` — apaga somente as
  chaves do fluxo de sessão em andamento (prefixo `session:`) da instância do
  `educatorId`.
- `clearAllForEducator(educatorId: string): Promise<void>` — apaga toda a
  instância do `educatorId` (usado na troca de conta e no logout).
- `connectStorageToAuth(): () => void` — assina `subscribeAuthCleared` (de
  `src/stores/auth.ts`, sem alterá-lo) e, ao receber `{ reason: "logout" }`,
  chama `clearAllForEducator(getActiveEducatorId())`; ao receber
  `{ reason: "sessionExpired" }`, chama apenas
  `clearQueryCache(getActiveEducatorId())`. Se não houver educador ativo, não
  faz nada. Retorna a função de cancelamento de `subscribeAuthCleared`. Esta
  tarefa **não** chama `connectStorageToAuth()` no root do app — isso é da
  T-502 (composição do `BootGate`), que decide quando conectar cada módulo.

### Convenção de chaves de cache (PROJECT §7)

- Chaves de cache de queries seguem `query:<recurso>:<id>` (ex.:
  `query:student:abc123`, `query:educator:me`).
- Chaves do fluxo de sessão em andamento seguem `session:<notebookSessionId>`.
- `clearQueryCache`/`clearSessionFlow` filtram por esses prefixos usando
  `MMKV.getAllKeys()`.

### `src/api/query-persister.ts` — **não criado nesta fase**

Ver "Pendências": exigiria pacote novo (`@tanstack/query-async-storage-persister`
ou `@tanstack/query-sync-storage-persister` + adaptador para MMKV), fora do
permitido sem autorização. T-304 depende desta decisão.

## Erros cobertos nos testes

- `getOrCreateEncryptionKey`: `SecureStore.getItemAsync`/`setItemAsync`
  rejeitando devem propagar o erro (não retornar chave vazia/fixa).
- `getStorage`/`activateEducator`: ausência de chave (erro do módulo de
  chave) propaga; nenhuma instância MMKV é criada com chave vazia.

## Plano de testes

- `src/storage/__tests__/encryption-key.test.ts`: gera na primeira chamada e
  grava no SecureStore (AC-303-01); reaproveita chave existente na segunda
  chamada, sem gravar de novo; propaga erro de leitura/escrita do
  SecureStore.
- `src/storage/__tests__/mmkv.test.ts`: cria instância com `encryptionKey`
  vinda do módulo de chave (AC-303-01); `logout` limpa cache de queries e
  sessão do educador atual (AC-303-02); `sessionExpired` limpa só o cache de
  queries e preserva sessão (AC-303-02); `activateEducator` com id diferente
  apaga tudo do anterior antes de expor o novo, e chamadas de leitura após a
  troca não retornam dados do educador anterior (AC-303-04); mesmo
  `educatorId` não apaga nada; erro de `getOrCreateEncryptionKey` propaga;
  `connectStorageToAuth()` chama a limpeza certa para `logout` e
  `sessionExpired` do educador ativo, e `unsubscribe()` cancela a assinatura
  (AC-303-02).

## Tabela de tarefas

| Arquivo                                        | Dono            | Depende de                        |
| ---------------------------------------------- | --------------- | --------------------------------- |
| `src/storage/encryption-key.ts`                | Executor Sonnet | T-104 (mock Nitro), G-04          |
| `src/storage/mmkv.ts`                          | Executor Sonnet | encryption-key.ts, T-302 (evento) |
| `src/storage/__tests__/encryption-key.test.ts` | Executor Sonnet | —                                 |
| `src/storage/__tests__/mmkv.test.ts`           | Executor Sonnet | —                                 |

Modelo/esforço: Sonnet, médio-alto (classe C, dados sensíveis), fase 1 e 2 no
mesmo executor (tarefa fechada e coesa).

## Comandos de validação

- Fase 1: `pnpm exec vitest run src/storage/__tests__` (esperado: falhas
  "not implemented"); `pnpm run typecheck` (esperado: 0).
- Fase 2: os mesmos testes (esperado: verde); `pnpm run test`;
  `pnpm run typecheck`; `pnpm run lint`; `pnpm exec prettier --check` nos
  arquivos tocados; `python scripts/check-docs.py`; `git diff --check`.

## Limites

Fase 1: `mmkv.ts` e `encryption-key.ts` continham apenas assinaturas e stubs
que lançavam `Error("not implemented")`. Fase 2: implementação real,
incluindo `connectStorageToAuth()` (item 1 aprovado pelo orquestrador) e
geração de chave via `expo-crypto` (G-27, item 2 aprovado). `query-persister.ts`
não foi criado (ver "Pendências", item 3 aprovado: segue sem ele nesta
tarefa).

Executor pode editar: `docs/contracts/t-303-mmkv-criptografado.md`;
`src/storage/**`; `src/api/query-persister.ts`;
`src/api/__tests__/query-persister.test.ts`; `docs/entrega-1/TRACKING.md`;
`package.json`/`pnpm-lock.yaml` (só para `expo-crypto`, G-27);
`docs/bootstrap/COMPATIBILIDADE.md` (autorizado pelo orquestrador para
registrar G-27 e A-20). Proibido: alterar `src/stores/auth.ts` (só assinar
`subscribeAuthCleared`); outros contratos; AGENTS/BACKLOG/GATES; instalar
qualquer outra dependência sem autorização; commit/push; backend real; dados
reais de crianças.

## Pendências

- **Decisão do usuário: adicionar `@tanstack/react-query-persist-client` +
  `@tanstack/query-sync-storage-persister`; afeta T-304.** O persister do
  TanStack Query para MMKV exige um desses pacotes, não instalados por esta
  tarefa (fora da autorização inicial). `src/api/query-persister.ts` não foi
  criado. Confirmado com o orquestrador/usuário na fase 1; a instalação e a
  criação do persister ficam para a T-304 (ou uma repactuação explícita desta
  tarefa, se o usuário preferir).
- AC-303-03 (inspeção em aparelho) só pode ser verificado com build nativo
  autorizado; registrado como pendente, não simulado em teste unitário.
- **G-27 (resolvido):** usuário autorizou `expo-crypto` (~57.0.3) para gerar
  a chave AES-256 do MMKV via `getRandomBytesAsync`, após confirmar que
  RN 0.86.3/Hermes não expõe nenhuma fonte criptográfica de bytes aleatórios
  sem dependência nova. Registrado em `docs/bootstrap/COMPATIBILIDADE.md` §3
  e §4.
- **A-20 (achado, `docs/bootstrap/COMPATIBILIDADE.md`):** o preset automático
  de `vitest-native` para `react-native-mmkv` expõe `delete()`, não
  `remove()` (API real usada em produção). Os testes desta tarefa usam
  `vi.mock("react-native-mmkv", ...)` local com uma instância compatível com
  a API real, em vez do preset. Registrar o mesmo cuidado em tarefas futuras
  que testem `remove()`/`delete()` do MMKV.

## Histórico

- 2026-09-24: contrato criado pelo executor Sonnet para a fase 1 (contrato +
  testes + vermelho) da T-303, após leitura de AGENTS §4/§6, BACKLOG (T-303),
  GATES G-04, COMPATIBILIDADE.md (A-13, §3), contrato T-302, `src/stores/auth.ts`,
  `src/test-utils/{mocks.ts,README.md}` e contrato T-305 (formato).
- 2026-09-24: vermelho aprovado pelo orquestrador com 3 ajustes: (1)
  `connectStorageToAuth()` ligando a `subscribeAuthCleared`; (2) chave gerada
  com gerador criptográfico real, nunca `Math.random`, escalado para G-27
  após confirmar ausência de fonte segura sem dependência nova; (3) persister
  segue sem ser criado, pendência registrada como decisão do usuário. Fase 2
  implementada: `expo-crypto` instalado (G-27); 15/15 testes verdes;
  `typecheck` 0. Achado A-20 (preset `vitest-native` de MMKV usa `delete`, não
  `remove`) registrado em `docs/bootstrap/COMPATIBILIDADE.md`.
