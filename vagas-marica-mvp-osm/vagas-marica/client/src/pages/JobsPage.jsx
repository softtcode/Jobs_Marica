import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Map as MapIcon, SlidersHorizontal, X } from 'lucide-react';
import SearchBar from '../components/jobs/SearchBar.jsx';
import FilterPanel from '../components/jobs/FilterPanel.jsx';
import JobList from '../components/jobs/JobList.jsx';
import JobDetails from '../components/jobs/JobDetails.jsx';
import { ActiveFilters, QuickFilters } from '../components/jobs/QuickFilters.jsx';
import MapArea from '../components/map/MapArea.jsx';
import Drawer from '../components/ui/Drawer.jsx';
import { JobsDemoNotice } from '../components/ui/DemoNotice.jsx';
import { MatchTabs, ResumeCTA } from '../components/jobs/MatchTabs.jsx';
import { useJobSearch } from '../hooks/useJobSearch.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { activeFilterCount, DEFAULT_FILTERS } from '../utils/search.js';

export function FiltersButton({ count, onClick, className = '', label = 'Filtros' }) {
  return (
    <button type="button" onClick={onClick} className={`btn btn-outline relative h-11 shrink-0 px-3.5 text-sm ${className}`}>
      <SlidersHorizontal size={17} aria-hidden="true" />
      <span>{label}</span>
      {count > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">
          {count}<span className="sr-only"> ativos</span>
        </span>
      )}
    </button>
  );
}

export const SourcesNote = () => (
  <p className="text-[11px] leading-relaxed text-muted">
    No modo demonstração, as vagas vêm de uma base local de vagas fictícias, com localização aproximada por bairro.
    Quando configuradas, também são consultadas fontes reais (Adzuna e quadros da Greenhouse): elas são buscadas por
    cidade e depois filtradas pela distância calculada a partir das coordenadas aproximadas que a própria fonte
    informa. Projeto acadêmico independente, sem vínculo oficial com a Prefeitura de Maricá.
  </p>
);

/** Nome da empresa filtrada (para o chip "Empresa: …"), sem associar por semelhança de nome. */
export function companyNameOf(data, companyId) {
  if (!data || !companyId) return null;
  return [...data.jobs, ...data.unlocated].find((j) => j.companyId === companyId)?.company || null;
}

/**
 * /vagas — exploração principal.
 *  Desktop (≥1024px): busca + filtros rápidos no topo; lista | mapa (detalhes cobrem a coluna do mapa).
 *  Celular/tablet: lista em destaque; "Mais filtros" em gaveta; mapa na página /mapa com a mesma busca.
 */
