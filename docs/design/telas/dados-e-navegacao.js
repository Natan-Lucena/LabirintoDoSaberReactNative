/* Fonte: Labirinto V4 Mobile - Offline.html (Claude Design, projeto fe9f5a5d-00c3-4254-9797-0fba2801a1f3), template desempacotado, linhas 2289-2322; extraído em 2026-09-24; referência visual, não código a importar; valores passam pelas adaptações aprovadas em G-17. */
// Continuacao linhas 2361-2479
  { k: 'senha', title: 'Recuperar Senha', label: 'Recuperar / Redefinir Senha', group: 'Acesso' },
  { k: 'home', title: 'Tela Inicial', label: 'Home com agenda', group: 'Início' },
  { k: 'homeVazia', title: 'Tela Inicial', label: 'Home sem agenda' },
  { k: 'sessaoAluno', title: 'Sessão', label: 'Iniciar Sessão — escolher aluno', group: 'Sessão de atendimento' },
  { k: 'sessaoNome', title: 'Sessão', label: 'Iniciar Sessão — nome e conteúdo' },
  { k: 'sessaoPlayer', title: 'Sessão', label: 'Sessão em andamento' },
  { k: 'agenda', title: 'Agenda', label: 'Agenda de Atendimentos', group: 'Agenda · novo no mobile' },
  { k: 'whatsapp', title: 'WhatsApp', label: 'Notificar Paciente (WhatsApp)', group: 'WhatsApp · novo' },
  { k: 'alunos', title: 'Alunos', label: 'Alunos', group: 'Alunos' },
  { k: 'cadastrar', title: 'Novo aluno', label: 'Cadastrar Aluno' },
  { k: 'anamnese', title: 'Perfil', label: 'Perfil — Anamnese', group: 'Perfil do aluno' },
  { k: 'documentos', title: 'Perfil', label: 'Perfil — Documentos' },
  { k: 'sessoes', title: 'Perfil', label: 'Perfil — Sessões' },
  { k: 'progresso', title: 'Perfil', label: 'Perfil — Progresso · novo' },
  { k: 'dificuldades', title: 'Perfil', label: 'Dificuldades do Paciente · novo', group: 'PDI e PE por IA · novo' },
  { k: 'pdi', title: 'PDI', label: 'Plano de Desenvolvimento Individual (IA) · novo' },
  { k: 'pe', title: 'PE', label: 'Plano de Ensino da Sessão (IA) · novo' },
  { k: 'evolucao', title: 'Evolução', label: 'Registrar Evolução da Sessão · novo' },
  { k: 'avaliacoes', title: 'Avaliações', label: 'Escala de Rastreio · novo', group: 'Avaliações · novo' },
  { k: 'editarPerfil', title: 'Editar perfil', label: 'Editar Perfil' },
  { k: 'cadernos', title: 'Atividades', label: 'Atividades — Cadernos', group: 'Atividades' },
  { k: 'verTudo', title: 'Atividades', label: 'Atividades — Ver tudo' },
  { k: 'caderno', title: 'Novo caderno', label: 'Criar Caderno · novo' },
  { k: 'banco', title: 'Banco de Atividades', label: 'Banco de Atividades por IA · novo', group: 'Banco de Atividades · novo' },
  { k: 'arrastar', title: 'Atividade', label: 'Arrastar e Soltar · novo', group: 'Atividades interativas · novo' },
  { k: 'interpretacao', title: 'Atividade', label: 'Interpretação de Texto · novo' },
  { k: 'relatorioSessao', title: 'Sessão', label: 'Relatório da Sessão', group: 'Relatórios · novo no mobile' },
  { k: 'obs', title: 'Observação', label: 'Escrever Observação · novo' },
  { k: 'gerar', title: 'Gerar Relatório', label: 'Gerar Relatório · novo' },
  { k: 'previa', title: 'Relatório', label: 'Relatório — Prévia · novo' },
  { k: 'meuPerfil', title: 'Meu Perfil', label: 'Meu Perfil', group: 'Conta' },
  { k: 'convite', title: 'Bem-vinda', label: 'Cadastro via Convite · novo', group: 'Onboarding · novo' }
];

const TABS = [
  { ic: 'home', label: 'Início', k: 'home' },
  { ic: 'activities', label: 'Atividades', k: 'caderno' },
  { ic: 'students', label: 'Alunos', k: 'progresso' },
  { ic: 'agenda', label: 'Agenda', k: 'agenda' },
  { ic: 'reports', label: 'Relatórios', k: 'gerar' }
];

