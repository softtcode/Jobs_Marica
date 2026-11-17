/**
 * Dicionário local de áreas, cargos, competências, escolaridade e formações.
 * Base do sistema de recomendação por regras (sem IA externa).
 *
 * - `synonyms` são comparados após normalização (sem acentos, minúsculas, sem "(a)").
 * - Um mesmo `id` agrupa sinônimos: "Excel", "Planilhas" e "Microsoft Excel" contam como a mesma competência.
 * - `implies`: competências que trazem outra junto (ex.: Excel avançado ⇒ Excel).
 * Para ampliar o dicionário, basta acrescentar entradas — nenhum outro arquivo precisa mudar.
 */

export const AREAS = [
  { id: 'administracao', label: 'Administração e escritório' },
  { id: 'atendimento-comercio', label: 'Atendimento e comércio' },
  { id: 'ti', label: 'Tecnologia da informação' },
  { id: 'desenvolvimento', label: 'Programação e desenvolvimento web' },
  { id: 'engenharia-arquitetura', label: 'Engenharia e arquitetura' },
  { id: 'saude', label: 'Saúde e cuidados' },
  { id: 'educacao', label: 'Educação' },
  { id: 'alimentacao', label: 'Alimentação e gastronomia' },
  { id: 'turismo-hotelaria', label: 'Turismo e hotelaria' },
  { id: 'construcao-civil', label: 'Construção civil' },
  { id: 'transporte-logistica', label: 'Transporte e logística' },
  { id: 'limpeza-servicos', label: 'Limpeza e serviços gerais' },
  { id: 'marketing-comunicacao', label: 'Marketing e comunicação' },
  { id: 'design', label: 'Design e criação' },
  { id: 'rh', label: 'Recursos humanos' },
  { id: 'contabilidade-financas', label: 'Contabilidade e finanças' },
  { id: 'industria-manutencao', label: 'Indústria e manutenção' },
  { id: 'seguranca', label: 'Segurança patrimonial' },
  { id: 'meio-ambiente', label: 'Meio ambiente' },
  { id: 'servicos-tecnicos', label: 'Serviços técnicos' },
  { id: 'beleza-estetica', label: 'Beleza e estética' },
  { id: 'vendas', label: 'Vendas e representação comercial' },
];
export const AREA_LABEL = Object.fromEntries(AREAS.map((a) => [a.id, a.label]));

export const CONTRACT_TYPES = ['CLT', 'Estágio', 'Jovem Aprendiz', 'PJ', 'Autônomo', 'Temporário', 'Trainee', 'Cooperado', 'Freelancer'];

export const WORK_MODES = [
  { id: 'onsite', label: 'Presencial' },
  { id: 'hybrid', label: 'Híbrido' },
  { id: 'remote', label: 'Remoto' },
];

/** Escolaridade em ordem crescente (`rank`). Usada no cadastro, na importação e na compatibilidade. */
export const EDUCATION_LEVELS = [
  { id: 'fundamental', label: 'Ensino fundamental', rank: 1 },
  { id: 'medio-cursando', label: 'Cursando o ensino médio', rank: 1.5 },
  { id: 'medio', label: 'Ensino médio completo', rank: 2 },
  { id: 'tecnico-cursando', label: 'Cursando ensino técnico', rank: 2.5 },
  { id: 'tecnico', label: 'Ensino técnico completo', rank: 3 },
  { id: 'superior-cursando', label: 'Ensino superior em andamento', rank: 3 },
  { id: 'superior', label: 'Ensino superior completo', rank: 4 },
  { id: 'pos', label: 'Pós-graduação', rank: 5 },
];
export const EDUCATION_RANK = Object.fromEntries(EDUCATION_LEVELS.map((e) => [e.id, e.rank]));
export const EDUCATION_LABEL = Object.fromEntries(EDUCATION_LEVELS.map((e) => [e.id, e.label]));

export const LANGUAGES = ['Inglês', 'Espanhol', 'Francês', 'Italiano', 'Alemão', 'Libras'];
export const LANGUAGE_LEVELS = ['Básico', 'Intermediário', 'Avançado', 'Fluente'];

export const MARICA_NEIGHBORHOODS = [
  'Centro', 'Itaipuaçu', 'Inoã', 'São José do Imbassaí', 'Ponta Negra', 'Cordeirinho', 'Barra de Maricá',
  'Itapeba', 'Araçatiba', 'Ubatiba', 'Jaconé', 'Flamengo', 'Guaratiba', 'Bambuí', 'Spar', 'Jardim Atlântico',
  'Recanto de Itaipuaçu', 'Chácaras de Inoã', 'Pindobas', 'Caju', 'Mumbuca', 'Zacarias',
];