export default function JobsPage() {
  usePageTitle('Encontrar vagas');
  const s = useJobSearch();
  const { search } = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  useEffect(() => setShowMap(false), [s.selectedId]); // nova seleção abre os detalhes
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const count = activeFilterCount(s.filters);
  const mapHref = `/mapa${search}`;
  const total = s.jobsState.data ? s.visible.total : null;
  const referenceName = s.reference?.name;
  const companyName = companyNameOf(s.jobsState.data, s.filters.company);

  const editQuery = () => {
    const el = document.getElementById('jobs-search');
    el?.focus();
    el?.select();
  };

  const list = (
    <JobList
      jobsState={s.jobsState} visible={s.visible} filters={s.filters}
      selectedId={s.selectedId} onSelectJob={s.selectJob}
      focusGroup={s.focusGroup} onClearGroup={s.clearGroup}
      onWiden={(radiusKm) => s.setFilters({ radiusKm })} onClear={s.clearFilters}
      onClearQuery={() => s.setFilters({ ...DEFAULT_FILTERS })} onEditQuery={editQuery}
      matches={s.matches} onTab={s.setTab}
      tab={s.tabsActive && s.counts.forYou + s.counts.others > 0 ? s.tab : null}
      sort={s.sort} sortOptions={s.sortOptions} onSort={s.setSort} referenceName={referenceName}
    />
  );
  const selectedMatch = s.selectedJob ? s.matches?.get(s.selectedJob.id) : null;
  const isDemo = Boolean(s.jobsState.data?.demo ?? s.cfg.demoMode);

  return (
    <div className="flex flex-1 flex-col lg:h-[calc(100dvh-4rem)] lg:flex-none lg:overflow-hidden">
      {/* Busca e filtros */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto w-full max-w-[1600px] space-y-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 lg:w-52 lg:shrink-0">
              <h1 className="text-xl font-extrabold leading-tight">Encontrar vagas</h1>
              <p className="text-xs text-muted">Maricá e região{referenceName ? ` · perto de ${referenceName}` : ''}</p>
            </div>
            <SearchBar
              id="jobs-search" value={s.draftQuery} onChange={s.setDraftQuery} onSubmit={s.submitSearch}
              className="lg:max-w-2xl" placeholder="Cargo ou profissão (ex.: atendente, motorista)"
            />
            {!isDesktop && (
              <Link to={mapHref} className="btn btn-dark h-11 px-3.5 text-sm">
                <MapIcon size={17} aria-hidden="true" /> Ver no mapa
              </Link>
            )}
          </div>
          <QuickFilters
            filters={s.filters} setFilters={s.setFilters} references={s.references}
            onMore={() => setFiltersOpen(true)} moreCount={count}
          />
          <ActiveFilters filters={s.filters} setFilters={s.setFilters} onClear={s.clearFilters} references={s.references} companyName={companyName} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:grid-rows-1">
        <section aria-label="Resultados" className="scroll-thin min-h-0 space-y-4 overflow-y-auto px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          {s.jobsState.data && (s.tabsActive
            ? <MatchTabs tab={s.tab} onTab={s.setTab} counts={s.counts} />
            : !s.hasResume && <ResumeCTA />)}
          <div id="results-panel" role={s.tabsActive ? 'tabpanel' : undefined}>{list}</div>
          {isDemo && <JobsDemoNotice compact />}
          <SourcesNote />
        </section>

        {isDesktop && (
          // Coluna direita: mapa sempre montado com as MESMAS vagas da lista; os detalhes cobrem a
          // coluna e "Ver no mapa" revela o mapa com a vaga destacada.
          <div className="relative min-h-0 border-l border-line">
            <MapArea
              cfg={s.cfg} reference={s.reference} radiusKm={s.filters.radiusKm} jobs={s.visible.jobs}
              selectedId={s.selectedId} onSelectGroup={s.selectGroup}
            />
            {s.selectedJob && showMap && (
              <div className="absolute left-1/2 top-3 z-[600] flex -translate-x-1/2 gap-2">
                <button type="button" onClick={() => setShowMap(false)} className="btn btn-sm btn-dark shadow-lift">
                  <FileText size={15} aria-hidden="true" /> Ver detalhes da vaga
                </button>
                <button type="button" onClick={s.closeDetails} className="btn btn-sm bg-white text-ink shadow-lift" aria-label="Limpar seleção">
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            )}
            {s.selectedJob && !showMap && (
              <div className="absolute inset-0 z-[600]">
                <JobDetails job={s.selectedJob} match={selectedMatch} referenceName={referenceName} onClose={s.closeDetails} variant="column" onShowOnMap={() => setShowMap(true)} />
              </div>
            )}
          </div>
        )}
      </div>

      {!isDesktop && s.selectedJob && (
        <JobDetails job={s.selectedJob} match={selectedMatch} referenceName={referenceName} onClose={s.closeDetails} variant="sheet" mapHref={mapHref} />
      )}

      <Drawer
        open={filtersOpen} onClose={closeFilters} title="Filtros" side={isDesktop ? 'right' : 'left'}
        footer={(
          <button type="button" onClick={closeFilters} className="btn btn-lg btn-primary w-full">
            {total == null ? 'Ver resultados' : `Ver ${total} ${total === 1 ? 'vaga' : 'vagas'}`}
          </button>
        )}
      >
        <div className="p-5">
          <FilterPanel filters={s.filters} setFilters={s.setFilters} onClear={s.clearFilters} radii={s.cfg.radii} references={s.references} idPrefix="vagas" />
        </div>
      </Drawer>
    </div>
  );
}
