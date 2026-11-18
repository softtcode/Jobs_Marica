/**
 * Paleta do Jobs Maricá — FONTE ÚNICA de cores.
 * Lida pelo Tailwind (tailwind.config.js), pelo CSS global (via theme()) e pelo mapa (Leaflet).
 * Para trocar a identidade visual, altere aqui; os componentes usam apenas os nomes dos tokens.
 *
 * Inspirada nas cores de Maricá (vermelho, grafite, branco e detalhes verdes), sem usar brasões,
 * logotipos ou símbolos oficiais: o Jobs Maricá é um projeto acadêmico independente.
 *
 * Contraste (WCAG 2.1), calculado — sobre branco salvo indicação:
 *   brand 6,25:1 · brand.dark 9,14:1 · muted 5,94:1 · success 5,10:1 · warning 4,96:1 · danger 7,74:1
 *   branco sobre brand 6,25:1 · brand.dark sobre brand.soft 7,82:1 · ink sobre surface 15,6:1
 *   brand.light sobre navy 8,45:1 · slate-300 sobre navy 10,6:1 · slate-400 sobre navy 5,0:1
 *   rating (estrelas) 4,44:1 · geo (círculo do mapa) 5,75:1
 *   Regras: texto pequeno sobre claro usa no mínimo slate-500; sobre escuro, no mínimo slate-400.
 */
export const palette = {
  // Identidade principal
  brand: {
    DEFAULT: '#BC1E2C', // vermelho Maricá — botões principais, links, destaques
    dark: '#8F1521',    // hover, estados ativos, texto sobre brand.soft
    light: '#F3A2AC',   // detalhes sobre superfícies escuras (nunca texto pequeno sobre branco)
    soft: '#FBE9EC',    // filtros selecionados, badges, hover de cartões
    ring: '#EBA1AA',    // bordas e anéis de foco
  },
  // Estrutura (o nome "navy" foi mantido para não quebrar os componentes; hoje é grafite vinho)
  navy: {
    DEFAULT: '#261A20', // hero, rodapé, painéis escuros
    800: '#35232B',
    700: '#49313A',
  },
  surface: '#F9F6F7',   // fundo geral (branco quente)
  line: '#E9DFE3',      // bordas e divisórias
  ink: '#261A20',       // texto principal
  muted: '#6B6168',     // texto secundário

  // Escala neutra QUENTE: substitui o "slate" (cinza-azulado) do Tailwind em todo o site,
  // para que textos e ícones secundários acompanhem a nova identidade sem mudar cada classe.
  slate: {
    50: '#FBF8F9',
    100: '#F4EFF1',
    200: '#E9DFE3',
    300: '#D6CACF',
    400: '#958990', // ícones, placeholders e estados desabilitados (3,4:1 — não usar em texto pequeno)
    500: '#766A71', // menor tom permitido para texto pequeno sobre fundo claro
    600: '#6B6168',
    700: '#4F444A',
    800: '#3A2F35',
    900: '#261A20',
  },

  // Semânticas (independentes da marca: erro ≠ identidade, sucesso nunca vermelho)
  success: { DEFAULT: '#187E48', soft: '#EDF8F0' },
  warning: { DEFAULT: '#9A6500', soft: '#FFF6DF' },
  danger: { DEFAULT: '#A51320', soft: '#FFF0F2' },

  // Complementares
  geo: '#1D6B9E',       // azul geográfico: só no mapa (círculo de distância)
  rating: '#A86A00',    // estrelas de avaliação (âmbar escuro, contraste suficiente sobre branco)
  mapBg: '#EFE9EB',     // fundo do mapa enquanto os tiles carregam
};

/** RGB da cor de sombra (grafite vinho), para sombras quentes e discretas. */
export const shadowRgb = '38,26,32';