const RULES = [
  [/(redefinir senha|voltar ao login)/, 'home'],
  [/pr(ó|o)ximo passo/, 'sessaoNome'],
  [/iniciar sess(ã|a)o agora/, 'sessaoPlayer'],
  [/confirmar resposta/, 'relatorioSessao'],
  [/iniciar sess(ã|a)o/, 'sessaoAluno'],
  [/exportar relat(ó|o)rio/, 'previa'],
  [/gerar relat(ó|o)rio/, 'gerar'],
  [/relat(ó|o)rio de /, 'previa'],
  [/(salvar relat(ó|o)rio|relat(ó|o)rio da sess(ã|a)o)/, 'relatorioSessao'],
  [/(criar caderno|criar novo caderno|novo caderno)/, 'caderno'],
  [/(escrever|editar) observa(ç|c)(ã|a)o/, 'obs'],
  [/(cadastrar|adicionar|novo) aluno/, 'cadastrar'],
  [/montar plano da sess(ã|a)o/, 'pe'],
  [/pdi e pe/, 'dificuldades'],
  [/salvar dificuldades/, 'pdi'],
  [/dificuldades/, 'dificuldades'],
  [/salvar pdi/, 'pe'],
  [/plano de desenvolvimento/, 'pdi'],
  [/salvar plano/, 'evolucao'],
  [/plano de ensino/, 'pe'],
  [/salvar evolu(ç|c)(ã|a)o/, 'evolucao'],
  [/evolu(ç|c)(ã|a)o/, 'evolucao'],
  [/salvar avalia(ç|c)(ã|a)o/, 'avaliacoes'],
  [/avalia(ç|c)(õ|o)es/, 'avaliacoes'],
  [/adicionar ao caderno/, 'caderno'],
  [/(imprimir|enviar para respons(á|a)vel|enviar por whatsapp)/, 'whatsapp'],
  [/banco de atividades/, 'banco'],
  [/concluir cadastro/, 'home'],
  [/editar perfil/, 'editarPerfil'],
  [/anamnese/, 'anamnese'],
  [/documento/, 'documentos'],
  [/sess(õ|o)es de hoje/, 'agenda'],
  [/(ver todas|ver tudo)/, 'verTudo'],
  [/caderno/, 'cadernos'],
  [/progresso/, 'progresso'],
  [/sess(õ|o)es/, 'sessoes'],
  [/notificar paciente/, 'whatsapp'],
  [/(novo atendimento|agenda|atendimento)/, 'agenda'],
  [/meu perfil/, 'meuPerfil'],
  [/relat(ó|o)rio/, 'gerar'],
  [/criar novo conte(ú|u)do/, 'caderno'],
  [/atividade/, 'cadernos'],
  [/(tela inicial|in(í|i)cio|home)/, 'home'],
  [/aluno/, 'alunos'],
  [/perfil/, 'anamnese']
];


const DAYS = [
  { wd: 'D', n: 5 }, { wd: 'S', n: 6 }, { wd: 'T', n: 7 },
  { wd: 'Q', n: 8, sel: true, dot: true }, { wd: 'Q', n: 9, dot: true },
  { wd: 'S', n: 10 }, { wd: 'S', n: 11, dot: true }
];

const AV_A = 'url(./components/v3/assets/b753ffec4e8de46f.png) center / cover no-repeat';
const AV_B = 'url(./components/v3/assets/38e852598f4e5ba3.png) center / cover no-repeat';
const AV_C = 'url(./components/v3/assets/eb2037cea887dc54.png) center / cover no-repeat';

const STUDENTS = [
  { name: 'Ana Carolina Lima', meta: '8 anos • Feminino\nNível 1 - Inicial', pct: '45%', img: AV_A },
  { name: 'Lara Julia Silva', meta: '7 anos • Feminino\nNível 2 - Desenvolvimento', pct: '65%', img: AV_B }
];


const BY_CATEGORY = [
  { label: 'Leitura', pct: '85%' }, { label: 'Escrita', pct: '70%' },
  { label: 'Vocabulário', pct: '90%' }, { label: 'Compreensão', pct: '75%' }
];
const BY_TYPE = [
  { label: 'Imagem + Áudio', count: '8 atividades', pct: '88%' },
  { label: 'Somente Imagem', count: '4 atividades', pct: '75%' },
  { label: 'Somente Áudio', count: '5 atividades', pct: '80%' },
  { label: 'Somente Texto', count: '3 atividades', pct: '70%' }
];

const LAST_SESSIONS = [
  { name: 'João Pedro Silva', time: '09:00', desc: 'Atividades de reconhecimento de letras e sílabas', cat: 'Alfabetização' },
  { name: 'João Pedro Silva', time: '09:00', desc: 'Atividades de reconhecimento de letras e sílabas', cat: 'Alfabetização' },
  { name: 'Lucas Oliveira', time: '14:00', desc: 'Formação de sílabas e palavras simples', cat: 'Sons e palavras' }
];

const AGENDA_SESSIONS = [
  { from: '09:00', to: '10:00', student: 'João Pedro Silva', activity: 'Alfabetização Divertida', cat: 'Alfabetização', badge: 'Realizada', done: true },
  { from: '10:30', to: '11:30', student: 'Maria Eduarda Santos', activity: 'Números e Quantidade', cat: 'Matemática', badge: 'Agendada', done: false },
  { from: '14:00', to: '14:45', student: 'Lucas Oliveira', activity: 'Sons e Palavras', cat: 'Leitura', badge: 'Agendada', done: false },
  { from: '16:00', to: '17:30', student: 'Ana Carolina Lima', activity: 'Avaliação Trimestral', cat: 'Avaliação', badge: 'Agendada', done: false }
];

const WEEKDAYS = ['D','S','T','Q','Q','S','S'];
const MONTH_DAYS = [29,30,31,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,1,2];
const OUT_OF_MONTH = new Set([0,1,2,33,34]);
const SELECTED_INDEX = 4;
const WITH_SESSIONS = new Set([4,7,11,15,20]);


const DIFFICULTIES = [
  { label: 'Atenção e concentração', on: true },
  { label: 'Coordenação motora fina', on: false },
  { label: 'Reconhecimento de letras', on: true },
  { label: 'Vocabulário e compreensão', on: true },
  { label: 'Interação social', on: false },
  { label: 'Regulação emocional', on: false }
];

const BANK_ACTIVITIES = [
  { name: 'Caça-Sílabas Ilustrado', desc: 'Encontrar sílabas escondidas em uma cena ilustrada', cat: 'Leitura' },
  { name: 'Sequência Numérica com Sons', desc: 'Completar sequências numéricas ouvindo pistas sonoras', cat: 'Matemática' },
  { name: 'Roda de Rimas', desc: 'Associar palavras que rimam entre si', cat: 'Vocabulário' },
  { name: 'Quebra-cabeça de Frases', desc: 'Reorganizar palavras embaralhadas para formar frases', cat: 'Escrita' }
];
