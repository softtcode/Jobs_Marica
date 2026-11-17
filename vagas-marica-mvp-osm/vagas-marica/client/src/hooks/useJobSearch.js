import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext.jsx';
import { useResume } from '../context/ResumeContext.jsx';
import { useJobs } from './useJobs.js';
import { splitByMatch } from '../services/matchingService.js';
import {
  availableSorts, computeVisible, DEFAULT_FILTERS, effectiveSort, filtersToParams, parseFilters, parseTab, TABS,
} from '../utils/search.js';

/**
 * Estado ÚNICO de busca, usado por /vagas e /mapa (lista e mapa mostram o mesmo subconjunto).
 * A URL é a fonte da verdade: busca, bairro, raio, filtros, ordenação, aba e vaga selecionada
 * ficam nos parâmetros — dá para alternar entre as páginas ou compartilhar o link sem perder nada.
 *
 * Com currículo salvo, cada vaga recebe uma compatibilidade (calculada só no navegador) e o
 * resultado JÁ FILTRADO é dividido em "Para Você" e "Outras Vagas". Sem currículo, tudo aparece.
 */
export function useJobSearch() {
  const cfg = useConfig();
  const { resume, hasResume } = useResume();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => parseFilters(params), [params]);
  const tab = parseTab(params);
  const selectedId = params.get('vaga');

  const [draftQuery, setDraftQuery] = useState(filters.q);
  useEffect(() => setDraftQuery(filters.q), [filters.q]);

  const [focusGroup, setFocusGroup] = useState(null); // ids de vagas no mesmo ponto do mapa
  const filterKey = filtersToParams(filters).toString();
  useEffect(() => setFocusGroup(null), [filterKey, tab]);

  const jobsState = useJobs({
    q: filters.q, radiusKm: filters.radiusKm, type: filters.type, refId: filters.ref, enabled: Boolean(cfg.home),
  });

  const references = cfg.references || [];
  const reference = references.find((r) => r.id === filters.ref) || jobsState.data?.center || null;

  /** Altera filtros (mantendo aba e ordenação); a vaga selecionada é descartada. */
  const setFilters = useCallback((patch, { push = false } = {}) => {
    setParams((prev) => filtersToParams({ ...parseFilters(prev), ...patch }, { aba: prev.get('aba') }), { replace: !push });
  }, [setParams]);

  /** Muda só a ordenação: a vaga selecionada continua aberta. */
  const setSort = useCallback((sort) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (sort) next.set('ordem', sort); else next.delete('ordem');
      return next;
    }, { replace: true });
  }, [setParams]);

  const submitSearch = useCallback((value = draftQuery) => {
    // Nova busca: a ordenação volta ao padrão (relevância), que é o que a pessoa espera.
    setFilters({ q: value.trim().slice(0, 100), sort: '' }, { push: true });
  }, [draftQuery, setFilters]);

  /** Limpa todos os filtros, mantendo a palavra pesquisada e a aba. */
  const clearFilters = useCallback(() => {
    setParams((prev) => filtersToParams({ ...DEFAULT_FILTERS, q: parseFilters(prev).q }, { aba: prev.get('aba') }), { replace: false });
  }, [setParams]);

  const setTab = useCallback((t, { keepSelection = false } = {}) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('aba', TABS[t]);
      if (!keepSelection) next.delete('vaga');
      return next;
    }, { replace: true });
  }, [setParams]);

  // Abrir a primeira vaga cria uma entrada no histórico (o "voltar" do celular fecha
  // os detalhes); trocar de vaga ou fechar apenas substitui a entrada atual.
  const hasSelection = Boolean(selectedId);
  const selectJobId = useCallback((id) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('vaga', id); else next.delete('vaga');
      return next;
    }, { replace: !id || hasSelection });
  }, [setParams, hasSelection]);

  // Compatibilidade calculada sobre o resultado filtrado (mesma lógica nas duas páginas).
  const filteredForMatch = useMemo(() => {
    if (!jobsState.data || !hasResume) return null;
    const base = computeVisible({ data: jobsState.data, filters, sort: 'distancia' });
    return [...base.jobs, ...base.unlocated];
  }, [jobsState.data, filters, hasResume]);
  const matching = useMemo(
    () => (filteredForMatch ? splitByMatch(filteredForMatch, resume) : null),
    [filteredForMatch, resume],
  );

  const tabsActive = Boolean(matching);
  const counts = matching ? { forYou: matching.forYou.length, others: matching.others.length } : null;
  const hasQuery = Boolean(filters.q);
  const sort = effectiveSort(filters.sort, { tab, tabsActive, hasQuery, hasResume });
  const sortOptions = availableSorts({ hasQuery, hasResume });

  const visible = useMemo(
    () => computeVisible({ data: jobsState.data, filters, matching, tab, tabsActive, sort, focusGroup }),
    [jobsState.data, filters, matching, tab, tabsActive, sort, focusGroup],
  );

  const selectedJob = useMemo(() => {
    if (!selectedId || !jobsState.data) return null;
    return [...jobsState.data.jobs, ...jobsState.data.unlocated].find((j) => j.id === selectedId) || null;
  }, [selectedId, jobsState.data]);

  // A vaga selecionada precisa pertencer ao resultado exibido. Se ela estiver na outra aba,
  // a aba muda; se saiu do resultado (filtros, bairro, raio), a seleção é desfeita.
  useEffect(() => {
    if (!selectedId || !jobsState.data || jobsState.loading) return;
    const shown = new Set([...visible.jobs, ...visible.unlocated].map((j) => j.id));
    if (shown.has(selectedId)) return;
    if (matching) {
      const other = tab === 'forYou' ? matching.others : matching.forYou;
      if (other.some((s) => s.job.id === selectedId)) { setTab(tab === 'forYou' ? 'others' : 'forYou', { keepSelection: true }); return; }
    }
    selectJobId(null);
  }, [selectedId, visible, jobsState.data, jobsState.loading, matching, tab, setTab, selectJobId]);

  const selectJob = useCallback((job) => selectJobId(job.id), [selectJobId]);
  const closeDetails = useCallback(() => selectJobId(null), [selectJobId]);
  const selectGroup = useCallback((group) => {
    setFocusGroup(group.jobs.length > 1 ? group.jobs.map((j) => j.id) : null);
    selectJobId(group.jobs[0].id);
  }, [selectJobId]);
  const clearGroup = useCallback(() => setFocusGroup(null), []);

  return {
    cfg, filters, setFilters, draftQuery, setDraftQuery, submitSearch, clearFilters,
    jobsState, visible, selectedId, selectedJob, selectJob, closeDetails,
    focusGroup, selectGroup, clearGroup,
    hasResume, matches: matching?.matches || null, tab, setTab, tabsActive, counts,
    sort, setSort, sortOptions, reference, references,
  };
}
