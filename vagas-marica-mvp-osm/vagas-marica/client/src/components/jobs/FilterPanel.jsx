import { RotateCcw } from 'lucide-react';
import RadiusSlider from './RadiusSlider.jsx';
import ReferenceSelect from './ReferenceSelect.jsx';
import { AREA_OPTIONS, CONTRACT_OPTIONS, MODE_OPTIONS, TYPE_OPTIONS } from '../../utils/search.js';

function Segmented({ name, legend, options, value, onChange, cols }) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className={`grid gap-1 rounded-xl bg-surface p-1 ring-1 ring-line ${cols}`}>
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input
              type="radio" name={name} value={o.value} className="peer sr-only" aria-label={o.label}
              checked={value === o.value} onChange={() => onChange(o.value)}
            />
            <span className="block rounded-lg px-1 py-2 text-center text-[13px] font-medium text-slate-600 transition-all hover:text-ink peer-checked:bg-white peer-checked:text-brand-dark peer-checked:shadow-card peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Todos os filtros (painel "Mais filtros"). Bairro, raio e tipo são enviados ao backend;
 * os demais filtram no navegador o resultado já recebido.
 */
export default function FilterPanel({ filters, setFilters, onClear, radii, references, idPrefix = 'f' }) {
  const set = (patch) => setFilters(patch);
  const salaryId = `${idPrefix}-salary`;

  return (
    <div className="space-y-6">
      <div className="space-y-5 rounded-2xl border border-line p-4">
        <ReferenceSelect id={`${idPrefix}-ref`} value={filters.ref} references={references} onChange={(ref) => set({ ref })} />
        <RadiusSlider value={filters.radiusKm} radii={radii || undefined} onChange={(radiusKm) => set({ radiusKm })} />
      </div>

      <div className="grid gap-4">
        <div>
          <label htmlFor={`${idPrefix}-contract`} className="label">Tipo de contratação</label>
          <select id={`${idPrefix}-contract`} className="field" value={filters.contract} onChange={(e) => set({ contract: e.target.value })}>
            {CONTRACT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`${idPrefix}-area`} className="label">Área profissional</label>
          <select id={`${idPrefix}-area`} className="field" value={filters.area} onChange={(e) => set({ area: e.target.value })}>
            {AREA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <Segmented
        name={`${idPrefix}-mode`} legend="Modalidade de trabalho" options={MODE_OPTIONS}
        value={filters.mode} onChange={(mode) => set({ mode })} cols="grid-cols-2"
      />

      <Segmented
        name={`${idPrefix}-type`} legend="Tipo de oportunidade" options={TYPE_OPTIONS}
        value={filters.type} onChange={(type) => set({ type })} cols="grid-cols-3"
      />

      <div>
        <label htmlFor={salaryId} className="label">Salário inicial mínimo</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted">R$</span>
          <input
            id={salaryId} type="number" min="0" step="100" inputMode="numeric" placeholder="Qualquer valor"
            value={filters.salaryMin} aria-describedby={`${salaryId}-help`}
            onChange={(e) => set({ salaryMin: e.target.value.replace(/\D/g, '') })}
            className="field pl-10"
          />
        </div>
        <p id={`${salaryId}-help`} className="mt-1.5 text-xs leading-relaxed text-muted">
          Compara com o início da faixa: uma vaga de R$ 1.800 a R$ 3.000 conta como R$ 1.800.
        </p>
        <label
          className={`mt-3 flex items-start gap-2.5 text-[13px] ${filters.salaryMin === '' ? 'text-slate-400' : 'text-slate-700'}`}
        >
          <input
            type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
            disabled={filters.salaryMin === ''}
            checked={filters.includeNoSalary} onChange={(e) => set({ includeNoSalary: e.target.checked })}
          />
          Incluir vagas sem salário inicial informado
        </label>
      </div>

      <p className="rounded-xl bg-surface p-3 text-xs leading-relaxed text-muted">
        Modalidade, contratação, área e salário só filtram vagas em que a fonte informa esses dados.
      </p>

      {onClear && (
        <button type="button" onClick={onClear} className="btn btn-sm btn-outline w-full">
          <RotateCcw size={15} aria-hidden="true" /> Limpar todos os filtros
        </button>
      )}
    </div>
  );
}
