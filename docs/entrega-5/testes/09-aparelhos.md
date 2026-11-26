# Homologação em aparelhos — roteiro (QA-04, Entrega 5)

Roteiro da tarefa QA-04: confirmar no **aparelho real** o que o emulador não mostra (câmera,
galeria, áudio, PDF, compartilhamento, teclado, área segura, desempenho e, nesta entrega, o
**push** e o **vídeo**). Base: a matriz do
[09-aparelhos da Entrega 3](../../entrega-3/testes/09-aparelhos-qa04.md), acrescida das linhas
da Entrega 5. Os casos de cada linha vêm do [PLANO-TESTES](../PLANO-TESTES.md).

> **Estado (2026-11-26): roteiro escrito, nada executado.** Não há resultado de aparelho
> registrado. Todas as linhas estão em branco; iOS fica **N/A (pendente)** até haver iPhone,
> Mac e conta Apple, e nunca vira OK sem observação.

## 1. Pré-requisitos

- QA-08 e QA-03 concluídas; BLD-01 (APK do development build); NOT-02 (push) na `main`; backend
  com as levas 1 a 4; **autorização do usuário**.
- **Android físico:** marca, modelo e versão do Android anotados. Dois caminhos: Expo Go (dia a
  dia) e o development build (push). Instalar o APK pede "fontes desconhecidas": configuração do
  aparelho do testador, feita por ele.
- **iOS:** Expo Go da App Store (se a versão da loja suportar o SDK 57) ou build EAS com conta
  Apple. Sem iPhone ou Mac, as linhas de iOS ficam **N/A (pendente)**.
- Backend real, `EXPO_PUBLIC_USE_MOCKS=false`, contas A e B e os dados do §1.3 do plano.
- Quem testa: o desenvolvedor dono do aparelho (Victor no Android físico), com apoio de Haiku para
  instalar o APK e coletar logs.

## 2. Matriz tela × plataforma × recurso nativo

Resultado: **OK**, **FALHA**, **N/A** (com o motivo) ou **BLOQ**. Captura:
`E5-QA04-NN.png`, fora do repositório.

| NN  | Tela / fluxo                   | Recurso nativo                                         | Caso do plano         | Android físico (Expo Go)  | Android físico (dev build) | iOS      |
| --- | ------------------------------ | ------------------------------------------------------ | --------------------- | ------------------------- | -------------------------- | -------- |
| 01  | Push (NOT-02)                  | `expo-notifications`, permissão, toque com app fechado | E5-PSH-01 a E5-PSH-04 | N/A (sem push no Expo Go) |                            | pendente |
| 02  | Central de ajuda (AJD-01)      | `expo-video`, tela cheia, rotação, som                 | E5-AJD-01 a E5-AJD-03 |                           | N/A                        | pendente |
| 03  | Convite (EQP-01)               | `Share` do sistema                                     | E5-EQP-02             |                           | N/A                        | pendente |
| 04  | Imprimível (ATV-05)            | `expo-print`, `expo-sharing`                           | E5-ATV-20 a E5-ATV-23 |                           | N/A                        | pendente |
| 05  | Jogos (ATV-04a, ATV-04b)       | toque, áudio da dica (`expo-audio`)                    | E5-ATV-08 a E5-ATV-13 |                           | N/A                        | pendente |
| 06  | Agenda mês (AGE-05)            | `react-native-calendars`, fuso                         | E5-AGE-01 a E5-AGE-03 |                           | N/A                        | pendente |
| 07  | Cadastro pelo convite (EQP-03) | teclado, `KeyboardAvoidingView`                        | E5-EQP-09 a E5-EQP-11 |                           | N/A                        | pendente |
| 08  | Sessão com jogo (EVO-03)       | toque, retomada do app, modo avião                     | E5-SES-01 a E5-SES-03 |                           | N/A                        | pendente |
| 09  | Atividade com mídia (FEC-06)   | câmera/galeria, áudio                                  | E5-FEC-03             |                           | N/A                        | pendente |
| 10  | Arquivar paciente (PAC-11)     | diálogo de confirmação, área segura                    | E5-PAC-06 a E5-PAC-09 |                           | N/A                        | pendente |

As linhas herdadas da Entrega 3 (câmera, galeria, PDF de relatório, teclado nos formulários
longos) seguem a matriz do [09-aparelhos da Entrega 3](../../entrega-3/testes/09-aparelhos-qa04.md)
e são reexecutadas no mesmo aparelho.

## 3. Critérios de saída

- Matriz preenchida para o Android físico (OK, FALHA, N/A com motivo, BLOQ) (AC-QA-04-01).
- Push recebido e aberto no development build do aparelho, ou pendência registrada com o motivo.
- iOS preenchido ou explicitamente pendente.

## 4. Evidências

- Aparelho e versão, commit, id do build (EAS), uma captura por linha (`E5-QA04-NN.png`), e em
  falha de rede: método, rota e status (sem corpo de resposta).
- Sem dados reais, credenciais ou tokens em capturas e relatos.
- Registro final nesta página (tabela do §2), preenchida pelo testador.

## 5. Fora do escopo

Loja, build de produção e testes de carga.
