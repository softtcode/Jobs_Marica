import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from './context/ConfigContext.jsx';
import { ResumeProvider } from './context/ResumeContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Páginas carregadas sob demanda: a página inicial não baixa mapa, formulários nem avaliações.
const JobsPage = lazy(() => import('./pages/JobsPage.jsx'));
const MapPage = lazy(() => import('./pages/MapPage.jsx'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage.jsx'));
const CompanyDetailsPage = lazy(() => import('./pages/CompanyDetailsPage.jsx'));
const ResumePage = lazy(() => import('./pages/ResumePage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));

function PageFallback() {
  return (
    <div className="grid flex-1 place-items-center py-24" role="status" aria-label="Carregando página">
      <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand/20 border-t-brand" aria-hidden="true" />
    </div>
  );
}

const page = (el) => <Suspense fallback={<PageFallback />}>{el}</Suspense>;

export default function App() {
  return (
    <ConfigProvider>
      <ResumeProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="vagas" element={page(<JobsPage />)} />
              <Route path="mapa" element={page(<MapPage />)} />
              <Route path="empresas" element={page(<CompaniesPage />)} />
              <Route path="empresas/:id" element={page(<CompanyDetailsPage />)} />
              <Route path="curriculo" element={page(<ResumePage />)} />
              <Route path="sobre" element={page(<AboutPage />)} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ResumeProvider>
    </ConfigProvider>
  );
}
