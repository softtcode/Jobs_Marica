import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import BottomNav from './BottomNav.jsx';

// Páginas "de aplicação" ocupam a altura da tela e não exibem rodapé institucional.
const APP_ROUTES = ['/vagas', '/mapa'];

export default function AppLayout() {
  const { pathname } = useLocation();
  const isApp = APP_ROUTES.includes(pathname);

  // Ao trocar de página, volta ao topo (trocar só os parâmetros da busca não rola a tela).
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a href="#conteudo" className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="conteudo" className={`flex flex-1 flex-col ${isApp ? '' : 'pb-16 lg:pb-0'}`}>
        <Outlet />
      </main>
      {!isApp && <Footer />}
      <BottomNav />
    </div>
  );
}
