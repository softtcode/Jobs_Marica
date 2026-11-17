import { MapPin } from 'lucide-react';

/**
 * "Local de referência": bairro a partir do qual as distâncias são calculadas.
 * A lista vem do servidor (/api/config). Não usa GPS nem pede a localização da pessoa.
 */
export default function ReferenceSelect({ id = 'ref', value, onChange, references, compact = false }) {
  const options = references?.length ? references : [{ id: 'centro', label: 'Centro (Casa do Trabalhador)' }];
  if (compact) {
    return (
      <label className="relative inline-flex">
        <span className="sr-only">Local de referência</span>
        <MapPin size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand" aria-hidden="true" />
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="chip-select pl-8">
          {options.map((r) => <option key={r.id} value={r.id}>{r.id === 'centro' ? 'Perto do Centro' : `Perto de ${r.name}`}</option>)}
        </select>
      </label>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="label">Local de referência</label>
      <div className="relative">
        <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand" aria-hidden="true" />
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="field pl-10">
          {options.map((r) => <option key={r.id} value={r.id}>{r.label || r.name}</option>)}
        </select>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        Escolha o bairro de onde você sai. As distâncias são em linha reta, a partir de um ponto aproximado do bairro.
      </p>
    </div>
  );
}
