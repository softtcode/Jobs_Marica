import { MapPin, SlidersHorizontal, X } from 'lucide-react';
import {
  AREA_OPTIONS, CONTRACT_OPTIONS, DEFAULT_FILTERS, DEFAULT_REFERENCE, MODE_OPTIONS, RADII, TYPE_OPTIONS,
} from '../../utils/search.js';
import { AREA_LABEL } from '../../data/skillsDictionary.js';
import { formatMoney } from '../../utils/format.js';

function Chip({ id, label, value, onChange, active, children, icon: Icon }) {
  return (
    <label className="relative inline-flex shrink-0">
      <span className="sr-only">{label}</span>
      {Icon && <Icon size={14} className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-brand" aria-hidden="true" />}
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} data-active={active} className={`chip-select ${Icon ? 'pl-8' : ''}`}>
        {children}
      </select>
    </label>
  );
}

/**
 * Filtros mais usados, ao lado da busca: bairro, distância, contratação, modalidade e área.
 * Em telas pequenas a fileira rola na horizontal (não empurra os resultados para baixo).
 */
export function QuickFilters({ filters, setFilters, references, onMore, moreCount = 0, idPrefix = 'qf' }) {
  const refs = references?.length ? references : [{ id: DEFAULT_REFERENCE, name: 'Centro' }];
  return (
    <div className="scroll-thin -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1" role="group" aria-label="Filtros rápidos">
      <Chip id={`${idPrefix}-ref`} label="Local de referência" icon={MapPin} value={filters.ref} active={filters.ref !== DEFAULT_REFERENCE}
        onChange={(ref) => setFilters({ ref })}>
        {refs.map((r) => <option key={r.id} value={r.id}>{r.id === DEFAULT_REFERENCE ? 'Perto do Centro' : `Perto de ${r.name}`}</option>)}
      </Chip>
      <Chip id={`${idPrefix}-radius`} label="Distância máxima" value={filters.radiusKm} active={filters.radiusKm !== DEFAULT_FILTERS.radiusKm}
        onChange={(v) => setFilters({ radiusKm: Number(v) })}>
        {RADII.map((r) => <option key={r} value={r}>Até {r} km</option>)}
      </Chip>
      <Chip id={`${idPrefix}-contract`} label="Tipo de contratação" value={filters.contract} active={filters.contract !== 'all'}
        onChange={(contract) => setFilters({ contract })}>
        {CONTRACT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value === 'all' ? 'Contratação' : o.label}</option>)}
      </Chip>
      <Chip id={`${idPrefix}-mode`} label="Modalidade de trabalho" value={filters.mode} active={filters.mode !== 'all'}
        onChange={(mode) => setFilters({ mode })}>
        {MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value === 'all' ? 'Modalidade' : o.label}</option>)}
      </Chip>
      <Chip id={`${idPrefix}-area`} label="Área profissional" value={filters.area} active={filters.area !== 'all'}
        onChange={(area) => setFilters({ area })}>
        {AREA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.value === 'all' ? 'Área' : o.label}</option>)}
      </Chip>
      {onMore && (
        <button type="button" onClick={onMore} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-[13px] font-semibold text-ink transition-colors hover:border-brand/50">
          <SlidersHorizontal size={14} aria-hidden="true" /> Mais filtros
          {moreCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] text-white">{moreCount}<span className="sr-only"> ativos</span></span>}
        </button>
      )}
    </div>
  );
}

/** Filtros ativos, cada um removível individualmente, e "Limpar tudo". */
export function ActiveFilters({ filters, setFilters, onClear, references, companyName }) {
  const refName = references?.find((r) => r.id === filters.ref)?.name || filters.ref;
  const chips = [
    filters.ref !== DEFAULT_REFERENCE && { key: 'ref', label: `Perto de ${refName}`, reset: { ref: DEFAULT_REFERENCE } },
    filters.radiusKm !== DEFAULT_FILTERS.radiusKm && { key: 'radius', label: `Até ${filters.radiusKm} km`, reset: { radiusKm: DEFAULT_FILTERS.radiusKm } },
    filters.contract !== 'all' && { key: 'contract', label: filters.contract, reset: { contract: 'all' } },
    filters.mode !== 'all' && { key: 'mode', label: MODE_OPTIONS.find((o) => o.value === filters.mode)?.label, reset: { mode: 'all' } },
    filters.area !== 'all' && { key: 'area', label: AREA_LABEL[filters.area], reset: { area: 'all' } },
    filters.type !== 'all' && { key: 'type', label: TYPE_OPTIONS.find((o) => o.value === filters.type)?.label, reset: { type: 'all' } },
    filters.company && { key: 'company', label: `Empresa: ${companyName || filters.company}`, reset: { company: '' } },
    filters.salaryMin !== '' && {
      key: 'salary',
      label: `Salário inicial a partir de ${formatMoney(Number(filters.salaryMin))}${filters.includeNoSalary ? '' : ' (só com salário)'}`,
      reset: { salaryMin: '', includeNoSalary: true },
    },
  ].filter(Boolean);
  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Filtros ativos">
      {chips.map((c) => (
        <button key={c.key} type="button" onClick={() => setFilters(c.reset)}
          className="inline-flex items-center gap-1 rounded-full bg-navy py-1 pl-3 pr-2 text-xs font-medium text-white transition-colors hover:bg-navy-700"
          aria-label={`Remover filtro: ${c.label}`}>
          {c.label} <X size={13} aria-hidden="true" />
        </button>
      ))}
      <button type="button" onClick={onClear} className="px-1.5 text-xs font-semibold text-brand-dark hover:underline">Limpar tudo</button>
    </div>
  );
}
