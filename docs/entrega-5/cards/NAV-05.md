# NAV-05 — App sem "Em breve"

| Campo             | Valor                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| Bloco / onda      | E — Push, ajuda e navegação · E5-10 (por último entre as de código)    |
| Classe / modelo   | C · Haiku, esforço baixo (mudanças completamente especificadas abaixo) |
| Estimativa        | P · 1–2 h de worker                                                    |
| Dependências      | EQP-01, AJD-01 e PAC-10 na `main`                                      |
| Estado do backend | Não depende                                                            |
| História          | US2-15 (Recursos sem "Em breve"; AC-REC-01-01 da Entrega 2)            |

## 1. Objetivo e valor

Fechar o mapa do produto na navegação: nenhum toque leva mais a uma tela "Em breve". Remove a
rota provisória e o código que ficou sem uso.

## 2. Referência de design

`MoreScreen` (Recursos): 3 grupos com destinos reais ([ficha REC-01 da Entrega 2](../../entrega-2/BACKLOG.md)).

## 3. Fluxo, estados e contrato

- **Fluxo:** Recursos → qualquer item → a tela real do item. Nenhuma rota nova.
- **Estados:** os de cada tela de destino; esta tarefa não cria estado.
- **Contrato de dados:** nenhuma rota; só navegação.
- **Regra:** um item de Recursos só existe com destino real. Se um domínio não fechar, a decisão
  é do usuário (esconder o item ou adiar a NAV-05), não do worker.

## 4. Inventário (código em 2026-11-24)

| Onde                                                                                      | Hoje                                          | Depois                                                               |
| ----------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------- |
| `src/features/resources/ResourcesScreen.tsx`                                              | `openComingSoon` para itens sem `destination` | Removido; `destination` obrigatório no tipo                          |
| Item "Equipe e convites"                                                                  | "Em breve"                                    | `/team` (EQP-01)                                                     |
| Item "Central de ajuda"                                                                   | "Em breve"                                    | `/help` (AJD-01)                                                     |
| `src/features/patients/list/PatientsListScreen.tsx`                                       | `FilterChip` "Pendências · Em breve"          | Já removido pela PAC-10 (conferir)                                   |
| `app/shell/coming-soon.tsx`                                                               | Rota provisória                               | Apagada                                                              |
| `src/features/shell/ComingSoonScreen.tsx`                                                 | Tela "Em breve"                               | Apagada                                                              |
| `src/features/shell/__tests__/ComingSoonScreen.test.tsx` e `coming-soon-route.test.tsx`   | Testes da tela e da rota                      | Apagados                                                             |
| `src/features/auth/__tests__/useSessionGuard.test.tsx` (linha com `"/shell/coming-soon"`) | Usa a rota como exemplo de rota interna       | Trocar por outra rota real (`"/notifications"`, `["notifications"]`) |
| `src/features/resources/__tests__/ResourcesScreen.test.tsx`                               | Testa o "Em breve"                            | Testa os 9 destinos                                                  |

## 5. Plano de implementação

1. `git grep -n -i "em breve\|coming-soon\|ComingSoon" -- src app` e conferir a tabela do §4
   (algo novo fora dela: parar e perguntar).
2. `ResourcesScreen.tsx`: apagar `openComingSoon`; `destination` deixa de ser opcional; o
   `onPress` vira `router.push(item.destination)`.
3. Apagar `app/shell/coming-soon.tsx` (a pasta `app/shell/` fica vazia e sai junto),
   `src/features/shell/ComingSoonScreen.tsx` e os dois testes dela. **Não** apagar
   `src/features/shell/useTabItems.ts` (em uso).
4. Ajustar o teste do `useSessionGuard` e o de Recursos.
5. Apagar `.expo/types` local se o typecheck reclamar da rota removida (CONTEXTO-SESSAO §7) e
   rodar a verificação padrão.

## 6. Arquivos

- **Permitidos:** `src/features/resources/**`, `app/shell/**` (apagar), `src/features/shell/ComingSoonScreen.tsx`
  e `src/features/shell/__tests__/{ComingSoonScreen,coming-soon-route}.test.tsx` (apagar),
  `src/features/auth/__tests__/useSessionGuard.test.tsx` (só a linha do exemplo).
- **Proibidos:** qualquer outro arquivo; nenhuma tela nova.

## 7. Critérios de aceite

| ID           | Critério                                                                                                                                                               | Verificação |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-NAV-05-01 | `git grep -i "em breve\|coming-soon\|ComingSoon" -- src app` não acha nada                                                                                             | `CMD`       |
| AC-NAV-05-02 | Os 9 itens de Recursos navegam para as rotas reais (`/plans`, `/evolution`, `/anamnese/templates`, `/assessments`, `/activities` ×2, `/reports/new`, `/team`, `/help`) | `CT`        |
| AC-NAV-05-03 | `pnpm run typecheck`, `lint` e `npx expo export --platform android` passam sem a rota removida                                                                         | `CMD`       |

## 8. Como testar manualmente (Victor)

Recursos: toque em cada um dos 9 itens; todos abrem uma tela de verdade e voltam. Pacientes: não
há "Em breve" nos filtros.

## 9. Riscos e perguntas em aberto

- Se a AJD-01 ou a EQP-01 não fecharem na entrega (backend atrasado), a NAV-05 **não** roda: o
  item continua "Em breve" e a tarefa fica bloqueada (não esconder o item sem decisão do
  usuário).

## 10. Fora do escopo

Reorganizar Recursos; mudar textos dos itens; Início e abas (já sem "Em breve").
