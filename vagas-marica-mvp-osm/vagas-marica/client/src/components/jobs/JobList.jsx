import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpDown, CloudOff, FileText, Info, List, Pencil, RefreshCw, RotateCcw, SearchX, Sparkles, ZoomOut,
} from 'lucide-react';
import JobCard from './JobCard.jsx';
import Notice, { EmptyState, ListSkeleton } from '../ui/Notice.jsx';
import { nextRadius } from '../../utils/search.js';
import { MATCH_CONFIG } from '../../services/matchingService.js';

const timeFmt = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export function SortSelect({ id = 'sort', value, options, onChange }) {
  return (
    <label className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted">
      <ArrowUpDown size={14} aria-hidden="true" />
      <span>Ordenar por</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="chip-select h-8 max-w-[11rem] pl-3 text-xs font-semibold text-ink">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

/**
 * Lista de resultados com todos os estados: carregando, erro, fontes indisponíveis, nenhum
 * resultado (com caminhos para sair dele), grupo do mapa, seções e ordenação.
 */
export default function JobList({
  jobsState, visible, filters, selectedId, onSelectJob, focusGroup, onClearGroup,
  onWiden, onClear, onClearQuery, onEditQuery, compact = false, matches = null, tab = null, onTab,
  sort, sortOptions, onSort, referenceName,
}) {
  const { data, loading, error, refresh } = jobsState;
  const rootRef = useRef(null);

  // Quando a seleção vem do mapa, traz o cartão correspondente para a área visível da lista.
  useEffect(() => {
    if (!selectedId || !rootRef.current) return;
    const el = [...rootRef.current.querySelectorAll('[data-job-id]')].find((n) => n.dataset.jobId === selectedId);
    el?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [selectedId, data]);

  if (!data && error) {
    return (
      <EmptyState
        tone="error" icon={CloudOff} title="Não foi possível carregar as vagas"
        action={<button type="button" onClick={refresh} className="btn btn-md btn-primary"><RefreshCw size={16} aria-hidden="true" /> Tentar novamente</button>}
      >
        {error.message}
      </EmptyState>
    );
  }
  if (!data) return <ListSkeleton count={compact ? 5 : 4} />;

  const failed = data.sources.filter((s) => s.status === 'error');
  const disabled = data.sources.filter((s) => s.status === 'disabled');
  const noneFromAnySource = data.sources.every((s) => s.status !== 'ok');
  const isFreelance = filters.type === 'freelance';
  const wider = nextRadius(filters.radiusKm);
  const empty = visible.total === 0;
  const noExactTitle = Boolean(filters.q) && sort === 'relevancia' && !empty && visible.titleCount === 0;

  let emptyState = null;
  if (empty && !loading) {
    if (tab === 'forYou') {
      emptyState = (
        <EmptyState icon={Sparkles} title={`Nenhuma vaga com ${MATCH_CONFIG.threshold}% ou mais de compatibilidade`}
          action={(
            <>
              <button type="button" onClick={() => onTab?.('others')} className="btn btn-md btn-primary">Ver Outras Vagas</button>
              <Link to="/curriculo" className="btn btn-md btn-outline"><FileText size={16} aria-hidden="true" /> Completar perfil</Link>
            </>
          )}>
          Nesta pesquisa, nenhuma vaga atingiu o limite. Complete o perfil, amplie a distância ou veja as outras vagas.
        </EmptyState>
      );
    } else if (tab === 'others') {
      emptyState = (
        <EmptyState icon={Sparkles} title="Todas as vagas desta pesquisa estão em “Para Você”"
          action={<button type="button" onClick={() => onTab?.('forYou')} className="btn btn-md btn-primary">Ver Para Você</button>} />
      );
    } else if (noneFromAnySource && !data.demo) {
      emptyState = (
        <EmptyState icon={CloudOff} title="Nenhuma fonte de vagas respondeu"
          action={<button type="button" onClick={refresh} className="btn btn-md btn-outline"><RefreshCw size={16} aria-hidden="true" /> Tentar novamente</button>}>
          Não há resultados porque as fontes de vagas estão indisponíveis ou não configuradas. Veja os avisos acima.
        </EmptyState>
      );
    } else {
      emptyState = (
        <EmptyState
          icon={SearchX}
          title={filters.q ? `Nenhuma vaga para “${filters.q}”` : 'Nenhuma vaga encontrada'}
          action={(
            <>
              {filters.q && onEditQuery && (
                <button type="button" onClick={onEditQuery} className="btn btn-md btn-outline"><Pencil size={16} aria-hidden="true" /> Alterar a palavra</button>
              )}
              {wider && onWiden && (
                <button type="button" onClick={() => onWiden(wider)} className="btn btn-md btn-primary"><ZoomOut size={16} aria-hidden="true" /> Ampliar para {wider} km</button>
              )}
              {onClear && (
                <button type="button" onClick={onClear} className="btn btn-md btn-outline"><RotateCcw size={16} aria-hidden="true" /> Remover filtros</button>
              )}
              {filters.q && onClearQuery && (
                <button type="button" onClick={onClearQuery} className="btn btn-md btn-outline"><List size={16} aria-hidden="true" /> Explorar todas as vagas</button>
              )}
            </>
          )}
        >
          Nem cargos relacionados foram encontrados. Tente outra palavra, aumente a distância ou remova filtros.
        </EmptyState>
      );
    }
  }

  return (
    <div ref={rootRef} className="space-y-3" aria-busy={loading}>
      {error && (
        <Notice tone="error" title="A atualização falhou"
          action={<button type="button" onClick={refresh} className="text-sm font-semibold text-red-800 underline">Tentar novamente</button>}>
          {error.message} Exibindo o último resultado carregado.
        </Notice>
      )}
      {failed.map((s) => (
        <Notice key={s.id} tone="warning" title={`${s.name} indisponível no momento`}>{s.message}</Notice>
      ))}
      {disabled.length > 0 && !isFreelance && !data.demo && (
        <Notice tone="info" title="Fonte não configurada">{disabled.map((s) => s.message).join(' ')}</Notice>
      )}
      {isFreelance && !data.demo && <Notice tone="info" title="Freelance ainda indisponível">{data.freelance.message}</Notice>}

      {focusGroup && (
        <Notice tone="info" title={`${focusGroup.length} vagas neste ponto do mapa`}
          action={<button type="button" onClick={onClearGroup} className="text-sm font-semibold text-brand-dark underline">Ver todas as vagas</button>}>
          Todas compartilham o mesmo ponto de referência no mapa.
        </Notice>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-1">
        <div aria-live="polite" className="min-w-0">
          <h2 className="font-display text-[15px] font-bold text-ink">
            {loading ? 'Atualizando resultados…' : `${visible.total} ${visible.total === 1 ? 'vaga encontrada' : 'vagas encontradas'}`}
          </h2>
          {!loading && !empty && (
            <p className="text-xs text-muted">
              Até {filters.radiusKm} km{referenceName ? ` de ${referenceName}` : ''}
              {data.fetchedAt && <> · <button type="button" onClick={refresh} className="underline-offset-2 hover:underline" title="Atualizar resultados">atualizado às {timeFmt(data.fetchedAt)}</button></>}
            </p>
          )}
        </div>
        {sortOptions && !empty && <SortSelect id={`sort-${compact ? 'c' : 'l'}`} value={sort} options={sortOptions} onChange={onSort} />}
      </div>

      {noExactTitle && (
        <Notice tone="info" title="Não encontramos vagas com esse título exato.">
          {visible.exactCount > 0
            ? `Mostramos cargos equivalentes a “${filters.q}” e, em seguida, oportunidades relacionadas.`
            : `Veja abaixo oportunidades relacionadas a “${filters.q}”.`}
        </Notice>
      )}

      {emptyState}

      {visible.sections.map((section) => (
        <section key={section.key} aria-label={section.title || 'Resultados'} className={section.title ? 'pt-3' : ''}>
          {section.title && (
            <div className="mb-3 flex gap-2 rounded-xl border border-dashed border-slate-300 p-3">
              <Info size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-ink">{section.title} ({section.jobs.length})</h3>
                {section.note && <p className="mt-0.5 text-xs leading-relaxed text-muted">{section.note}</p>}
              </div>
            </div>
          )}
          <ul className="space-y-3">
            {section.jobs.map((job) => (
              <li key={job.id}>
                <JobCard
                  job={job} compact={compact} selected={job.id === selectedId} onSelect={onSelectJob}
                  match={matches?.get(job.id)} referenceName={referenceName} showTier={Boolean(filters.q)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
