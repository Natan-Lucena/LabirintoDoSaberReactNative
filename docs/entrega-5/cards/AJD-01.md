# AJD-01 — Central de ajuda

| Campo             | Valor                                                                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bloco / onda      | E — Push, ajuda e navegação · E5-9 (paralela à NOT-02; ver a regra do lockfile na NOT-02 §8)                                                         |
| Classe / modelo   | B · Codex (ou Terra/Sonnet), esforço médio                                                                                                           |
| Estimativa        | M · 4–5 h de worker                                                                                                                                  |
| Dependências      | API-07 (ajuda: `HelpTutorial`, `listHelpTutorials`); backend leva 4 (§8, AJ-01 a AJ-04); G-69; EQP-01 na `main` (dona anterior de `ResourcesScreen`) |
| Estado do backend | **Mock-first**; o conteúdo (vídeos) depende da equipe de produto (AJ-01)                                                                             |
| História          | US2-13 (aprender a usar o app)                                                                                                                       |

## 1. Objetivo e valor

"Central de ajuda" em Recursos ainda abre "Em breve". O design propõe vídeos curtos com um
destaque "Comece por aqui". O conteúdo vem do backend (seed), e o tutorial sem vídeo mostra os
passos em texto, que também servem de reserva acessível.

## 2. Referência de design

`TeamScreen` no estado `onboarding` ([ficha AJD-01 da Entrega 2](../../entrega-2/BACKLOG.md)):
título "Central de ajuda" com eyebrow "Aprenda no seu ritmo"; `.video-feature` "COMECE POR AQUI
· 4 MIN" com o título do destaque ("Conheça o Labirinto do Saber"); "Tutoriais essenciais"
(`.tutorial-list`, itens numerados com a duração). O player não tem desenho: o `VideoView` nativo.
**Lacuna:** o conector Figma não leu o código do Make nesta sessão; conferir o `TeamScreen` antes
de montar, se houver acesso.

## 3. Fluxo do usuário

1. Recursos → "Central de ajuda" → `/help`.
2. Lista: `AppHeader` "Central de ajuda" / "Aprenda no seu ritmo"; cartão de destaque (o
   tutorial com `featured: true`): miniatura (`thumbnailUrl`, ou um bloco na cor da marca com o
   ícone `play`), eyebrow "COMECE POR AQUI · {N} MIN" e o título; depois `SectionTitle`
   "Tutoriais essenciais" e os demais na ordem do servidor: número ("1", "2"…), título,
   descrição em uma linha e "{N} min".
3. Tocar num item → `/help/[id]`:
   - com `videoUrl`: `VideoView` (`nativeControls`, `fullscreenOptions={{ enable: true }}`),
     sem tocar sozinho; título, descrição e, se houver, "Passo a passo" com os `steps`;
   - sem `videoUrl`: título, descrição e os `steps` numerados (sem player).
4. Voltar para a lista para o vídeo (o player é liberado ao desmontar, `useVideoPlayer`).

## 4. Estados da tela

| Situação                | O que aparece                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Carregando              | `ActivityIndicator` e "Carregando tutoriais"                                               |
| Erro                    | "Não foi possível carregar a central de ajuda." + "Tentar de novo"                         |
| Lista vazia             | "Os tutoriais ainda não foram publicados." (conteúdo do backend ainda não entregue, AJ-01) |
| Sem destaque            | Só a lista "Tutoriais essenciais"                                                          |
| Erro no vídeo           | Abaixo do player: "Não foi possível tocar o vídeo agora." e, se houver, os passos em texto |
| Offline                 | A lista do cache persistido; o vídeo mostra o erro acima (não há download)                 |
| Tutorial não encontrado | "Tutorial não encontrado" + "Voltar" (id que saiu da lista)                                |

## 5. Contrato de dados

| Rota                  | Resposta                           | Erros    |
| --------------------- | ---------------------------------- | -------- |
| `GET /help/tutorials` | `200 HelpTutorial[]` (por `order`) | só `401` |

```ts
// API-07 (especificação §8.2)
interface HelpTutorial {
  id: string;
  order: number;
  title: string; // até 80
  description: string; // até 200
  durationSeconds: number;
  featured: boolean; // no máximo um
  videoUrl?: string; // https, MP4 (H.264) ou HLS
  thumbnailUrl?: string;
  steps?: string[]; // até 10
}
```

