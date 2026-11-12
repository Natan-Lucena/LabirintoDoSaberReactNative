# Entrega 4 — Pedidos ao backend

> Resumo do que o app precisa do backend na Entrega 4. **Não é contrato**: as rotas, os nomes e
> os formatos são decididos pelo backend e registrados no [PROJECT.md](../PROJECT.md) pela
> API-04 ([BACKLOG](BACKLOG.md)). Escrito em 2026-11-12. **A versão detalhada, com entidades,
> regras de negócio, rotas sugeridas, erros, regras da IA e critérios de aceite, está na
> [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md).**

## 1. O que precisamos, por prioridade

| #   | Prio. | Necessidade                                                                                                                                                        | Telas no app                  | Especificação  |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | -------------- |
| 1   | P0    | **Corrigir a senha:** `update-password` exigir o código do e-mail; troca de senha logado; tokens antigos invalidados                                               | Esqueci a senha, Trocar senha | §2             |
| 2   | P1    | **Evolução da sessão:** registro pós-sessão com critérios (das metas do plano), registro descritivo e atualização das metas; listar e editar; sessões sem evolução | Evolução, Prontuário, ficha   | §3             |
| 3   | P1    | **Escalas:** catálogo de escalas (seed), aplicar com rascunho, escore e faixa calculados no servidor, concluir                                                     | Avaliações, ficha             | §4             |
| 4   | P2    | **IA:** sugestão para a próxima sessão, insight da escala e síntese da anamnese                                                                                    | Evolução, Avaliações, ficha   | §3.6, §4.6, §5 |
| 5   | P2    | **Relatórios:** opções (tipos, seções, períodos), gerar o conteúdo com síntese da IA, histórico, registrar envios                                                  | Relatórios                    | §6             |
| 6   | P3    | **Notificações no app:** geradas por cron diário (atendimentos do dia, evolução pendente, revisão de plano, rascunho parado); contador, lista e marcar como lida   | Sino e lista                  | §7             |
| 7   | P3    | Pequenos: unidade do `timeToAnswer`, sugestão repetida, filtro de datas na agenda, Swagger                                                                         | —                             | §8             |

**Ordem sugerida de publicação (levas):** 1) senha e evolução; 2) escalas; 3) as IAs; 4) relatórios; 5) notificações e pequenos. O app adianta as telas com mocks e integra cada leva
quando ela sair.

## 2. Perguntas para o backend

1. A evolução só pode ser salva depois de finalizar a sessão, ou salvar a evolução deve
   finalizar a sessão?
2. A evolução pode ser editada para sempre, ou trava depois de alguns dias?
3. Durante a aplicação da escala, a faixa parcial deve aparecer, ou só na conclusão?
4. O PDF do relatório fica no app (proposta) ou o backend prefere gerá-lo?
5. O cron diário da Vercel está disponível no plano atual?
6. Quanto tempo leva hoje a geração com IA dos planos em produção?

Também precisamos da resposta às decisões de produto da
[especificação §11](ESPECIFICACAO-BACKEND.md#11-decisões-de-produto-para-confirmar-com-o-backend).

## 3. Mensagem pronta para enviar

> Olá! Começamos a Entrega 4 do app, e ela depende bastante do backend. A especificação completa
> está em `docs/entrega-4/ESPECIFICACAO-BACKEND.md`, com entidades, regras, rotas sugeridas,
> erros e critérios de aceite.
>
> 1. **Urgente, segurança:** o `POST /educator/update-password` troca a senha de qualquer conta
>    só com o e-mail. Ele precisa exigir o código enviado pelo `generate-token`, com validade
>    curta e limite de tentativas. Também precisamos da troca de senha logado (senha atual +
>    nova) e de invalidar os tokens antigos depois da troca.
> 2. **Evolução da sessão:** registro feito depois da sessão, com critérios ligados às metas do
>    plano, registro descritivo e atualização das metas; listar, detalhar, editar e listar as
>    sessões sem evolução.
> 3. **Escalas:** catálogo de escalas cadastrado por seed (a lista de escalas vamos enviar à
>    parte), aplicação com rascunho, escore e faixa calculados no servidor, e conclusão.
> 4. **IA:** sugestão para a próxima sessão, insight da escala e síntese da anamnese.
> 5. **Relatórios:** opções de tipo, seção e período; geração do conteúdo com síntese da IA
>    (o PDF fica no app) e histórico.
> 6. **Notificações dentro do app**, geradas por um cron diário, com contador e lista.
>
> A ordem que mais ajuda é: senha e evolução; escalas; as IAs; relatórios; notificações. A cada
> parte publicada, nos avise quais rotas saíram e o que mudou em relação à proposta. Há também
> algumas perguntas no §2 do resumo (`docs/entrega-4/PEDIDOS-BACKEND.md`).

## 4. Registro das respostas

| Data | Item | Resposta | Onde foi registrada |
| ---- | ---- | -------- | ------------------- |
| —    | —    | —        | —                   |
