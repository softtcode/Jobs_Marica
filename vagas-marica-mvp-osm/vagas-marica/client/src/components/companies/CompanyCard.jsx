import { Link } from 'react-router-dom';
import { ArrowRight, Trophy, Users } from 'lucide-react';
import StarRating from './StarRating.jsx';
import CompanyBadges from './CompanyBadges.jsx';
import { CompanyAvatar } from '../jobs/JobCard.jsx';

export default function CompanyCard({ company, sort }) {
  const rank = sort === 'popular' ? company.popularityRank : company.ratingRank;
  return (
    <Link
      to={`/empresas/${company.id}`}
      className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift"
    >
      <div className="flex items-start gap-3">
        <CompanyAvatar name={company.name} size="lg" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-bold text-ink group-hover:text-brand-dark">{company.name}</h3>
          <p className="text-[13px] text-muted">{company.sector}</p>
        </div>
        {sort !== 'name' && rank != null && (
          <span
            className={`grid h-9 min-w-9 place-items-center rounded-xl px-2 font-display text-sm font-extrabold ${rank <= 3 ? 'bg-navy text-brand-light' : 'bg-surface text-slate-600'}`}
            title={sort === 'popular' ? 'Posição por quantidade de avaliações' : 'Posição por média de estrelas'}
          >
            {rank <= 3 && <Trophy size={13} className="mb-0.5" aria-hidden="true" />}#{rank}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <StarRating value={company.average} showValue />
        <span className="inline-flex items-center gap-1 text-xs text-muted">
          <Users size={13} aria-hidden="true" /> {company.reviewCount} avaliações simuladas
        </span>
      </div>
      {!company.rankingEligible && sort === 'rating' && (
        <p className="mt-2 text-xs text-warning">Poucas avaliações: fora do ranking de nota.</p>
      )}

      <div className="mt-4 flex flex-1 items-end justify-between gap-2">
        <CompanyBadges company={company} />
        <ArrowRight size={18} className="shrink-0 text-slate-300 transition-colors group-hover:text-brand" aria-hidden="true" />
      </div>
    </Link>
  );
}
