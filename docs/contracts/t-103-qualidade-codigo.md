# T-103 - Qualidade de codigo

## Objetivo e escopo

Configurar ESLint, Prettier, Husky e lint-staged para a base Expo existente. Esta
tarefa implementa somente a T-103 do [BACKLOG](../entrega-1/BACKLOG.md#t-103--qualidade-de-código).
O usuario autorizou este contrato e a instalacao em 2026-09-24.

Fora do escopo: alterar CI, codigo de produto, regras de lint fora da configuracao
padrao Expo, build nativo e formatacao massiva de arquivos existentes.

## Criterios e comportamento

| ID        | Criterio                                                                                          | Verificacao                                            |
| --------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| AC-103-01 | `pnpm run lint` passa na base                                                                     | comando com codigo 0                                   |
| AC-103-02 | O pre-commit roda lint-staged em arquivo alterado em repositorio temporario, nunca neste checkout | comando com codigo 0 e evidencia do arquivo temporario |

Por se tratar de configuracao operacional, a checagem objetiva acima substitui o
vermelho de comportamento. O hook deve executar `pnpm exec lint-staged`; lint-staged
deve aplicar ESLint aos arquivos JS/TS e Prettier aos formatos textuais pertinentes.
`lint` usa a configuracao ESLint do Expo e `format` formata os arquivos rastreados
aplicaveis. O hook nao deve criar commit nem alterar o repositorio principal durante
sua verificacao.

## Interfaces, versoes e limites

- Instalar como devDependencies: `eslint-config-expo@57.0.2`, `eslint@10.11.0`,
  `prettier@3.9.9`, `husky@9.1.7` e `lint-staged@17.5.1`, conforme
  [COMPATIBILIDADE](../bootstrap/COMPATIBILIDADE.md#3-versões-validadas). O usuario
  autorizou ainda uma dependencia direta `eslint-plugin-react` em versao compativel
  comprovada com ESLint 10, devido a incompatibilidade transitiva observada.
- Usar a configuracao flat compativel com `eslint-config-expo`; nao inventar regras
  de produto nem desligar regras para ocultar falhas.
- Prettier define apenas convencoes gerais e ignora artefatos gerados/dependencias.
- A instalacao e exclusiva desta frente: R-01 permanece reservado ate a revisao.

## Propriedade e execucao

| Papel/modelo                                 | Esforco                             | Arquivos exclusivos                                                                                                              | Dependencia               |
| -------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Orquestrador OpenCode `openai/gpt-5.6-terra` | Medio; contrato, rastreio e revisao | Este contrato, `docs/entrega-1/TRACKING.md`                                                                                      | Autorizacao recebida      |
| Executor OpenCode `openai/gpt-5.6-terra`     | Baixo; receita delimitada           | `package.json`, `pnpm-lock.yaml`, `eslint.config.*`, `prettier.config.*`, `.prettierignore`, `lint-staged.config.*`, `.husky/**` | Contrato e R-01 reservada |

Run Orca: `run_d6c5eaec5c9b`. Nenhum arquivo fora da lista pode ser alterado. Sem
commit, push, alteracao de CI, contratos ou TRACKING pelo executor. Sem instalacoes
concorrentes, build nativo, emulador ou subagentes.

## Validacao e entrega

Executar, em sequencia: instalacao com pnpm, `pnpm run lint`, `pnpm run format`,
`pnpm run typecheck`, `pnpm run test`, a verificacao do hook em repositorio temporario
saida, evidencia do hook e limitacoes. O orquestrador revisa o diff, atualiza o
TRACKING e abre um PR proprio; a conclusao depende do merge do usuario.

## Paradas e historico

Parar e escalar se a receita exigir outra versao/dependencia, arquivo fora da
propriedade, duas falhas pelo mesmo motivo ou enfraquecimento das regras. Nao editar
`AGENTS.md`, decisoes de GATES ou o CI.

- 2026-09-24: contrato criado pelo orquestrador apos autorizacao explicita do usuario.
- 2026-09-24: `.husky/_` e a ativacao local de `core.hooksPath` liberados, pois Husky 9 os exige para o pre-commit autorizado.
- 2026-09-24: usuario autorizou atualizar diretamente `eslint-plugin-react` para uma versao compativel com ESLint 10; nenhuma outra dependencia e liberada.
- 2026-09-24: registry confirmou que `eslint-plugin-react@7.37.5` (stable) e `7.8.0-rc.0` (`next`) nao suportam ESLint 10. A tarefa aguarda autorizacao para alterar a versao do ESLint.
