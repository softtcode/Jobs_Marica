import { Building2, FileText, Home, Info, Map, Search } from 'lucide-react';

/**
 * Hierarquia de navegação:
 *  - primary: o que a pessoa mais usa (encontrar vagas, mapa, currículo) — destaque visual;
 *  - secondary: páginas complementares (avaliações, sobre) — menor destaque.
 * `bottom`: aparece na barra inferior do celular (4 itens, sem legendas espremidas).
 */
export const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: Home, end: true, bottom: true, home: true },
  { to: '/vagas', label: 'Encontrar vagas', short: 'Vagas', icon: Search, bottom: true, primary: true },
  { to: '/mapa', label: 'Explorar no mapa', short: 'Mapa', icon: Map, bottom: true, primary: true },
  { to: '/curriculo', label: 'Meu currículo', short: 'Currículo', icon: FileText, bottom: true, primary: true },
  { to: '/empresas', label: 'Avaliações de empresas', short: 'Empresas', icon: Building2, secondary: true },
  { to: '/sobre', label: 'Sobre o projeto', short: 'Sobre', icon: Info, secondary: true },
];
