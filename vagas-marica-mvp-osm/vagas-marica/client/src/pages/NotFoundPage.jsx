import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui/Notice.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function NotFoundPage() {
  usePageTitle('Página não encontrada');
  return (
    <div className="container-page grid flex-1 place-items-center py-20">
      <EmptyState
        icon={Compass} title="Página não encontrada"
        action={(
          <>
            <Link to="/" className="btn btn-md btn-outline">Ir para o início</Link>
            <Link to="/vagas" className="btn btn-md btn-primary">Explorar vagas</Link>
          </>
        )}
      >
        O endereço acessado não existe ou foi alterado.
      </EmptyState>
    </div>
  );
}
