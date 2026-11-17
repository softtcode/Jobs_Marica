import { MapPinned, RefreshCw } from 'lucide-react';
import MapView from './MapView.jsx';
import { EmptyState } from '../ui/Notice.jsx';

/**
 * Mapa com os estados de carregamento/erro da configuração.
 * `reference`: bairro de referência (centro do mapa e do círculo de raio); sem ele, usa o ponto padrão.
 */
export default function MapArea({ cfg, reference, ...props }) {
  if (cfg.loading) {
    return (
      <div className="grid h-full place-items-center bg-[#E8EEF6]" role="status">
        <div className="flex flex-col items-center gap-3 text-sm font-medium text-muted">
          <MapPinned size={28} className="animate-pulse text-brand" aria-hidden="true" />
          Carregando o mapa…
        </div>
      </div>
    );
  }
  if (cfg.error) {
    return (
      <div className="grid h-full place-items-center bg-surface p-6">
        <EmptyState
          tone="error" icon={MapPinned} title="Não foi possível iniciar o mapa"
          action={<button type="button" onClick={cfg.retry} className="btn btn-md btn-primary"><RefreshCw size={16} aria-hidden="true" /> Tentar novamente</button>}
        >
          {cfg.error.message}
        </EmptyState>
      </div>
    );
  }
  const center = reference?.lat != null ? reference : { ...cfg.home, label: 'Centro (Casa do Trabalhador)' };
  return <MapView reference={center} {...props} />;
}
