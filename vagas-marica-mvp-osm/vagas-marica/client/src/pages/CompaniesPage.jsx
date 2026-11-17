import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, CloudOff, RefreshCw, Search, X } from 'lucide-react';
import CompanyCard from '../components/companies/CompanyCard.jsx';
import DemoNotice from '../components/ui/DemoNotice.jsx';
import { EmptyState } from '../components/ui/Notice.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { fetchCompanies } from '../services/api.js';

const SORTS = [
  { value: 'rating', label: 'Mais bem avaliadas' },
  { value: 'popular', label: 'Mais populares' },
  { value: 'name', label: 'A–Z' },
];

function CardSkeleton() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="flex gap-3"><div className="skeleton h-12 w-12 rounded-xl" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-2/3" /><div className="skeleton h-3 w-1/3" /></div></div>
      <div className="skeleton mt-5 h-4 w-1/2" />
      <div className="skeleton mt-5 h-5 w-3/4 rounded-full" />
    </div>
  );
}

export default function CompaniesPage() {
  usePageTitle('Avaliações de Empresas');
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const sector = params.get('setor') || '';
  const sort = SORTS.some((s) => s.value === params.get('ordem')) ? params.get('ordem') : 'rating';
  const [draft, setDraft] = useState(q);
  useEffect(() => setDraft(q), [q]);

  const update = (patch) => setParams((prev) => {
    const next = new URLSearchParams(prev);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    return next;
  }, { replace: true });

  // Busca enquanto digita (com atraso), sem precisar apertar Enter.
  useEffect(() => {
    if (draft === q) return undefined;
    const t = setTimeout(() => update({ q: draft.trim() }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const { data, loading, error, retry } = useAsync(
    (signal) => fetchCompanies({ q, sector, sort }, signal),
    `${q}|${sector}|${sort}`,
  );

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-10">
          <p className="eyebrow">Empresas</p>
          <h1 className="mt-1.5 text-2xl font-extrabold sm:text-3xl">Avaliações de empresas</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Compare empresas por ambiente de trabalho, remuneração, crescimento, gestão e equilíbrio entre vida pessoal e
            profissional. Nesta demonstração, todas as notas são simuladas.
          </p>
        </div>
      </section>

      <div className="container-page space-y-6 py-8">
        <DemoNotice
          title="Avaliações simuladas"
          summary="As notas e quantidades de avaliações são geradas para demonstrar a funcionalidade. Elas não representam opiniões de funcionários reais nem a reputação verdadeira das empresas."
        >
          Marcas reais aparecem apenas como referência de navegação: não afirmamos que tenham unidades, vagas ou avaliações
          verificadas em Maricá, e não há parceria nem endosso. As médias são calculadas a partir de registros simulados
          (sem textos nem autores). "Mais bem avaliadas" considera apenas empresas com um número mínimo de avaliações;
          "Mais populares" mostra apenas quem tem mais avaliações — popularidade não indica qualidade.
        </DemoNotice>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="company-search" className="label">Buscar empresa</label>
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="company-search" type="text" value={draft} maxLength={80} autoComplete="off"
                onChange={(e) => setDraft(e.target.value)} placeholder="Nome da empresa ou setor"
                className="field pl-11 pr-10"
              />
              {draft && (
                <button type="button" onClick={() => setDraft('')} aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-surface hover:text-ink">
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <div className="lg:w-64">
            <label htmlFor="company-sector" className="label">Setor</label>
            <select id="company-sector" value={sector} onChange={(e) => update({ setor: e.target.value })} className="field">
              <option value="">Todos os setores</option>
              {(data?.sectors || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <fieldset className="min-w-0">
            <legend className="label">Ordenar por</legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
              {SORTS.map((s) => (
                <label key={s.value} className="cursor-pointer">
                  <input type="radio" name="sort" className="peer sr-only" checked={sort === s.value} onChange={() => update({ ordem: s.value === 'rating' ? '' : s.value })} />
                  <span className="block h-full rounded-lg px-2 py-2 sm:whitespace-nowrap sm:px-3 text-center text-[13px] font-medium text-slate-600 transition-colors peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-brand">
                    {s.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {data && (
          <p className="text-sm text-muted" aria-live="polite">
            {data.companies.length} {data.companies.length === 1 ? 'empresa' : 'empresas'}
            {sort === 'rating' && ` · ranking de nota a partir de ${data.minReviewsForRanking} avaliações`}
            {sort === 'popular' && ' · ordenadas pela quantidade de avaliações'}
          </p>
        )}

        {error && !data ? (
          <div className="card"><EmptyState tone="error" icon={CloudOff} title="Não foi possível carregar as empresas"
            action={<button type="button" onClick={retry} className="btn btn-md btn-primary"><RefreshCw size={16} aria-hidden="true" /> Tentar novamente</button>}>
            {error.message}
          </EmptyState></div>
        ) : !data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>
        ) : data.companies.length === 0 ? (
          <div className="card"><EmptyState icon={Building2} title="Nenhuma empresa encontrada"
            action={<button type="button" onClick={() => { setDraft(''); setParams({}, { replace: true }); }} className="btn btn-md btn-outline">Limpar busca e filtros</button>}>
            Tente outro nome ou remova o filtro de setor.
          </EmptyState></div>
        ) : (
          <ul className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
            {data.companies.map((c) => <li key={c.id} className="animate-fade-up"><CompanyCard company={c} sort={sort} /></li>)}
          </ul>
        )}
      </div>
    </>
  );
}
