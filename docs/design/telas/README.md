# Telas do Protótipo — Labirinto V4 Mobile

Trechos literais de cada tela extraídos do protótipo **Labirinto V4 Mobile - Offline** (projeto Claude Design `fe9f5a5d-00c3-4254-9797-0fba2801a1f3`), desempacotado em 2026-09-24. Cada arquivo contém o markup e os estilos inline exatos do protótipo, para consulta fiel de layout e estrutura pelas tarefas de implementação.

## Arquivos de tela

| Arquivo | Linhas | Propósito | Chave do protótipo | Tarefas do BACKLOG |
|---------|--------|-----------|--------------------|--------------------|
| `00-header.html` | 1021–1031 | Cabeçalho superior (profile, menu) | `header` | T-203, T-501 |
| `00-tab-bar.html` | 2268–2277 | Barra de abas (navegação inferior) | `tabBar` | T-203, T-501 |
| `01-senha.html` | 1035–1078 | Tela de criação de senha | `screens.senha` | T-403, T-404 |
| `02-home.html` | 1167–1228 | Tela inicial com resumo de progresso | `screens.home` | T-602, T-603 |
| `03-home-vazia.html` | 1230–1265 | Tela inicial sem conteúdo (estado vazio) | `screens.homeVazia` | T-602, T-603 |
| `04-sessao-aluno.html` | 1080–1107 | Sessão: seleção de aluno | `screens.sessao.aluno` | T-702 |
| `05-sessao-nome.html` | 1109–1144 | Sessão: entrada de nome | `screens.sessao.nome` | T-703 |
| `06-sessao-player.html` | 1146–1165 | Sessão: player de vídeo | `screens.sessao.player` | T-801, T-802 |
| `07-agenda.html` | 1845–1906 | Tela de agenda (calendário e agendamentos) | `screens.agenda` | T-902, T-903 |
| `ref-observacao.html` | 1941–1972 | Referência: componente de observação | `ref.observacao` | T-804 |
| `dados-e-navegacao.js` | 2289–2322,<br/>2361–2479 | Dados de exemplo e regras de navegação | `data`, `navigation` | (estrutura) |

## Advertência: dados de exemplo

Os valores no arquivo `dados-e-navegacao.js` e nas telas (nomes de alunos, títulos, "Dra.", taxas de acerto, etc.) são **dados de exemplo do protótipo**, não um contrato de formato ou escopo. Para a especificação real de campos, tipos e limites, consulte o documento [GATES.md](../../entrega-1/GATES.md) e os contracts em `docs/contracts/`.

## Como usar

1. **Consulta visual**: abra o `.html` ou `.js` em um editor para ver o markup exato
2. **Referência de layout**: use como fonte de verdade para estrutura DOM, classes CSS inline, ordem de elementos
3. **Dados**: valores de exemplo (nomes, números) passam pelas adaptações aprovadas em **G-17** (Especificação de Dados e Contexto Pedagógico)

Cada arquivo retém seu cabeçário de fonte, incluindo linhas originais no protótipo para rastreabilidade.
