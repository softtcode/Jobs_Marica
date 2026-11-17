import { Link } from 'react-router-dom';
import { FileText, FileUp, Layers, Sparkles } from 'lucide-react';
import { MATCH_CONFIG } from '../../services/matchingService.js';

/** Abas "Para Você" / "Outras Vagas" (mutuamente exclusivas, sobre o resultado já filtrado). */
export function MatchTabs({ tab, onTab, counts, compact = false }) {
  const items = [
    { id: 'forYou', label: 'Para Você', icon: Sparkles, count: counts?.forYou },
    { id: 'others', label: 'Outras Vagas', icon: Layers, count: counts?.others },
  ];
  return (
    <div>
      <div role="tablist" aria-label="Separação por compatibilidade" className="grid grid-cols-2 gap-1 rounded-2xl bg-white p-1 shadow-card ring-1 ring-line">
        {items.map(({ id, label, icon: Icon, count }) => {
          const active = tab === id;
          return (
            <button
              key={id} type="button" role="tab" aria-selected={active} aria-controls="results-panel"
              onClick={() => onTab(id)}
              className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2.5 text-[13px] font-semibold transition-colors sm:gap-2 sm:px-3 sm:text-sm ${active ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:bg-surface hover:text-ink'}`}
            >
              <Icon size={16} className={`hidden min-[400px]:block ${active ? 'text-brand-light' : ''}`} aria-hidden="true" />
              {label}
              {count != null && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${active ? 'bg-white/15 text-white' : 'bg-surface text-slate-600'}`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-muted">
          <span>“Para Você”: compatibilidade estimada de {MATCH_CONFIG.threshold}% ou mais com o seu perfil. É uma estimativa, não uma chance de contratação.</span>
          <Link to="/curriculo" className="shrink-0 font-semibold text-brand-dark hover:underline">Editar perfil</Link>
        </p>
      )}
    </div>
  );
}

/** Orientação quando não há currículo: a pessoa continua explorando todas as vagas. */
export function ResumeCTA() {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand" aria-hidden="true"><Sparkles size={20} /></span>
        <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-slate-600">
          <p className="font-semibold text-ink">Quer ver primeiro as vagas que combinam com você?</p>
          Responda o Perfil Rápido (leva cerca de 1 minuto) ou importe seu currículo. Não é obrigatório: todas as vagas
          estão abaixo.
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 pl-[3.25rem]">
        <Link to="/curriculo?modo=rapido" className="btn btn-sm btn-primary"><FileText size={15} aria-hidden="true" /> Criar Perfil Rápido</Link>
        <Link to="/curriculo?modo=completo#importar" className="btn btn-sm btn-outline"><FileUp size={15} aria-hidden="true" /> Importar currículo</Link>
      </div>
    </div>
  );
}