// ---------------------------------------------------------------------------
// Cargos (para "área de interesse e cargo desejado" e experiências anteriores)
// ---------------------------------------------------------------------------
export const ROLES = [
  { id: 'repositor', label: 'Repositor(a)', area: 'atendimento-comercio', synonyms: ['repositor', 'repositora', 'repositor de mercadorias', 'reposicao de mercadorias'] },
  { id: 'operador-caixa', label: 'Operador(a) de caixa', area: 'atendimento-comercio', synonyms: ['operador de caixa', 'operadora de caixa', 'caixa de supermercado', 'caixa de loja'] },
  { id: 'atendente', label: 'Atendente', area: 'atendimento-comercio', synonyms: ['atendente', 'atendente de loja', 'balconista', 'auxiliar de loja', 'operador de atendimento', 'jovem aprendiz em atendimento'] },
  { id: 'recepcionista', label: 'Recepcionista', area: 'atendimento-comercio', synonyms: ['recepcionista', 'recepcionista de clinica', 'telefonista', 'auxiliar de recepcao', 'atendimento e recepcao'] },
  { id: 'aux-limpeza', label: 'Auxiliar de limpeza', area: 'limpeza-servicos', synonyms: ['auxiliar de limpeza', 'faxineiro', 'faxineira', 'auxiliar de servicos gerais', 'servicos gerais', 'zelador', 'zeladora', 'diarista'] },
  { id: 'atendente-lanchonete', label: 'Atendente de lanchonete', area: 'alimentacao', synonyms: ['atendente de lanchonete', 'chapeiro', 'chapeira', 'atendente de fast food', 'garcom', 'garconete', 'jovem aprendiz em alimentacao'] },
  { id: 'cozinheiro', label: 'Cozinheiro(a)', area: 'alimentacao', synonyms: ['cozinheiro', 'cozinheira', 'chef de cozinha', 'auxiliar de cozinha', 'ajudante de cozinha', 'confeiteiro', 'confeiteira', 'padeiro'] },
  { id: 'assistente-adm', label: 'Assistente administrativo', area: 'administracao', synonyms: ['assistente administrativo', 'assistente administrativa', 'auxiliar administrativo', 'auxiliar administrativa', 'auxiliar de escritorio', 'secretaria', 'secretario', 'jovem aprendiz administrativo', 'estagio em administracao'] },
  { id: 'tec-enfermagem', label: 'Técnico(a) de enfermagem', area: 'saude', synonyms: ['tecnico de enfermagem', 'tecnica de enfermagem', 'tecnico em enfermagem', 'auxiliar de enfermagem'] },
  { id: 'enfermeiro', label: 'Enfermeiro(a)', area: 'saude', synonyms: ['enfermeiro', 'enfermeira', 'enfermeiro assistencial'] },
  { id: 'cuidador', label: 'Cuidador(a)', area: 'saude', synonyms: ['cuidador', 'cuidadora', 'cuidador de idosos', 'acompanhante hospitalar'] },
  { id: 'eletricista', label: 'Eletricista', area: 'servicos-tecnicos', synonyms: ['eletricista', 'eletricista predial', 'eletrotecnico', 'eletricista de manutencao'] },
  { id: 'tec-refrigeracao', label: 'Técnico(a) de refrigeração', area: 'servicos-tecnicos', synonyms: ['tecnico de refrigeracao', 'tecnico de ar condicionado', 'refrigerista', 'instalador de ar condicionado'] },
  { id: 'tec-seg-trabalho', label: 'Técnico(a) em segurança do trabalho', area: 'servicos-tecnicos', synonyms: ['tecnico de seguranca do trabalho', 'tecnico em seguranca do trabalho', 'tecnica em seguranca do trabalho'] },
  { id: 'motorista', label: 'Motorista', area: 'transporte-logistica', synonyms: ['motorista', 'motorista de caminhao', 'caminhoneiro', 'motorista entregador', 'condutor de veiculos'] },
  { id: 'entregador', label: 'Entregador(a)', area: 'transporte-logistica', synonyms: ['entregador', 'entregadora', 'motoboy', 'motofretista', 'entregador cooperado'] },
  { id: 'aux-estoque', label: 'Auxiliar de estoque', area: 'transporte-logistica', synonyms: ['auxiliar de estoque', 'estoquista', 'almoxarife', 'auxiliar de logistica', 'conferente', 'separador de mercadorias', 'jovem aprendiz em logistica'] },
  { id: 'tec-informatica', label: 'Técnico(a) de informática / suporte', area: 'ti', synonyms: ['tecnico de informatica', 'tecnico em informatica', 'analista de suporte', 'tecnico de suporte', 'suporte tecnico', 'help desk', 'tecnico de ti', 'tecnico em ti', 'analista de ti', 'suporte de ti', 'jovem aprendiz em informatica'] },
  { id: 'desenvolvedor', label: 'Desenvolvedor(a) de software', area: 'desenvolvimento', synonyms: ['desenvolvedor', 'desenvolvedora', 'programador', 'programadora', 'software developer', 'developer', 'engenheiro de software', 'engenheira de software', 'desenvolvedor web', 'desenvolvedor full stack', 'full stack', 'fullstack', 'desenvolvedor front end', 'front end developer', 'desenvolvedor back end', 'estagio em desenvolvimento web', 'trainee em tecnologia'] },
  { id: 'analista-dados', label: 'Analista de dados', area: 'ti', synonyms: ['analista de dados', 'cientista de dados', 'data analyst', 'analista de bi', 'analista de business intelligence'] },
  { id: 'seg-informacao', label: 'Especialista em segurança da informação', area: 'ti', synonyms: ['especialista em seguranca da informacao', 'analista de seguranca da informacao', 'analista de ciberseguranca', 'pentester'] },
  { id: 'gerente-projetos', label: 'Gerente de projetos', area: 'ti', synonyms: ['gerente de projetos', 'gestor de projetos', 'gestora de projetos', 'project manager', 'scrum master', 'gerente de projetos de ti'] },
  { id: 'analista-financeiro', label: 'Analista financeiro', area: 'contabilidade-financas', synonyms: ['analista financeiro', 'analista financeira', 'assistente financeiro', 'auxiliar financeiro', 'tesoureiro'] },
  { id: 'contador', label: 'Profissional de contabilidade', area: 'contabilidade-financas', synonyms: ['contador', 'contadora', 'assistente contabil', 'auxiliar contabil', 'analista contabil', 'assistente fiscal', 'estagio em contabilidade'] },
  { id: 'vigilante', label: 'Vigilante / porteiro(a)', area: 'seguranca', synonyms: ['vigilante', 'vigilante patrimonial', 'porteiro', 'porteira', 'controlador de acesso', 'vigia'] },
  { id: 'professor', label: 'Professor(a) / instrutor(a)', area: 'educacao', synonyms: ['professor', 'professora', 'docente', 'educador', 'educadora', 'instrutor', 'instrutora', 'monitor', 'monitora', 'auxiliar de classe', 'pedagogo', 'pedagoga', 'estagio em pedagogia'] },
  { id: 'vendedor', label: 'Vendedor(a) / representante', area: 'vendas', synonyms: ['vendedor', 'vendedora', 'vendedor externo', 'representante comercial', 'consultor de vendas', 'consultora de vendas', 'promotor de vendas', 'promotora de vendas', 'executivo de vendas', 'consultor comercial', 'consultora comercial', 'trainee comercial'] },
  { id: 'corretor-imoveis', label: 'Corretor(a) de imóveis', area: 'vendas', synonyms: ['corretor de imoveis', 'corretora de imoveis', 'corretor imobiliario'] },
  { id: 'analista-rh', label: 'Profissional de RH', area: 'rh', synonyms: ['analista de recursos humanos', 'analista de rh', 'assistente de rh', 'assistente de recursos humanos', 'recrutador', 'recrutadora', 'auxiliar de departamento pessoal'] },
  { id: 'designer', label: 'Designer', area: 'design', synonyms: ['designer', 'designer grafico', 'designer grafica', 'diretor de arte', 'ilustrador', 'ilustradora', 'designer de identidade visual', 'estagio em design grafico'] },
  { id: 'marketing', label: 'Profissional de marketing / conteúdo', area: 'marketing-comunicacao', synonyms: ['social media', 'analista de marketing', 'assistente de marketing', 'redator', 'redatora', 'copywriter', 'produtor de conteudo', 'produtora de conteudo', 'estagio em marketing digital'] },
  { id: 'engenheiro-civil', label: 'Engenheiro(a) civil', area: 'engenharia-arquitetura', synonyms: ['engenheiro civil', 'engenheira civil', 'estagio em engenharia civil'] },
  { id: 'arquiteto', label: 'Arquiteto(a)', area: 'engenharia-arquitetura', synonyms: ['arquiteto', 'arquiteta', 'arquiteto e urbanista', 'arquiteta e urbanista'] },
  { id: 'pedreiro', label: 'Profissional de obras', area: 'construcao-civil', synonyms: ['pedreiro', 'servente de obras', 'ajudante de obras', 'ajudante de pedreiro', 'mestre de obras', 'carpinteiro', 'pintor de obras', 'pedreiro cooperado'] },
  { id: 'hotelaria', label: 'Profissional de hotelaria e turismo', area: 'turismo-hotelaria', synonyms: ['recepcionista de hotel', 'recepcionista de pousada', 'camareira', 'camareiro', 'guia de turismo', 'agente de viagens', 'mensageiro', 'recepcionista de eventos', 'jovem aprendiz em hotelaria'] },
  { id: 'cabeleireiro', label: 'Cabeleireiro(a) / barbeiro(a)', area: 'beleza-estetica', synonyms: ['cabeleireiro', 'cabeleireira', 'barbeiro', 'barbeira'] },
  { id: 'manicure', label: 'Manicure / esteticista', area: 'beleza-estetica', synonyms: ['manicure', 'pedicure', 'manicure e pedicure', 'esteticista', 'maquiador', 'maquiadora'] },
  { id: 'ambiental', label: 'Profissional de meio ambiente', area: 'meio-ambiente', synonyms: ['tecnico em meio ambiente', 'gestor ambiental', 'gestora ambiental', 'engenheiro ambiental', 'engenheira ambiental', 'biologo', 'biologa', 'agricultor', 'agricultora', 'trainee em gestao ambiental'] },
  { id: 'manutencao-industrial', label: 'Profissional de manutenção industrial', area: 'industria-manutencao', synonyms: ['mecanico industrial', 'tecnico de manutencao', 'engenheiro mecanico', 'engenheiro de producao', 'engenheira de producao', 'operador de maquinas', 'operador de producao', 'trainee em manutencao industrial'] },
];

