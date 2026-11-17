import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { List, MapPinned, X } from 'lucide-react';
import JobCard from '../components/jobs/JobCard.jsx';
import SearchBar from '../components/jobs/SearchBar.jsx';
import FilterPanel from '../components/jobs/FilterPanel.jsx';
import JobList from '../components/jobs/JobList.jsx';
import JobDetails from '../components/jobs/JobDetails.jsx';
import { ActiveFilters, QuickFilters } from '../components/jobs/QuickFilters.jsx';
import { MatchTabs } from '../components/jobs/MatchTabs.jsx';
import MapArea from '../components/map/MapArea.jsx';
import Drawer from '../components/ui/Drawer.jsx';
import { JobsDemoNotice } from '../components/ui/DemoNotice.jsx';
import { companyNameOf, FiltersButton, SourcesNote } from './JobsPage.jsx';
import { useJobSearch } from '../hooks/useJobSearch.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { activeFilterCount, DEFAULT_FILTERS } from '../utils/search.js';

function Legend({ referenceName }) {
  return (
    <div className="pointer-events-auto rounded-xl border border-line bg-white/95 p-3 text-xs text-slate-600 shadow-card backdrop-blur">
      <p className="mb-2 font-semibold text-ink">Legenda</p>
      <ul className="space-y-1.5">
        <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded bg-navy" aria-hidden="true" /> Referência: {referenceName || 'Centro'}</li>
        <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-brand bg-white" aria-hidden="true" /> Vaga (local aproximado do bairro)</li>
        <li className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border-2 border-white bg-brand shadow" aria-hidden="true" /> Vaga (local preciso)</li>
      </ul>
    </div>
  );
}

/**
 * /mapa — exploração geográfica com a MESMA busca de /vagas (parâmetros da URL e useJobSearch):
 * palavra-chave, bairro, raio, filtros, aba Para Você/Outras Vagas e ordenação.
 *  Desktop: painel de resultados à esquerda, mapa amplo, detalhes sobrepostos.
 *  Celular: mapa em tela cheia, busca flutuante e lista em gaveta inferior.
 */
