import { memo } from 'react';
import {
  AlertTriangle, Banknote, Building2, ChevronRight, Clock, FlaskConical, MapPin, Sparkles,
} from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import {
  companyInitial, formatDistance, fromPlace, formatRelativeDate, formatSalary, MODE_LABEL, TYPE_LABEL,
} from '../../utils/format.js';
import { TIER_LABEL } from '../../../../shared/jobSearch.js';

/** Monograma neutro da empresa (não é um logotipo: as fontes não enviam logos). */
export function CompanyAvatar({ name, size = 'md' }) {
  const initial = companyInitial(name);
  const dims = size === 'lg' ? 'h-12 w-12 text-lg' : 'h-10 w-10 text-sm';
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-navy-700 to-navy font-display font-bold text-brand-light ${dims}`}
      aria-hidden="true"
    >
      {initial || <Building2 size={size === 'lg' ? 20 : 17} />}
    </span>
  );
}

/**
 * Cor da compatibilidade. Alta = verde discreto; intermediária e baixa = neutras.
 * Nunca vermelho: com a marca em vermelho, uma porcentagem vermelha pareceria erro.
 * O número está sempre escrito, então a cor é só um reforço.
 */
export const matchTone = (score) => (score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low');

/** Selo de compatibilidade (usado nos detalhes). Regras locais; não é probabilidade de contratação. */
export function MatchScore({ score, size = 'sm' }) {
  const tone = {
    high: 'bg-success-soft text-success ring-success/25',
    mid: 'bg-white text-ink ring-line',
    low: 'bg-slate-100 text-slate-600 ring-slate-200',
  }[matchTone(score)];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ring-1 ${tone} ${size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'}`}>
      <Sparkles size={size === 'lg' ? 14 : 12} aria-hidden="true" />
      {score}%<span className="sr-only"> de compatibilidade estimada</span>
    </span>
  );
}

/**
 * Cartão de vaga. Ordem de leitura: cargo → empresa → localização e distância → modalidade e
 * contratação → salário → compatibilidade (indicador auxiliar) → acesso aos detalhes.
 * Campos ausentes não são exibidos como se fossem conhecidos.
 */
function JobCard({ job, selected = false, onSelect, compact = false, match = null, referenceName, showTier = false }) {
  const approx = job.precision !== 'exact';
  const distance = formatDistance(job.distanceKm, approx);
  const salary = formatSalary(job.salary);
  const posted = formatRelativeDate(job.postedAt);
  const contract = job.isDemo ? job.contractType : [job.contractType, job.contractTime].filter(Boolean).join(' · ') || TYPE_LABEL[job.type];
  const unmet = match?.unmetRequired.length || 0;
  const tier = showTier && job.matchTier >= 2 ? TIER_LABEL[job.matchTier] : null;
  const distanceText = distance
    ? (distance === 'no bairro' ? `no bairro de referência` : `${distance}${referenceName ? ` ${fromPlace(referenceName)}` : ''}`)
    : job.lat == null ? (job.mode === 'remote' ? 'remota' : 'sem localização no mapa') : null;

  return (
    <button
      type="button"
      data-job-id={job.id}
      onClick={() => onSelect(job)}
      aria-pressed={selected}
      className={`group w-full rounded-2xl border bg-white text-left transition-all duration-150 ${compact ? 'p-3.5' : 'p-4 sm:p-5'} ${
        selected
          ? 'border-brand shadow-lift ring-4 ring-brand/10'
          : 'border-line shadow-card hover:-translate-y-px hover:border-brand/40 hover:shadow-lift'
      }`}
    >
      <div className="flex gap-3">
        {!compact && <CompanyAvatar name={job.company} />}
        <div className="min-w-0 flex-1">
          {tier && <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand">{tier}</p>}
          <h3 className={`line-clamp-2 font-display font-bold leading-snug text-ink group-hover:text-brand-dark ${compact ? 'text-[15px]' : 'text-base'}`}>
            {job.title}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-muted">{job.company || 'Empresa não informada'}</p>
        </div>
      </div>

      <p className={`flex items-start gap-1.5 text-[13px] text-slate-700 ${compact ? 'mt-2.5' : 'mt-3'}`}>
        <MapPin size={15} className="mt-px shrink-0 text-slate-400" aria-hidden="true" />
        <span className="min-w-0">
          {job.neighborhood ? `${job.neighborhood}, Maricá` : job.locationText || 'Local não informado'}
          {distanceText && <span className="text-muted"> · {distanceText}</span>}
        </span>
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {job.mode && <Badge>{MODE_LABEL[job.mode]}</Badge>}
        {contract && <Badge tone="brand">{contract}</Badge>}
        {salary && (
          <span className="inline-flex items-center gap-1 pl-1 text-[13px] font-semibold text-ink">
            <Banknote size={15} className="text-slate-400" aria-hidden="true" /> {salary}
          </span>
        )}
      </div>

      {match && (
        <p className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-600">
          <Sparkles size={13} className={`shrink-0 ${matchTone(match.score) === 'high' ? 'text-success' : 'text-slate-500'}`} aria-hidden="true" />
          <span>
            <strong className={`font-semibold ${matchTone(match.score) === 'high' ? 'text-success' : 'text-ink'}`}>{match.score}%</strong> de compatibilidade estimada
          </span>
          {!compact && match.reasons[0] && <span className="text-muted">· {match.reasons[0].text}</span>}
          {unmet > 0 && (
            <span className="inline-flex basis-full items-center gap-1 font-medium text-warning">
              <AlertTriangle size={12} aria-hidden="true" />
              {unmet} {unmet === 1 ? 'requisito obrigatório não identificado' : 'requisitos obrigatórios não identificados'}
            </span>
          )}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 whitespace-nowrap border-t border-line/70 pt-2.5 text-[11px] text-muted">
        {posted && <span className="inline-flex items-center gap-1"><Clock size={11} aria-hidden="true" /> {posted}</span>}
        {job.isDemo
          ? <span className="inline-flex items-center gap-1"><FlaskConical size={11} aria-hidden="true" /> Vaga demonstrativa</span>
          : <span>via {job.sourceName}</span>}
        <span className="ml-auto inline-flex items-center gap-0.5 text-xs font-semibold text-brand-dark">
          Ver detalhes <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}

export default memo(JobCard);
