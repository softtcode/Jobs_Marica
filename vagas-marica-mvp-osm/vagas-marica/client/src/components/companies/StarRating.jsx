import { Star } from 'lucide-react';

const fmt = (n) => n.toFixed(1).replace('.', ',');

/** Estrelas de 0 a 5 com preenchimento parcial. Somente leitura. */
export default function StarRating({ value, size = 16, showValue = false, className = '' }) {
  if (value == null) return <span className="text-xs text-muted">Sem avaliações</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative inline-flex" role="img" aria-label={`${fmt(value)} de 5 estrelas`}>
        <span className="flex text-slate-200">
          {Array.from({ length: 5 }, (_, i) => <Star key={i} size={size} fill="currentColor" strokeWidth={0} aria-hidden="true" />)}
        </span>
        <span className="absolute inset-0 flex overflow-hidden text-rating" style={{ width: `${(value / 5) * 100}%` }}>
          {Array.from({ length: 5 }, (_, i) => <Star key={i} size={size} fill="currentColor" strokeWidth={0} className="shrink-0" aria-hidden="true" />)}
        </span>
      </span>
      {showValue && <span className="text-sm font-bold text-ink">{fmt(value)}</span>}
    </span>
  );
}

export { fmt as formatRating };
