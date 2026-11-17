import { useLocation } from 'react-router-dom';

const SEARCH_PAGES = new Set(['/vagas', '/mapa']);

/**
 * Ao alternar entre /vagas e /mapa pelo menu, leva junto a busca atual (palavra, bairro, raio,
 * filtros, aba, ordenação e vaga aberta): lista e mapa são duas vistas da mesma pesquisa.
 */
export function useNavTarget() {
  const { pathname, search } = useLocation();
  return (to) => (SEARCH_PAGES.has(to) && SEARCH_PAGES.has(pathname) && to !== pathname ? `${to}${search}` : to);
}
