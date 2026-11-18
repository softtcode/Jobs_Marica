import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, Calculator, CloudOff, Info, RefreshCw, Trophy, Users } from 'lucide-react';
import StarRating, { formatRating } from '../components/companies/StarRating.jsx';
import CompanyBadges from '../components/companies/CompanyBadges.jsx';
import { CompanyAvatar } from '../components/jobs/JobCard.jsx';
import { EmptyState } from '../components/ui/Notice.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { fetchCompany } from '../services/api.js';
import { MODE_LABEL } from '../utils/format.js';

function Bar({ label, value, max = 5, suffix }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="font-semibold text-ink">{suffix ?? formatRating(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
      </div>
    </div>
  );
}

export default function CompanyDetailsPage() {
  const { id } = useParams();
  const { data, error, retry } = useAsync((signal) => fetchCompany(id, signal), id);
  usePageTitle(data?.company?.name || 'Empresa');

  const back = (
    <Link to="/empresas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
      <ArrowLeft size={16} aria-hidden="true" /> Todas as empresas
    </Link>
  );

  if (error) {
    const notFound = /não encontrada/i.test(error.message);
    return (
      <div className="container-page py-10">
        {back}
        <div className="card mt-6">
          <EmptyState tone={notFound ? 'neutral' : 'error'} icon={CloudOff} title={notFound ? 'Empresa não encontrada' : 'Não foi possível carregar a empresa'}
            action={!notFound && <button type="button" onClick={retry} className="btn btn-md btn-primary"><RefreshCw size={16} aria-hidden="true" /> Tentar novamente</button>}>
            {error.message}
          </EmptyState>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="container-page space-y-4 py-10" aria-busy="true">
        {back}
        <div className="skeleton h-40 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2"><div className="skeleton h-64 rounded-2xl" /><div className="skeleton h-64 rounded-2xl" /></div>
      </div>
    );
  }

  const { company: c, criteria, jobs, totalCompanies, minReviewsForRanking } = data;
  const maxDist = Math.max(...Object.values(c.distribution));

  return (
    <div className="container-page space-y-6 py-8 sm:py-10">
      {back}

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-6 bg-gradient-to-br from-brand-soft/70 to-white p-6 sm:flex-row sm:items-center sm:p-8">
          <CompanyAvatar name={c.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-extrabold sm:text-3xl">{c.name}</h1>
            <p className="mt-1 text-sm text-muted">{c.sector}</p>
            <div className="mt-3"><CompanyBadges company={c} /></div>
          </div>
          <div className="rounded-2xl border border-line bg-white px-6 py-4 text-center shadow-card">
            <p className="font-display text-4xl font-extrabold text-ink">{formatRating(c.average)}</p>
            <StarRating value={c.average} size={18} />
            <p className="mt-1 text-xs text-muted">{c.reviewCount} avaliações simuladas</p>
          </div>
        </div>
        <div className="grid gap-px border-t border-line bg-line sm:grid-cols-2">
          <div className="flex items-center gap-3 bg-white p-4 text-sm">
            <Trophy size={18} className="text-brand" aria-hidden="true" />
            {c.rankingEligible
              ? <span><strong>#{c.ratingRank}</strong> em média de estrelas entre as empresas com {minReviewsForRanking}+ avaliações</span>
              : <span>Fora do ranking de nota: menos de {minReviewsForRanking} avaliações</span>}
          </div>
          <div className="flex items-center gap-3 bg-white p-4 text-sm">
            <Users size={18} className="text-brand" aria-hidden="true" />
            <span><strong>#{c.popularityRank}</strong> de {totalCompanies} em quantidade de avaliações (popularidade)</span>
          </div>
        </div>
      </section>

      <p className="flex gap-2 rounded-xl border border-warning/25 bg-warning-soft p-3.5 text-[13px] leading-relaxed text-warning">
        <Info size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
        {c.isReal
          ? 'Marca real usada apenas como referência. A nota é simulada: não representa a opinião de funcionários nem a reputação verdadeira da empresa, e não há afirmação de unidades ou vagas em Maricá.'
          : 'Empresa fictícia criada para a demonstração. Notas e quantidades de avaliações são simuladas.'}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="crit-title">
          <h2 id="crit-title" className="text-lg font-bold">Notas por critério</h2>
          <p className="mt-1 text-xs text-muted">Média de 1 a 5 estrelas em cada critério.</p>
          <div className="mt-5 space-y-4">
            {Object.entries(criteria).map(([key, label]) => <Bar key={key} label={label} value={c.criteria[key]} />)}
          </div>
        </section>

        <section className="card p-6" aria-labelledby="dist-title">
          <h2 id="dist-title" className="text-lg font-bold">Distribuição das notas</h2>
          <p className="mt-1 text-xs text-muted">Nota geral de cada avaliação simulada, arredondada.</p>
          <div className="mt-5 space-y-4">
            {[5, 4, 3, 2, 1].map((n) => (
              <Bar key={n} label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`} value={c.distribution[n]} max={maxDist} suffix={c.distribution[n]} />
            ))}
          </div>
          <p className="mt-6 flex gap-2 rounded-xl bg-surface p-3 text-xs leading-relaxed text-muted">
            <Calculator size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            A nota geral de cada registro é a média dos cinco critérios; a média da empresa é a média desses registros.
          </p>
        </section>
      </div>

      <section className="card p-6" aria-labelledby="jobs-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="jobs-title" className="flex items-center gap-2 text-lg font-bold"><Briefcase size={18} className="text-brand" aria-hidden="true" /> Oportunidades desta empresa</h2>
          {jobs.length > 0 && (
            <Link to={`/vagas?empresa=${encodeURIComponent(c.id)}`} className="btn btn-sm btn-primary">
              Ver {jobs.length === 1 ? 'a vaga' : `as ${jobs.length} vagas`} desta empresa
            </Link>
          )}
        </div>
        {jobs.length === 0 ? (
          <p className="mt-2 rounded-xl bg-surface p-3 text-sm text-muted">
            {c.isReal
              ? 'Não há vagas desta marca na plataforma. Nesta demonstração, marcas reais aparecem apenas nas avaliações (simuladas), sem vagas associadas.'
              : 'Esta empresa não tem oportunidades cadastradas no momento.'}
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {jobs.map((j) => (
              <li key={j.id}>
                <Link to={`/vagas?empresa=${encodeURIComponent(c.id)}&vaga=${encodeURIComponent(j.id)}`} className="flex h-full flex-col rounded-xl border border-line p-4 transition-colors hover:border-brand/40 hover:bg-brand-soft/40">
                  <span className="font-semibold text-ink">{j.title}</span>
                  <span className="mt-1 text-xs text-muted">{j.contractType} · {MODE_LABEL[j.mode]}{j.neighborhood ? ` · ${j.neighborhood}` : ''}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