/**
 * Cargos RELACIONADOS (não idênticos): usados pela busca como resultados secundários.
 * A relação vale nos dois sentidos. Cargos da mesma área também contam como relacionados.
 */
export const ROLE_RELATIONS = {
  'atendente': ['recepcionista', 'operador-caixa', 'atendente-lanchonete', 'repositor'],
  'recepcionista': ['hotelaria', 'assistente-adm'],
  'assistente-adm': ['analista-rh', 'contador', 'analista-financeiro'],
  'desenvolvedor': ['tec-informatica', 'analista-dados', 'gerente-projetos'],
  'tec-informatica': ['analista-dados', 'seg-informacao'],
  'vendedor': ['corretor-imoveis'],
  'cozinheiro': ['atendente-lanchonete'],
  'motorista': ['entregador', 'aux-estoque'],
  'aux-estoque': ['repositor'],
  'eletricista': ['tec-refrigeracao', 'manutencao-industrial'],
  'tec-enfermagem': ['enfermeiro', 'cuidador'],
  'designer': ['marketing'],
  'engenheiro-civil': ['arquiteto', 'pedreiro'],
};

/** Competências típicas de cada cargo: ligam a busca por cargo às vagas que pedem essas competências. */
export const ROLE_SKILLS = {
  'atendente': ['atendimento'],
  'recepcionista': ['recepcao', 'atendimento', 'agendamento'],
  'operador-caixa': ['operacao-caixa'],
  'repositor': ['estoque'],
  'aux-estoque': ['estoque'],
  'vendedor': ['vendas'],
  'assistente-adm': ['rotinas-adm'],
  'desenvolvedor': ['logica', 'javascript'],
  'tec-informatica': ['hardware', 'redes'],
  'motorista': ['direcao'],
  'entregador': ['roteirizacao'],
  'cozinheiro': ['culinaria'],
  'aux-limpeza': ['limpeza'],
  'eletricista': ['eletrica'],
  'professor': ['didatica'],
};

