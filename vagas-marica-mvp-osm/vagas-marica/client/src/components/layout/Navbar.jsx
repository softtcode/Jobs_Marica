import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import Logo from './Logo.jsx';
import Drawer from '../ui/Drawer.jsx';
import { NAV_ITEMS } from './navItems.js';
import { useResume } from '../../context/ResumeContext.jsx';
import { useNavTarget } from './useNavTarget.js';

const PRIMARY = NAV_ITEMS.filter((i) => i.primary);
const SECONDARY = NAV_ITEMS.filter((i) => i.secondary);

function ResumeDot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-success" title="Perfil salvo neste navegador" aria-label="(perfil salvo)" />;
}

/**
 * Cabeçalho fixo.
 *  Desktop: destinos principais com destaque, complementares menores, botão de busca.
 *  Celular/tablet: a barra inferior leva às páginas principais; o menu lista tudo, inclusive
 *  Avaliações de empresas e Sobre o projeto.
 */
export default function Navbar() {
  const { pathname } = useLocation();
  const { hasResume } = useResume();
  const [menuOpen, setMenuOpen] = useState(false);
  const target = useNavTarget();

  const link = ({ isActive }, small) => `relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 transition-colors ${
    small ? 'text-[13px]' : 'text-sm font-semibold'
  } ${isActive ? 'text-brand-dark' : small ? 'text-muted hover:text-ink' : 'text-slate-700 hover:bg-surface hover:text-ink'}`;

  return (
    <header className="sticky top-0 z-40 bg-white/90 shadow-[0_1px_0_#E2E8F0] backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Navegação principal" className="ml-6 hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {PRIMARY.map(({ to, label }) => (
              <li key={to}>
                <NavLink to={target(to)} className={(s) => link(s, false)}>
                  {({ isActive }) => (
                    <>
                      {label}
                      {to === '/curriculo' && hasResume && <ResumeDot />}
                      {isActive && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand" aria-hidden="true" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <nav aria-label="Páginas complementares" className="mr-2 hidden xl:block">
            <ul className="flex items-center">
              {SECONDARY.map(({ to, label }) => (
                <li key={to}>
                  <NavLink to={to} className={(s) => link(s, true)}>{label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {pathname !== '/vagas' && (
            <Link to="/vagas" className="btn btn-sm btn-primary hidden sm:inline-flex">
              <Search size={16} aria-hidden="true" />
              <span>Buscar vagas</span>
            </Link>
          )}
          <button
            type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu" aria-haspopup="dialog"
            className="btn btn-ghost h-10 w-10 p-0 xl:hidden"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" side="right">
        <nav aria-label="Menu completo" className="p-3">
          {[['Principais', NAV_ITEMS.filter((i) => !i.secondary)], ['Complementares', SECONDARY]].map(([group, items]) => (
            <div key={group} className="mb-3">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{group}</p>
              <ul className="space-y-1">
                {items.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={target(to)} end={end} onClick={() => setMenuOpen(false)}
                      className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors ${isActive ? 'bg-brand-soft text-brand-dark' : 'text-slate-700 hover:bg-surface'}`}
                    >
                      <Icon size={19} aria-hidden="true" /> {label}
                      {to === '/curriculo' && hasResume && <ResumeDot />}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Drawer>
    </header>
  );
}
