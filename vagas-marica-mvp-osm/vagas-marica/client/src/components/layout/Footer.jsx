import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { NAV_ITEMS } from './navItems.js';

/**
 * Rodapé em grafite vinho. Textos secundários usam no mínimo slate-400 (5,0:1 sobre o fundo escuro);
 * o hover dos links usa o rosa claro da marca, que mantém contraste alto (8,5:1).
 */
export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy text-slate-300">
      {/* Filete vermelho no topo: detalhe da identidade, sem grandes áreas de vermelho sólido. */}
      <div className="h-1 bg-gradient-to-r from-brand via-brand-dark to-brand" aria-hidden="true" />
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
            Portal público e gratuito para encontrar oportunidades de trabalho em Maricá e região,
            com busca por distância e visualização no mapa.
          </p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className="font-display text-sm font-bold text-white">Navegação</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_ITEMS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="rounded text-slate-300 underline-offset-4 transition-colors hover:text-brand-light hover:underline">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-sm font-bold text-white">Projeto acadêmico</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            O Jobs Maricá é um projeto de extensão acadêmica e independente.
            Não é um serviço oficial da Prefeitura de Maricá.
            As vagas vêm de fontes públicas e a candidatura sempre acontece no site original.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Jobs Maricá · Projeto de extensão</p>
          <p>Mapas © colaboradores do OpenStreetMap</p>
        </div>
      </div>
    </footer>
  );
}
