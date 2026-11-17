import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems.js';
import { useNavTarget } from './useNavTarget.js';

const ITEMS = NAV_ITEMS.filter((i) => i.bottom);

/** Navegação inferior para celulares e tablets: 4 destinos principais. Os demais ficam no menu do topo. */
export default function BottomNav() {
  const target = useNavTarget();
  return (
    <nav
      aria-label="Navegação rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="grid h-16 grid-cols-4">
        {ITEMS.map(({ to, label, short, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={target(to)}
              end={end}
              className={({ isActive }) =>
                `flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  isActive ? 'text-brand' : 'text-muted hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-7 w-11 place-items-center rounded-full transition-colors ${isActive ? 'bg-brand-soft' : ''}`}>
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  {short || label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