- **Leitura** (API-07): `listHelpTutorials()` em `src/api/endpoints/help.ts`; chave
  `helpQueryKeys.tutorials() = ["help", "tutorials"]`; `staleTime` de 1 hora (conteúdo muda
  pouco); persistido.
- **Detalhe:** sem rota própria; a tela lê a mesma query e procura o `id`.
- Nenhuma escrita.

## 6. Regras de negócio e casos de borda

1. A ordem é a do servidor (`order`); o app não reordena. O destaque sai da lista de baixo.
2. Mais de um `featured` (fora do contrato): o primeiro é o destaque; os outros ficam na lista.
3. Duração: `Math.max(1, Math.round(durationSeconds / 60))` + " min"; no eyebrow, "MIN" em
   maiúsculas. Função pura `formatTutorialDuration`.
4. **`expo-video` roda no Expo Go** (documentação do SDK; G-37). Não precisa de plugin no
   `app.json` (não usamos picture-in-picture nem tocar em segundo plano).
5. HLS: aceito como vier (`.m3u8`); o Android não precisa de `contentType`. Não forçar cache.
6. Vídeo é só `https` (AJ-02); `http` ou vazio → trata como "sem vídeo".
7. Acessibilidade: item com `accessibilityLabel` "Tutorial {n}: {título}, {N} minutos"; o player
   tem o rótulo "Vídeo: {título}"; os passos são texto real (leitor de tela).
8. Nenhum dado de paciente (AJ-04 é do conteúdo; o app não acrescenta nada).

## 7. Plano de implementação

1. `npx expo install expo-video` (pnpm), sem plugin.
2. `src/features/help/`: `format.ts`, `useHelpTutorials.ts`, `HelpScreen.tsx`,
   `HelpTutorialScreen.tsx`, `components/FeaturedTutorial.tsx`, `components/TutorialRow.tsx`,
   `components/TutorialVideo.tsx` (`useVideoPlayer(url)` + `VideoView` + `useEvent(player,
"statusChange")` para o erro).
3. `app/help.tsx` e `app/help/[id].tsx`: rotas finas.
4. `src/features/resources/ResourcesScreen.tsx`: `destination: "/help"` no item "Central de
   ajuda" (e na união do tipo).
5. Testes com `vi.mock("expo-video")` (lista vem da API; item sem vídeo mostra passos; erro).

## 8. Arquivos

- **Permitidos:** `package.json`, `pnpm-lock.yaml`, `app/help.tsx`, `app/help/[id].tsx`,
  `src/features/help/**` (novos), `src/features/resources/ResourcesScreen.tsx` (só o destino) e
  o teste de Recursos (só o item), `src/mocks/handlers/help.ts` (só se a API-07 não tiver um
  tutorial sem vídeo para o teste).
- **Proibidos:** `app.json` (não precisa de plugin; se o worker achar que precisa, para e
  pergunta), `src/api/types.ts`, `src/api/errors.ts`, `src/features/notifications/**`.

## 9. Critérios de aceite

| ID           | Critério                                                                                     | Verificação |
| ------------ | -------------------------------------------------------------------------------------------- | ----------- |
| AC-AJD-01-01 | A lista vem da API, na ordem, com o destaque separado; o tutorial sem vídeo mostra os passos | `CT`        |
| AC-AJD-01-02 | Recursos → "Central de ajuda" abre `/help`                                                   | `CT`        |
| AC-AJD-01-03 | O vídeo toca e entra em tela cheia no Expo Go (Android)                                      | `MAN`       |

## 10. Como testar manualmente (Victor)

1. Recursos → "Central de ajuda": o destaque "COMECE POR AQUI · N MIN" e a lista numerada.
2. Toque no destaque: o vídeo aparece; toque em play e depois em tela cheia; gire o aparelho.
3. Volte: o som para.
4. Abra um tutorial sem vídeo (se o backend tiver): aparecem os passos numerados.
5. Com a internet desligada: a lista aparece (salva) e o vídeo mostra "Não foi possível tocar o
   vídeo agora."

## 11. Riscos e perguntas em aberto

- **Quem produz os vídeos e onde ficam** (AJ-01, AJ-02): sem conteúdo, a tela mostra "ainda não
  foram publicados". A tarefa fecha com o mock e é validada contra o backend quando houver ao
  menos um tutorial.
- **Versão do `expo-video` no SDK 57:** a do `npx expo install`; conferir `npx expo-doctor`.

## 12. Fora do escopo

Busca nos tutoriais; progresso de "assistido"; download para assistir sem internet; vídeo do
YouTube (AJ-02); chat de suporte.