/** Abreviações comuns digitadas na busca. */
export const ABBREVIATIONS = {
  adm: 'administrativo', admin: 'administrativo', aux: 'auxiliar', assist: 'assistente', tec: 'tecnico',
  tecn: 'tecnico', dev: 'desenvolvedor', rh: 'recursos humanos', enf: 'enfermagem', eng: 'engenheiro',
  op: 'operador', cx: 'caixa', prog: 'programador', vend: 'vendedor', recep: 'recepcionista',
};

// ---------------------------------------------------------------------------
// Competências técnicas (hard) e comportamentais (soft)
// ---------------------------------------------------------------------------
const hard = (id, label, synonyms, extra = {}) => ({ id, label, type: 'hard', synonyms, ...extra });
const soft = (id, label, synonyms) => ({ id, label, type: 'soft', synonyms });

export const SKILLS = [
  // Escritório e administração
  hard('excel', 'Excel', ['microsoft excel', 'ms excel', 'planilhas', 'planilha', 'planilhas eletronicas', 'planilha eletronica', 'google sheets']),
  hard('excel-avancado', 'Excel avançado', ['tabela dinamica', 'tabelas dinamicas', 'procv', 'vlookup', 'macros no excel'], { implies: ['excel'] }),
  hard('pacote-office', 'Pacote Office', ['microsoft office', 'ms office', 'office 365', 'word', 'powerpoint', 'google workspace']),
  hard('informatica-basica', 'Informática básica', ['informatica', 'digitacao', 'uso de computador', 'internet e e mail']),
  hard('windows', 'Windows', ['sistema operacional windows']),
  hard('rotinas-adm', 'Rotinas administrativas', ['rotina administrativa', 'arquivo de documentos', 'arquivamento', 'organizacao de documentos', 'controle de documentos', 'atendimento telefonico']),
  hard('contas-pagar', 'Contas a pagar e receber', ['contas a pagar', 'contas a receber', 'faturamento', 'notas fiscais', 'lancamento de notas']),
  hard('agendamento', 'Agendamento', ['agenda', 'marcacao de consultas', 'controle de agenda']),
  // Atendimento, comércio e vendas
  hard('atendimento', 'Atendimento ao cliente', ['atendimento ao publico', 'atendimento', 'suporte ao consumidor', 'suporte ao cliente', 'sac', 'relacionamento com clientes', 'relacionamento com o cliente', 'experiencia do cliente', 'atendimento em balcao']),
  hard('operacao-caixa', 'Operação de caixa', ['operador de caixa', 'frente de caixa', 'pdv', 'ponto de venda', 'recebimento de pagamentos']),
  hard('matematica-basica', 'Matemática básica', ['calculos basicos', 'calculos', 'matematica']),
  hard('vendas', 'Vendas', ['venda', 'tecnicas de vendas', 'vendas b2b', 'vendas externas', 'vendas internas', 'televendas']),
  hard('negociacao', 'Negociação', ['negociar', 'negociacoes']),
  hard('prospeccao', 'Prospecção de clientes', ['prospeccao', 'captacao de clientes', 'gestao de carteira', 'carteira de clientes']),
  hard('crm', 'CRM', ['salesforce', 'hubspot', 'pipedrive']),
  hard('trade-marketing', 'Trade marketing', ['merchandising', 'promocao de vendas', 'degustacao']),
  hard('imobiliario', 'Mercado imobiliário', ['corretagem de imoveis', 'corretagem', 'creci']),
  hard('estoque', 'Controle de estoque', ['estoque', 'almoxarifado', 'inventario', 'reposicao de mercadorias', 'reposicao', 'separacao de pedidos', 'conferencia de mercadorias', 'expedicao', 'recebimento de mercadorias', 'controle de validade', 'pvps']),
  // Alimentação, limpeza, beleza
  hard('manipulacao-alimentos', 'Manipulação de alimentos', ['boas praticas de manipulacao', 'boas praticas de manipulacao de alimentos', 'manipulador de alimentos', 'higiene alimentar', 'higienizacao de alimentos']),
  hard('culinaria', 'Culinária', ['cozinha', 'gastronomia', 'mise en place', 'preparo de alimentos', 'frutos do mar', 'cozinhar', 'confeitaria']),
  hard('limpeza', 'Limpeza profissional', ['limpeza', 'higienizacao', 'conservacao e limpeza', 'servicos gerais', 'coleta seletiva']),
  hard('cabelo', 'Cabeleireiro', ['corte de cabelo', 'coloracao', 'escova', 'mechas', 'progressiva', 'cabeleireiro', 'cabeleireira']),
  hard('unhas', 'Manicure e pedicure', ['manicure', 'pedicure', 'alongamento de unhas', 'unhas em gel']),
  hard('biosseguranca', 'Biossegurança', ['esterilizacao', 'autoclave']),
  // Saúde
  hard('enfermagem', 'Enfermagem', ['tecnico de enfermagem', 'sinais vitais', 'curativos', 'curativo', 'administracao de medicamentos', 'sae', 'triagem', 'coleta de exames']),
  hard('coren', 'Registro no COREN', ['coren']),
  hard('primeiros-socorros', 'Primeiros socorros', ['bls', 'suporte basico de vida', 'aph']),
  hard('seg-paciente', 'Segurança do paciente', ['protocolos de seguranca do paciente']),
  hard('gestao-equipe', 'Gestão de equipe', ['gestao de equipes', 'lideranca de equipe', 'supervisao de equipe', 'coordenacao de equipe']),
  // Tecnologia
  hard('hardware', 'Manutenção de computadores', ['hardware', 'montagem de computadores', 'formatacao de computadores', 'formatacao', 'suporte tecnico', 'help desk', 'helpdesk']),
  hard('redes', 'Redes de computadores', ['redes de computador', 'cabeamento estruturado', 'tcp ip', 'roteadores', 'configuracao de redes']),
  hard('firewall', 'Firewall', ['firewalls']),
  hard('linux', 'Linux', ['ubuntu', 'debian']),
  hard('seg-informacao', 'Segurança da informação', ['ciberseguranca', 'cybersecurity', 'pentest', 'teste de intrusao', 'iso 27001', 'analise de vulnerabilidade']),
  hard('lgpd', 'LGPD', ['protecao de dados', 'lei geral de protecao de dados']),
  hard('logica', 'Lógica de programação', ['algoritmos', 'programacao']),
  hard('javascript', 'JavaScript', ['js', 'ecmascript']),
  hard('typescript', 'TypeScript', []),
  hard('html', 'HTML', ['html5']),
  hard('css', 'CSS', ['css3', 'tailwind', 'sass', 'bootstrap']),
  hard('react', 'React', ['reactjs', 'react js']),
  hard('node', 'Node.js', ['nodejs', 'node js', 'node', 'express']),
  hard('python', 'Python', ['pandas']),
  hard('java', 'Java', ['spring boot']),
  hard('sql', 'SQL', ['mysql', 'postgresql', 'postgres', 'banco de dados', 'bancos de dados', 'sql server', 'sql avancado']),
  hard('git', 'Git', ['github', 'gitlab', 'versionamento de codigo']),
  hard('docker', 'Docker', ['containers']),
  hard('apis', 'APIs REST', ['api rest', 'apis', 'rest api']),
  hard('nuvem', 'Computação em nuvem', ['aws', 'gcp', 'azure', 'cloud']),
  hard('testes', 'Testes automatizados', ['testes unitarios', 'jest', 'testes de software']),
  hard('power-bi', 'Power BI', ['powerbi', 'dashboards', 'business intelligence']),
  hard('estatistica', 'Estatística', []),
  hard('gestao-projetos', 'Gestão de projetos', ['gerenciamento de projetos', 'pmp', 'pmbok', 'ms project']),
  hard('agil', 'Metodologias ágeis', ['scrum', 'kanban', 'agile', 'jira']),
  // Finanças e contabilidade
  hard('financas', 'Finanças', ['fluxo de caixa', 'conciliacao bancaria', 'dre', 'planejamento financeiro', 'financeiro', 'analise financeira']),
  hard('contabilidade', 'Contabilidade', ['escrituracao fiscal', 'escrituracao', 'simples nacional', 'rotinas fiscais', 'contabil', 'lancamentos contabeis', 'apuracao de impostos']),
  // Design e comunicação
  hard('photoshop', 'Photoshop', ['adobe photoshop', 'tratamento de imagens']),
  hard('illustrator', 'Illustrator', ['adobe illustrator']),
  hard('figma', 'Figma', []),
  hard('canva', 'Canva', []),
  hard('design-grafico', 'Design gráfico', ['criacao grafica', 'diagramacao', 'pecas graficas']),
  hard('identidade-visual', 'Identidade visual', ['branding', 'logotipo', 'logotipos', 'manual de marca']),
  hard('redes-sociais', 'Redes sociais', ['social media', 'instagram', 'marketing digital', 'meta ads', 'facebook ads', 'trafego pago', 'gestao de redes sociais']),
  hard('redacao', 'Redação', ['copywriting', 'producao de conteudo', 'revisao de textos', 'escrita', 'norma culta', 'seo']),
  hard('metricas', 'Métricas digitais', ['google analytics', 'analytics', 'relatorios de metricas']),
  // Engenharia, arquitetura e obras
  hard('autocad', 'AutoCAD', ['auto cad']),
  hard('revit', 'Revit', ['bim']),
  hard('sketchup', 'SketchUp', ['renderizacao']),
  hard('obras', 'Gestão e orçamento de obras', ['gestao de obras', 'orcamento de obras', 'acompanhamento de obras', 'canteiro de obras', 'cronograma de obras']),
  hard('projeto-arquitetonico', 'Projeto arquitetônico', ['projetos arquitetonicos', 'projeto de arquitetura']),
  hard('crea-cau', 'Registro profissional (CREA/CAU)', ['crea', 'cau']),
  hard('construcao', 'Construção civil', ['alvenaria', 'reboco', 'assentamento de pisos', 'contrapiso', 'servente de obras', 'ajudante de obras', 'pedreiro']),
  hard('leitura-projetos', 'Leitura de projetos', ['leitura de plantas', 'interpretacao de projetos']),
  // Serviços técnicos e indústria
  hard('eletrica', 'Instalações elétricas', ['eletrica', 'eletricista', 'eletrotecnica', 'leitura de projetos eletricos', 'manutencao eletrica', 'baixa tensao']),
  hard('nr10', 'NR-10', ['nr 10', 'nr10']),
  hard('nr35', 'NR-35 (trabalho em altura)', ['nr 35', 'nr35', 'trabalho em altura']),
  hard('seg-trabalho', 'Segurança do trabalho', ['normas regulamentadoras', 'epi', 'epis', 'inspecao de epi', 'uso de epi', 'dds', 'seguranca do trabalho']),
  hard('manutencao-predial', 'Manutenção predial', ['manutencao preventiva', 'manutencao corretiva', 'manutencao de condominios']),
  hard('refrigeracao', 'Refrigeração e climatização', ['climatizacao', 'ar condicionado', 'instalacao de ar condicionado', 'split']),
  hard('manutencao-industrial', 'Manutenção industrial', ['lean manufacturing', 'lean', 'indicadores de producao', 'pcm', 'melhoria continua']),
  // Transporte e logística
  hard('cnh-a', 'CNH categoria A', ['cnh a', 'cnh categoria a', 'habilitacao categoria a', 'carteira de motorista a']),
  hard('cnh-b', 'CNH categoria B', ['cnh b', 'cnh categoria b', 'habilitacao categoria b', 'carteira de motorista b']),
  hard('cnh-d', 'CNH categoria D', ['cnh d', 'cnh categoria d', 'habilitacao categoria d'], { implies: ['cnh-b'] }),
  hard('cnh-ab', 'CNH categoria AB', ['cnh ab', 'cnh categoria ab', 'habilitacao ab'], { implies: ['cnh-a', 'cnh-b'] }),
  hard('mopp', 'MOPP', ['curso mopp', 'transporte de produtos perigosos']),
  hard('direcao', 'Direção de veículos', ['direcao defensiva', 'direcao de veiculos pesados', 'direcao de motocicleta', 'motocicleta', 'dirigir']),
  hard('roteirizacao', 'Roteirização e entregas', ['roteirizacao', 'rotas de entrega', 'entregas', 'motofrete']),
  // Segurança, educação, meio ambiente
  hard('vigilancia', 'Vigilância patrimonial', ['vigilancia', 'curso de vigilante', 'formacao de vigilante', 'controle de acesso', 'portaria', 'rondas', 'registro de ocorrencias']),
  hard('didatica', 'Didática e ensino', ['didatica', 'planejamento de aulas', 'docencia', 'lecionar', 'dar aulas', 'alfabetizacao', 'educacao inclusiva']),
  hard('recreacao', 'Recreação', ['atividades recreativas', 'recreador']),
  hard('ingles', 'Inglês', ['english']),
  hard('espanhol', 'Espanhol', ['spanish']),
  hard('rh', 'Recrutamento e gestão de pessoas', ['recrutamento e selecao', 'recrutamento', 'selecao de pessoal', 'treinamento e desenvolvimento', 'departamento pessoal', 'indicadores de rh', 'gestao de pessoas']),
  hard('gestao-ambiental', 'Gestão ambiental', ['licenciamento ambiental', 'monitoramento ambiental', 'educacao ambiental', 'meio ambiente', 'sustentabilidade', 'relatorios tecnicos ambientais']),
  hard('geoprocessamento', 'Geoprocessamento (QGIS)', ['qgis', 'arcgis', 'geoprocessamento']),
  hard('agroecologia', 'Agroecologia e horticultura', ['agroecologia', 'horticultura', 'compostagem', 'agricultura', 'cultivo', 'horta']),
  hard('recepcao', 'Recepção', ['check in', 'hospedagem', 'credenciamento']),

  // Comportamentais
  soft('comunicacao', 'Comunicação', ['boa comunicacao', 'comunicativo', 'comunicativa', 'oratoria', 'comunicacao com clientes']),
  soft('trabalho-equipe', 'Trabalho em equipe', ['espirito de equipe', 'colaboracao', 'cooperacao', 'trabalhar em equipe']),
  soft('organizacao', 'Organização', ['organizado', 'organizada', 'gestao de tempo', 'organizacao de prazos', 'gestao de prazos']),
  soft('proatividade', 'Proatividade', ['proativo', 'proativa', 'iniciativa']),
  soft('responsabilidade', 'Responsabilidade', ['comprometimento', 'comprometido', 'comprometida']),
  soft('pontualidade', 'Pontualidade', ['pontual', 'assiduidade']),
  soft('lideranca', 'Liderança', ['lider', 'liderar']),
  soft('empatia', 'Empatia', ['empatico', 'empatica', 'escuta ativa', 'acolhimento']),
  soft('criatividade', 'Criatividade', ['criativo', 'criativa']),
  soft('analitico', 'Pensamento analítico', ['raciocinio logico', 'analitico', 'analitica', 'analise de resultados']),
  soft('resolucao-problemas', 'Resolução de problemas', ['solucao de problemas', 'resolver problemas']),
  soft('atencao-detalhes', 'Atenção a detalhes', ['detalhista', 'capricho', 'atencao aos detalhes']),
  soft('autonomia', 'Autonomia', ['independencia', 'autogestao']),
  soft('adaptabilidade', 'Adaptabilidade', ['flexibilidade', 'resiliencia']),
  soft('agilidade', 'Agilidade', ['agil', 'rapidez']),
  soft('persuasao', 'Persuasão', ['poder de persuasao']),
  soft('etica', 'Ética e discrição', ['etica', 'discricao', 'sigilo']),
  soft('paciencia', 'Paciência', []),
  soft('cordialidade', 'Cordialidade', ['simpatia', 'cordial', 'simpatico', 'simpatica', 'gentileza']),
  soft('vontade-aprender', 'Vontade de aprender', ['curiosidade', 'aprendizado continuo', 'interesse em aprender', 'interesse por tecnologia']),
  soft('foco-metas', 'Foco em metas', ['foco em resultados', 'orientacao para resultados', 'cumprimento de metas']),
  soft('tomada-decisao', 'Tomada de decisão', ['tomar decisoes']),
  soft('trabalho-pressao', 'Trabalho sob pressão', ['calma sob pressao', 'trabalhar sob pressao']),
  soft('disposicao', 'Disposição', ['energia', 'disposicao fisica']),
  soft('relacionamento', 'Relacionamento interpessoal', ['relacionamento']),
];
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r]));

