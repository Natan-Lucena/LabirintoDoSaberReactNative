# Entrega 5 — Pedidos ao backend

> Resumo do que o app precisa do backend na Entrega 5. **Não é contrato**: as rotas, os nomes e
> os formatos são decididos pelo backend e registrados no [PROJECT.md](../PROJECT.md) pela
> API-06 ([BACKLOG](BACKLOG.md)). Escrito em 2026-11-24. **A versão detalhada, com entidades,
> regras de negócio, rotas sugeridas, erros e critérios de aceite, está na
> [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md).** As decisões de produto G-61 a G-72 ainda
> são propostas; confirme com o usuário antes de enviar.

## 1. O que precisamos, por prioridade

| #   | Prio. | Necessidade                                                                                                                                                                     | Telas no app                       | Especificação |
| --- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------------- |
| 1   | P1    | **Banco de atividades:** três tipos jogáveis novos e o imprimível (com `content`), habilidade, tema, atividades prontas por seed, catálogo paginado e recomendação por paciente | Banco, jogos, editor, imprimível   | §2            |
| 2   | P1    | **Resultado de jogo na sessão:** registrar o resultado e mostrá-lo no contexto da evolução, fora do acerto atual                                                                | Player da sessão, Evolução         | §3            |
| 3   | P1    | **Equipe:** clínica, papéis `ADMIN` e `PROFESSIONAL`, convite por código, cadastro com convite, compartilhar paciente com um colega                                             | Equipe, cadastro, ficha            | §4            |
| 4   | P2    | **Pacientes:** status (ativo ou arquivado), overview com status principal e pendências, `GET /student/:id`                                                                      | Lista de pacientes, ficha          | §5            |
| 5   | P2    | **Agenda:** série semanal ou quinzenal, editar e cancelar "este e os seguintes"                                                                                                 | Novo atendimento, detalhe          | §6            |
| 6   | P2    | **Push:** registrar o token da Expo, enviar um push por dia (sem nome de paciente) e preferências                                                                               | Perfil, notificações               | §7            |
| 7   | P3    | **Central de ajuda:** lista de tutoriais com vídeo                                                                                                                              | Central de ajuda                   | §8            |
| 8   | P3    | Pequenos: apagar campos com `null`, nome na audiência da escola, repetição das notificações, `timeToAnswer` antigo, 404 em vez de 500 nas tarefas, Swagger                      | Editar paciente, plano e atividade | §9            |

**Ordem sugerida de publicação (levas):** 1) atividades e resultado; 2) equipe; 3) pacientes,
recorrência e `null`; 4) push e ajuda; 5) pequenos. O app adianta as telas com mocks e integra
cada leva quando ela sair.

## 2. Perguntas para o backend

1. O que o `POST /appointment/notify` envia hoje (e-mail, WhatsApp, nada)? Isso muda o que o
   app diz sobre "lembretes".
2. A regra de acesso "dono do paciente" está num ponto único do código, ou espalhada por
   domínio? É o que define o tamanho da equipe (§4.6).
3. Quem vai produzir as atividades prontas (seed) e os vídeos da central de ajuda?
4. O projeto já tem conta Expo (EAS) e projeto no Firebase para as credenciais de push?
5. Mudar a resposta de `POST /task/create` de vazio para `201 Task` quebra algum outro cliente?
6. A migração do `timeToAnswer` antigo (×1000) é segura, ou preferem marcar as sessões antigas?

Também precisamos da resposta às decisões de produto da
[especificação §12](ESPECIFICACAO-BACKEND.md#12-decisões-de-produto-para-confirmar-com-o-backend).

## 3. Mensagem pronta para enviar

> Olá! Começamos a planejar a Entrega 5 do app. A especificação completa está em
> `docs/entrega-5/ESPECIFICACAO-BACKEND.md`, com entidades, regras, rotas sugeridas, erros e
> critérios de aceite.
>
> 1. **Banco de atividades:** três tipos jogáveis novos ("Forme a palavra", "Associe as cores" e
>    "Memória visual") e o imprimível, cada um com um `content` próprio; habilidade e tema;
>    atividades prontas por seed, só leitura; catálogo com busca e paginação; recomendação por
>    paciente por regra (sem IA).
> 2. **Resultado de jogo na sessão:** uma rota para registrar o resultado de cada jogo, que
>    aparece no contexto da evolução e fica fora do acerto atual.
> 3. **Equipe:** clínica com papéis (administradora e profissional), convite por código de 8
>    caracteres, cadastro com o código e compartilhamento de paciente com um colega. Isso muda a
>    regra de acesso das rotas clínicas para "dono ou compartilhado".
> 4. **Pacientes:** ativo ou arquivado, status principal e pendências por paciente.
> 5. **Agenda:** atendimentos recorrentes (semanal ou quinzenal).
> 6. **Push:** registrar o token da Expo e mandar um push por dia, sem nome de paciente.
> 7. **Central de ajuda:** lista de tutoriais com vídeo.
>
> A ordem que mais ajuda é: atividades; equipe; pacientes e agenda; push e ajuda; os pequenos
> pedidos. A cada parte publicada, nos avise quais rotas saíram e o que mudou em relação à
> proposta. Há também algumas perguntas no §2 do resumo (`docs/entrega-5/PEDIDOS-BACKEND.md`).

## 4. Registro das respostas

| Data | Item | Resposta | Onde foi registrada |
| ---- | ---- | -------- | ------------------- |
| —    | —    | —        | —                   |
