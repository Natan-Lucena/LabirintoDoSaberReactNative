# API-06 — Contrato da Entrega 5 no PROJECT.md

> Refino da ficha [API-06 do BACKLOG](../BACKLOG.md#api-06--contrato-da-entrega-5-no-projectmd),
> escrito em 2026-11-24. Plano da entrega em [PLANO](../PLANO.md). Modelo: o
> [BACKEND-ENTREGUE da Entrega 4](../../entrega-4/BACKEND-ENTREGUE.md).

| Campo           | Valor                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Onda            | Uma vez por leva do backend (levas 1 a 5)                                                                                |
| Classe / modelo | A — orquestrador (Opus); a escrita dos docs é commitada por um worker barato (o orquestrador não commita)                |
| Estimativa      | P · 1,5 h por leva (6 h na entrega)                                                                                      |
| Dependências    | A leva publicada no Swagger (`https://labirinto-do-saber.vercel.app/api-docs/`) e o aviso do backend                     |
| Backend         | É a própria integração                                                                                                   |
| Dona nesta onda | `docs/PROJECT.md` (Parte II, bloco "Entrega 5"), `docs/entrega-5/BACKEND-ENTREGUE.md` (novo), os cards e fichas afetados |
| Libera          | A segunda passada da API-07 e a integração das telas da leva                                                             |

## 1. Objetivo e valor

Transformar a proposta da especificação em **contrato registrado**: o app só implementa rota que
está no `PROJECT.md` (BACKLOG §1). Sem isso, o worker de tela adivinha campo e erro, que é a
causa mais comum de retrabalho (lições de 2026-10-09 no CONTEXTO-SESSAO §7).

## 2. Fluxo (por leva)

1. Ler o aviso do backend e o Swagger; listar as rotas da leva.
2. Conferir cada rota contra a especificação: método, caminho, autenticação, corpo, resposta,
   códigos de erro e o formato do erro (`{ message }` ou `{ message, errors[] }`, com `field` em
   primeiro nível ou caminho completo).
3. Chamar as rotas de leitura com uma conta de teste e dados fictícios, quando possível, e
   anotar o que diverge do Swagger (a Entrega 4 teve diferenças só visíveis na chamada real).
4. Registrar no `PROJECT.md` (Parte II, bloco "Entrega 5") cada rota com corpo, resposta e erros.
5. Registrar no `docs/entrega-5/BACKEND-ENTREGUE.md` o resumo da leva, as diferenças em relação à
   especificação e os pontos em aberto (mesmas seções do da Entrega 4).
6. Ajustar os cards afetados (seção "Contrato de dados" e "Riscos") e as fichas do BACKLOG;
   registrar no TRACKING.
7. Disparar a segunda passada da API-07 com a lista de diferenças.

## 3. Pontos que esta tarefa precisa fechar com o backend

| Leva | Ponto                                                                                                   | Card    |
| ---- | ------------------------------------------------------------------------------------------------------- | ------- |
| 1    | Se `Task` passa a trazer sempre `format`, `source`, `skills`, `tone` (para tirar o opcional dos tipos)  | API-07  |
| 1    | Formato de `content` e `skills` no multipart do `POST /task/create`; resposta `201 Task` ou vazia       | ATV-11  |
| 1    | `field` dos erros de `INVALID_CONTENT`: caminho completo (`content.pairs.2.word`) ou só `content`       | ATV-11  |
| 1    | Se a listagem de sessões traz `activityResults` (RS-07)                                                 | EVO-03  |
| 1    | Semântica de `correct` (o app usa "completou sem erro")                                                 | ATV-04a |
| 3    | Nomes dos campos do plano no PP-05: `nextReviewDate` e `professionalNotes` (a especificação diz outros) | FEC-06  |
| 3    | Como o "apagar" (`null`) chega no `PUT /student/update/:id`, que é multipart                            | FEC-06  |

## 4. Critérios de aceite

| ID           | Critério                                                                                         | Verif. |
| ------------ | ------------------------------------------------------------------------------------------------ | ------ |
| AC-API-06-01 | Toda rota que um card usa está no `PROJECT.md`, com corpo, resposta e erros                      | `REV`  |
| AC-API-06-02 | Cada diferença entre a especificação e o entregue está registrada e refletida nos cards e fichas | `REV`  |
| AC-API-06-03 | `python scripts/check-docs.py` sai com código 0                                                  | `CMD`  |

## 5. Como testar manualmente (Victor)

Não se aplica.

## 6. Riscos e perguntas em aberto

- Leva publicada sem aviso: o orquestrador confere o Swagger no início de cada onda que depende
  do backend.
- Swagger incompleto (já aconteceu): vale a chamada real; a diferença vai para o
  `BACKEND-ENTREGUE.md`.

## 7. Fora do escopo

Código do app; decidir regra de negócio no lugar do backend (o app segue o contrato,
especificação §13).