export default function MapPage() {
  usePageTitle('Explorar no mapa');
  const s = useJobSearch();
  const { search } = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false); // celular: folha de detalhes sobre a pré-visualização
  const closeSheet = useCallback(() => setDetailsOpen(false), []);
  const closeFilters = useCallback(() => setFiltersOpen(false), []);
  const closeList = useCallback(() => setListOpen(false), []);
  useEffect(() => { if (!s.selectedId) setDetailsOpen(false); }, [s.selectedId]);
  const count = activeFilterCount(s.filters);
  const total = s.jobsState.data ? s.visible.total : null;
  const onMap = s.visible.jobs.length;
  const referenceName = s.reference?.name;
  const listHref = `/vagas${search}`;

  const selectFromList = useCallback((job) => { setListOpen(false); s.selectJob(job); }, [s.selectJob]);

  const tabs = s.jobsState.data && s.tabsActive ? <MatchTabs tab={s.tab} onTab={s.setTab} counts={s.counts} compact /> : null;
  const list = (
    <JobList
      compact
      jobsState={s.jobsState} visible={s.visible} filters={s.filters}
      selectedId={s.selectedId} onSelectJob={isDesktop ? s.selectJob : selectFromList}
      focusGroup={s.focusGroup} onClearGroup={s.clearGroup}
      onWiden={(radiusKm) => s.setFilters({ radiusKm })} onClear={s.clearFilters}
      onClearQuery={() => s.setFilters({ ...DEFAULT_FILTERS })}
      matches={s.matches} onTab={s.setTab}
      tab={s.tabsActive && s.counts.forYou + s.counts.others > 0 ? s.tab : null}
      sort={s.sort} sortOptions={s.sortOptions} onSort={s.setSort} referenceName={referenceName}
    />
  );
  const selectedMatch = s.selectedJob ? s.matches?.get(s.selectedJob.id) : null;
  const isDemo = Boolean(s.jobsState.data?.demo ?? s.cfg.demoMode);
  const filterPanel = (
    <FilterPanel filters={s.filters} setFilters={s.setFilters} onClear={s.clearFilters} radii={s.cfg.radii} references={s.references} idPrefix="mapa" />
  );
  const offlineAction = isDesktop ? null : (
    <button type="button" onClick={() => setListOpen(true)} className="btn btn-md btn-primary"><List size={16} aria-hidden="true" /> Ver vagas em lista</button>
  );

  const map = (
    <MapArea
      cfg={s.cfg} reference={s.reference} radiusKm={s.filters.radiusKm} jobs={s.visible.jobs}
      selectedId={s.selectedId} onSelectGroup={s.selectGroup}
      occludeRight={isDesktop && s.selectedJob ? 452 : 0} offlineAction={offlineAction}
    />
  );

  if (isDesktop) {
    return (
      <div className="grid h-[calc(100dvh-4rem)] grid-rows-1 grid-cols-[420px_minmax(0,1fr)] overflow-hidden">
        <aside aria-label="Busca e resultados" className="flex min-h-0 flex-col border-r border-line bg-white">
          <div className="space-y-3 border-b border-line p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold leading-tight">Explorar no mapa</h1>
                <p className="text-xs text-muted">Até {s.filters.radiusKm} km de {referenceName || 'Centro'}</p>
              </div>
              <Link to={listHref} className="btn btn-sm btn-outline shrink-0"><List size={15} aria-hidden="true" /> Ver em lista</Link>
            </div>
            <SearchBar id="map-search" value={s.draftQuery} onChange={s.setDraftQuery} onSubmit={s.submitSearch} />
            <QuickFilters filters={s.filters} setFilters={s.setFilters} references={s.references} onMore={() => setFiltersOpen(true)} moreCount={count} idPrefix="mqf" />
            <ActiveFilters filters={s.filters} setFilters={s.setFilters} onClear={s.clearFilters} references={s.references} companyName={companyNameOf(s.jobsState.data, s.filters.company)} />
            {tabs}
          </div>
          <div className="scroll-thin min-h-0 flex-1 space-y-4 overflow-y-auto bg-surface p-4">
            {list}
            {isDemo && <JobsDemoNotice compact />}
            <SourcesNote />
          </div>
        </aside>

        <div className="relative min-h-0">
          {map}
          <div className="pointer-events-none absolute bottom-8 left-3 z-[500] flex flex-col items-start gap-2">
            <Legend referenceName={referenceName} />
          </div>
          {s.selectedJob && <JobDetails job={s.selectedJob} match={selectedMatch} referenceName={referenceName} onClose={s.closeDetails} variant="panel" />}
        </div>

        <Drawer open={filtersOpen} onClose={closeFilters} title="Filtros" side="right"
          footer={<button type="button" onClick={closeFilters} className="btn btn-lg btn-primary w-full">Ver no mapa</button>}>
          <div className="p-5">{filterPanel}</div>
        </Drawer>
      </div>
    );
  }

  // ----- Celular e tablet -----
  return (
    <div className="relative h-[calc(100dvh-8rem)]">
      <h1 className="sr-only">Explorar no mapa</h1>
      {map}

      <div className="absolute inset-x-3 top-3 z-[500] flex gap-2">
        <SearchBar id="map-search-m" value={s.draftQuery} onChange={s.setDraftQuery} onSubmit={s.submitSearch} className="min-w-0 flex-1 shadow-lift" />
        <FiltersButton count={count} onClick={() => setFiltersOpen(true)} className="h-[52px] shadow-lift [&>span:first-of-type]:sr-only" />
      </div>
      {s.tabsActive && !s.selectedJob && (
        <div className="absolute inset-x-3 top-[4.5rem] z-[500] mx-auto max-w-sm">{tabs}</div>
      )}

      {s.selectedJob ? (
        <div className="absolute inset-x-3 bottom-7 z-[500] mx-auto max-w-md animate-fade-up">
          <div className="mb-2 flex items-center justify-between gap-2">
            {s.focusGroup ? (
              <button type="button" onClick={() => setListOpen(true)} className="btn btn-sm bg-white text-brand-dark shadow-lift">
                <List size={15} aria-hidden="true" /> {s.focusGroup.length} vagas neste ponto
              </button>
            ) : <span />}
            <button type="button" onClick={s.closeDetails} className="btn btn-sm bg-white text-ink shadow-lift" aria-label="Fechar pré-visualização">
              <X size={16} aria-hidden="true" /> Fechar
            </button>
          </div>
          <div className="rounded-2xl shadow-panel">
            <JobCard job={s.selectedJob} compact selected match={selectedMatch} referenceName={referenceName} onSelect={() => setDetailsOpen(true)} />
          </div>
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-6 z-[500] flex justify-center px-4">
          <button type="button" onClick={() => setListOpen(true)} className="btn btn-lg btn-dark shadow-panel">
            <MapPinned size={18} aria-hidden="true" />
            {total == null
              ? 'Carregando vagas…'
              : `Ver lista · ${onMap} no mapa${total - onMap > 0 ? ` + ${total - onMap} sem local` : ''}`}
          </button>
        </div>
      )}

      <Drawer open={listOpen} onClose={closeList} title="Resultados" side="bottom">
        <div className="space-y-4 bg-surface p-4">
          <ActiveFilters filters={s.filters} setFilters={s.setFilters} onClear={s.clearFilters} references={s.references} companyName={companyNameOf(s.jobsState.data, s.filters.company)} />
          {tabs}
          {list}
          {isDemo && <JobsDemoNotice compact />}
          <SourcesNote />
        </div>
      </Drawer>

      <Drawer open={filtersOpen} onClose={closeFilters} title="Filtros" side="left"
        footer={<button type="button" onClick={closeFilters} className="btn btn-lg btn-primary w-full">Ver no mapa</button>}>
        <div className="p-5">{filterPanel}</div>
      </Drawer>

      {s.selectedJob && detailsOpen && (
        <JobDetails job={s.selectedJob} match={selectedMatch} referenceName={referenceName} onClose={closeSheet} variant="sheet" />
      )}
    </div>
  );
}
