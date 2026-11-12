# Entrega 4 — Roadmap

> Planejamento escrito em 2026-11-12 pelo orquestrador, depois da apresentação da Entrega 3, a
> partir do estado da `main` (`af3aa39`, PR #150) e dos documentos de produto: o
> [BACKLOG da Entrega 2](../entrega-2/BACKLOG.md) (mapa completo do design) e o
> [ESCOPO da Entrega 3](../entrega-3/ESCOPO-ENTREGA-3.md). As tarefas estão no
> [BACKLOG](BACKLOG.md), o progresso no [TRACKING](TRACKING.md) e o que o backend precisa
> construir na [ESPECIFICACAO-BACKEND](ESPECIFICACAO-BACKEND.md) (resumo em
> [PEDIDOS-BACKEND](PEDIDOS-BACKEND.md)). Este documento não marca nenhuma implementação como
> pronta.

## 1. Objetivo

Fechar o **ciclo clínico** do app, que hoje termina quando a sessão acaba:

```
atendimento → sessão → evolução → prontuário → avaliação → plano → relatório
```

A Entrega 3 entregou a agenda, o paciente e os planos. Faltam o que acontece **depois da
sessão** (evolução e prontuário), a **avaliação** com escalas e o **documento** para a família e
a escola (relatórios). A Entrega 4 também corrige a **senha**, que tem uma falha de segurança no
backend, e acrescenta as **notificações** dentro do app.

Proposta do orquestrador (G-54, a confirmar pelo usuário):

- entram quatro domínios novos do backend: **Evolução, Avaliações, Relatórios e Notificações**;
- entra a **senha** (recuperação com código e troca no perfil), que estava fora desde a
  Entrega 1 (G-05, G-49);
- ficam para depois: Equipe, Central de ajuda, atividades jogáveis e imprimíveis, WhatsApp
  automático, push e recorrência de atendimentos.

## 2. Ponto de partida (evidência em 2026-11-12)

| Fato                                                                                                                | Evidência                                                                     |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| As 23 tarefas de código da Entrega 3 e a rodada de correções estão na `main`; a Entrega 3 foi apresentada           | PRs #78 a #150; [ESCOPO-ENTREGA-3](../entrega-3/ESCOPO-ENTREGA-3.md)          |
| Do mapa do produto (68 itens), faltam 18 funcionalidades e 3 validações                                             | [BACKLOG da Entrega 2](../entrega-2/BACKLOG.md); TRACKING das Entregas 2 e 3  |
| Depois de finalizar a sessão, o app só pede uma **observação** de texto (`POST …/observation`)                      | `app/session/finish.tsx`; passo `awaitingObservation` em `session-flow.ts`    |
| A ficha mostra "Evolução recente" com o **acerto das sessões**, não com registros de evolução                       | `PatientDetailScreen.tsx` (seção "Evolução recente")                          |
| A ficha tem só as abas "Visão geral" e "Planos"; não há "Avaliações"                                                | `PatientDetailScreen.tsx`                                                     |
| "Evolução da sessão", "Avaliações e escalas", "Equipe" e "Central de ajuda" levam a "Em breve" em Recursos          | `ResourcesScreen.tsx`                                                         |
| "Aplicar escala" no Acesso rápido da Início leva a "Em breve"                                                       | `HomeScreen.tsx`                                                              |
| Os relatórios atuais são **da V1**: relatório da sessão e análise do aluno, com PDF gerado no aparelho              | `app/reports`, `src/features/reports/**`; G-34, G-45                          |
| `POST /educator/update-password` é público e troca a senha só com o e-mail; a troca logada não existe               | [PROJECT.md](../PROJECT.md#post-educatorupdate-password); BACKEND-ENTREGUE §8 |
| Planos (PDI e PE) com metas e estados existem no backend e no app: os **critérios da evolução** podem vir das metas | [BACKEND-ENTREGUE](../entrega-3/BACKEND-ENTREGUE.md) §3                       |
| Nenhuma rota de evolução, escala, relatório configurável ou notificação existe no contrato                          | [PROJECT.md](../PROJECT.md) (Parte II) e Swagger                              |
| O registro do contrato de planos no `PROJECT.md` (PLN-00) ficou pendente na Entrega 3, a pedido do usuário          | [TRACKING da Entrega 3](../entrega-3/TRACKING.md)                             |
| `expo-print`, `expo-sharing` e `expo-file-system` já estão instalados; `expo-notifications` e `expo-video` não      | `package.json`                                                                |
| O push remoto não funciona no Expo Go no Android desde o SDK 53; o app roda no Expo Go (G-41)                       | Documentação do Expo; G-41                                                    |
| Defeitos conhecidos sem correção: E-09, E-11, destaque da Início e da Agenda; decisão pendente sobre E-10           | Revisão da Entrega 3 (issue #129)                                             |

## 3. Escopo

### 3.1 Dentro

| Bloco                        | Tarefas                                                | Resultado                                                                                 |
| ---------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| A — Base, conta e pendências | API-04, API-05, FEC-05, AUT-01, REC-03                 | Contrato registrado; tipos e mocks do backend novo; pendências da Entrega 3; senha segura |
| B — Evolução da sessão       | EVO-01, EVO-02, EVO-04, EVO-05                         | Registrar a evolução após a sessão, ver o prontuário e a sugestão da IA                   |
| C — Avaliações e escalas     | AVA-01, AVA-02, AVA-03, AVA-04, AVA-05, PAC-05, PAC-09 | Aplicar escalas com escore e insight; aba Avaliações e síntese da anamnese na ficha       |
| D — Relatórios               | REL-01, REL-02, REL-03                                 | Configurar, gerar o PDF, imprimir, enviar e reabrir relatórios                            |
| E — Notificações e navegação | NOT-01, NAV-04                                         | Sino com contador e lista; Recursos e Início sem "Em breve" nos domínios entregues        |
| F — Qualidade                | QA-07, QA-02, QA-03, QA-04                             | Roteiro manual, E2E com Maestro, acessibilidade e aparelhos                               |

**25 tarefas**: 21 de desenvolvimento e 4 de qualidade. A Entrega 3 teve 27, sendo 23 de
desenvolvimento e 4 de validação. O detalhe de cada uma está no [BACKLOG §4](BACKLOG.md#4-tarefas).

IDs novos: API-04, API-05, FEC-05, AUT-01, REC-03, EVO-04, EVO-05, PAC-09, NAV-04 e QA-07. Os
demais vêm do mapa da Entrega 2 e mantêm o ID.

### 3.2 Fora (não objetivos)

- **Equipe e convites** (EQP-01, EQP-02): exige mudar o modelo para clínica com vários
  educadores e papéis; é uma entrega à parte.
- **Central de ajuda** (AJD-01): depende de conteúdo (vídeos e tutoriais) que ainda não existe e
  de `expo-video`.
- **Atividades jogáveis e imprimíveis** (ATV-04, ATV-05) e o **resultado de atividade durante a
  sessão** (EVO-03): exigem tipos novos de tarefa no backend.
- **Push** (parte do NOT-01): exige development build (G-59).
- **WhatsApp automático**, **"Confirmar por WhatsApp"**, **recorrência** e **visão mensal** da
  agenda.
- **Escalas criadas pelo educador**: o catálogo é do backend (G-55).
- **Development build / EAS**: o app continua no Expo Go (G-41), salvo na homologação iOS
  (QA-04).

## 4. Telas

| Tipo      | Telas                                                                                                                                                       | Qtd. |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Novas     | Evolução da sessão, Evolução (hub com pendentes e recentes), Prontuário do paciente, Detalhe da evolução                                                    | 4    |
| Novas     | Avaliações (hub), Aplicar escala (com escore e insight), Resultado da aplicação                                                                             | 3    |
| Novas     | Relatórios (configurar e prévia), Histórico de relatórios, Síntese da anamnese, Notificações, Trocar senha                                                  | 5    |
| Alteradas | Fim da sessão (leva à Evolução), Ficha do paciente (aba Avaliações, "Evolução recente"), Início (sino, "Aplicar escala"), Recursos, Esqueci a senha, Perfil | 6    |
| Removidas | Relatórios da V1 no menu de Recursos (substituídos; o relatório da sessão continua acessível pela sessão)                                                   | ~1   |

**Total de telas novas: 12**, o mesmo número da Entrega 3.

## 5. Decisões

Propostas do orquestrador, **a confirmar pelo usuário** antes dos dispatches afetados. O texto
completo, com as alternativas, está no [GATES](../entrega-1/GATES.md).

| Gate | Decisão proposta                                                                                                                                               | Bloqueia                | Estado   |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------- |
| G-54 | Escopo da Entrega 4: Evolução, Avaliações, Relatórios, Notificações no app e senha; Equipe, Ajuda e atividades jogáveis ficam fora                             | Todo o planejamento     | Proposta |
| G-55 | Escalas: catálogo mantido pelo backend; começar com 1 ou 2 escalas de rastreio de uso livre, escolhidas e conferidas por responsável clínico, com fonte citada | AVA-01 a AVA-05, PAC-05 | Proposta |
| G-56 | Depois de finalizar a sessão, o app abre a **Evolução** no lugar da observação; o registro descritivo substitui a observação                                   | EVO-01, EVO-05          | Proposta |
| G-57 | Critérios da evolução: metas do PE da sessão; sem PE, do PDI vigente; sem plano, só o registro descritivo e o atalho "Criar PE"                                | EVO-01                  | Proposta |
| G-58 | Relatório: o backend monta o conteúdo, a síntese e o histórico; o app gera o PDF (`expo-print`)                                                                | REL-01 a REL-03         | Proposta |
| G-59 | Notificações só dentro do app (sino e lista), sem push, enquanto o app rodar no Expo Go                                                                        | NOT-01                  | Proposta |
| G-60 | Pontuação parcial da escala mostra a faixa marcada como "parcial"; a definitiva vem na conclusão                                                               | AVA-03                  | Proposta |

Decisões de produto que o backend confirma estão na
[ESPECIFICACAO-BACKEND §11](ESPECIFICACAO-BACKEND.md#11-decisões-de-produto-para-confirmar-com-o-backend).
Também fica com o usuário a E-10 da revisão da Entrega 3 (a contagem da Agenda exclui os
cancelados); a FEC-05 segue a resposta, e sem resposta o comportamento atual fica.

## 6. Ondas

O app trabalha **com mocks fiéis à especificação enquanto o backend constrói** (G-29), e cada
tela é integrada quando a leva correspondente for publicada (ESPECIFICACAO-BACKEND §10). Uma
tarefa só é concluída depois de testada contra o backend real.

| Onda  | Tarefas                                    | Depende do backend                                | Observação                                                          |
| ----- | ------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------- |
| E4-0  | FEC-05, API-04 (planos), QA-07 (esqueleto) | Não                                               | Começa já: pendências da Entrega 3 e registro do contrato de planos |
| E4-1  | API-05 (evolução e senha)                  | Mocks pela especificação; contrato real na leva 1 | Tipos, endpoints e mocks; dono único de `src/api/types.ts`          |
| E4-2  | AUT-01, REC-03, EVO-01                     | Leva 1                                            | Arquivos disjuntos                                                  |
| E4-3  | EVO-02, EVO-05                             | Leva 1                                            | EVO-05 mexe na Início, na Agenda e na ficha                         |
| E4-4  | API-05 (avaliações), AVA-01                | Leva 2                                            | —                                                                   |
| E4-5  | AVA-02, AVA-03                             | Leva 2 (insight na leva 3)                        | AVA-03 entra sem o insight se a leva 3 atrasar                      |
| E4-6  | AVA-04, AVA-05, PAC-05                     | Leva 2                                            | PAC-05 é dona da ficha nesta onda                                   |
| E4-7  | EVO-04, PAC-09                             | Leva 3                                            | IA                                                                  |
| E4-8  | API-05 (relatórios), REL-01, REL-02        | Leva 4                                            | —                                                                   |
| E4-9  | REL-03, API-05 (notificações), NOT-01      | Levas 4 e 5                                       | —                                                                   |
| E4-10 | NAV-04                                     | —                                                 | Por último: liga Recursos e Início aos domínios entregues           |
| E4-11 | QA-07 (rodada), QA-03, QA-02               | —                                                 | Emulador só com autorização do usuário no momento                   |
| E4-12 | QA-04                                      | —                                                 | Exige aparelho Android físico e Mac/iPhone                          |

Regras de execução que continuam valendo (pedidos do usuário):

- trabalho **faseado**: o orquestrador avisa ao fim de cada fase;
- no máximo **2 workers** ao mesmo tempo;
- **uma tarefa = um PR**; merge só com CI verde;
- **emulador só com autorização do usuário no momento**, depois das tarefas de código.

Caminho crítico:

```
backend leva 1 → API-05 → EVO-01 → EVO-02 → backend leva 2 → AVA-01 → AVA-02 → AVA-03
  → AVA-04 → backend leva 4 → REL-01 → REL-02 → REL-03 → NAV-04 → QA-07 → QA-02 → QA-04
```

O backend é o caminho crítico. Se uma leva atrasar, o app adianta as telas com mocks e para
antes da integração; nada é dado como pronto sem o backend real.

## 7. Riscos

| Risco                                                                                        | Efeito                              | Mitigação                                                                                                |
| -------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| O backend entrega menos do que o planejado (quatro domínios é o dobro da Entrega 3)          | Blocos C, D ou E incompletos        | Levas por prioridade (§6); cada bloco fecha sozinho; relatórios e notificações podem ir para a Entrega 5 |
| Conteúdo e licença das escalas                                                               | Avaliações sem escala para aplicar  | G-55 decidida no início; responsável clínico confere a fonte; o formato aceita qualquer escala por dados |
| Interpretação clínica indevida (escore, insight, síntese)                                    | Risco ao paciente e ao profissional | Aviso clínico sempre visível; o app não calcula escore; IA sem diagnóstico (IA-04)                       |
| Dados sensíveis de crianças em relatórios enviados                                           | Exposição de dados                  | "Seguro por padrão" (RP-01); arquivo temporário apagado depois de compartilhar; nada de conteúdo em log  |
| A troca da senha invalida os tokens                                                          | Usuário deslogado sem aviso         | REC-03 guarda o token novo devolvido; AUT-01 volta ao login com mensagem                                 |
| A Evolução muda o fim da sessão, que é o fluxo mais sensível do app (Entrega 3, REV-SES)     | Regressão no fluxo de sessão        | EVO-01 com testes do `session-flow` antes da tela; reteste do fluxo completo no emulador                 |
| Arquivos compartilhados (`types.ts`, `HomeScreen`, `PatientDetailScreen`, `ResourcesScreen`) | Conflitos entre PRs                 | Dono único por onda (BACKLOG §3)                                                                         |
| Homologação iOS sem Mac/iPhone                                                               | QA-04 incompleta                    | Registrar a pendência; não declarar iOS validado sem evidência                                           |

## 8. Manutenção

O orquestrador atualiza este roadmap quando uma decisão do §5 for tomada ou quando o backend
publicar uma leva que mude o escopo. O progresso vai para o [TRACKING](TRACKING.md).