/** Cursos/formações que indicam afinidade com uma área (usado no critério de formação). */
export const FORMATION_AREAS = [
  { areas: ['desenvolvimento', 'ti'], synonyms: ['sistemas de informacao', 'analise e desenvolvimento de sistemas', 'ciencia da computacao', 'engenharia de software', 'engenharia da computacao', 'tecnico em informatica', 'informatica', 'programacao', 'redes de computadores'] },
  { areas: ['administracao', 'rh'], synonyms: ['administracao', 'gestao empresarial', 'secretariado', 'tecnico em administracao', 'processos gerenciais'] },
  { areas: ['contabilidade-financas'], synonyms: ['ciencias contabeis', 'contabilidade', 'economia', 'gestao financeira', 'tecnico em contabilidade'] },
  { areas: ['saude'], synonyms: ['enfermagem', 'tecnico em enfermagem', 'medicina', 'fisioterapia', 'farmacia', 'cuidador de idosos', 'nutricao'] },
  { areas: ['educacao'], synonyms: ['pedagogia', 'letras', 'licenciatura', 'educacao fisica', 'normal superior'] },
  { areas: ['engenharia-arquitetura', 'construcao-civil'], synonyms: ['engenharia civil', 'arquitetura', 'arquitetura e urbanismo', 'edificacoes', 'tecnico em edificacoes'] },
  { areas: ['design', 'marketing-comunicacao'], synonyms: ['design', 'design grafico', 'publicidade', 'publicidade e propaganda', 'marketing', 'jornalismo', 'comunicacao social', 'producao multimidia'] },
  { areas: ['alimentacao'], synonyms: ['gastronomia', 'nutricao', 'confeitaria'] },
  { areas: ['turismo-hotelaria'], synonyms: ['turismo', 'hotelaria', 'eventos', 'guia de turismo'] },
  { areas: ['rh'], synonyms: ['psicologia', 'gestao de recursos humanos', 'recursos humanos'] },
  { areas: ['meio-ambiente'], synonyms: ['engenharia ambiental', 'biologia', 'ciencias biologicas', 'gestao ambiental', 'meio ambiente', 'tecnico em meio ambiente', 'agroecologia'] },
  { areas: ['servicos-tecnicos'], synonyms: ['seguranca do trabalho', 'eletrotecnica', 'eletrica', 'refrigeracao e climatizacao', 'eletricista'] },
  { areas: ['industria-manutencao'], synonyms: ['engenharia mecanica', 'engenharia de producao', 'engenharia eletrica', 'mecanica', 'mecatronica', 'automacao industrial'] },
  { areas: ['transporte-logistica'], synonyms: ['logistica', 'tecnico em logistica'] },
  { areas: ['beleza-estetica'], synonyms: ['estetica', 'cosmetologia', 'cabeleireiro', 'manicure'] },
  { areas: ['seguranca'], synonyms: ['formacao de vigilante', 'curso de vigilante', 'seguranca privada'] },
  { areas: ['vendas'], synonyms: ['vendas', 'gestao comercial', 'tecnico em vendas'] },
];
