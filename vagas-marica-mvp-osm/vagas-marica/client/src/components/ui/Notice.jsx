import { AlertTriangle, Info, OctagonAlert, SearchX } from 'lucide-react';

// O vermelho da marca e o de erro são parecidos: por isso cada tom tem ÍCONE próprio
// (erro = octógono, aviso = triângulo, info = "i") e o texto do título descreve a situação.
// "Info" é neutro (nunca vermelho), para não parecer um erro.
const ICONS = { error: OctagonAlert, info: Info, warning: AlertTriangle, empty: SearchX };
const STYLES = {
  error: 'border-danger/25 bg-danger-soft text-danger',
  warning: 'border-warning/25 bg-warning-soft text-warning',
  info: 'border-line bg-white text-slate-700',
  empty: 'border-line bg-white text-slate-700',
};
const ICON_STYLES = { error: 'text-danger', warning: 'text-warning', info: 'text-navy-700', empty: 'text-muted' };

export default function Notice({ tone = 'info', title, children, action }) {
  const Icon = ICONS[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border p-3.5 text-sm ${STYLES[tone]}`}>
      <div className="flex gap-3">
        <Icon size={18} className={`mt-0.5 shrink-0 ${ICON_STYLES[tone]}`} aria-hidden="true" />
        <div className="min-w-0">
          {title && <p className="font-semibold text-ink">{title}</p>}
          {children && <div className={title ? 'mt-0.5 text-[13px] leading-relaxed' : ''}>{children}</div>}
          {action && <div className="mt-2.5 flex flex-wrap gap-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}

/** Estado vazio/erro em destaque (centro de uma área de conteúdo). */
export function EmptyState({ icon: Icon = SearchX, title, children, action, tone = 'neutral' }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center" role={tone === 'error' ? 'alert' : 'status'}>
      <span className={`grid h-14 w-14 place-items-center rounded-2xl ${tone === 'error' ? 'bg-danger-soft text-danger ring-1 ring-danger/20' : 'bg-slate-100 text-navy-700'}`}>
        <Icon size={26} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      {children && <div className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="card p-4" aria-hidden="true">
      <div className="flex gap-3">
        <div className="skeleton h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-5 w-20 rounded-full" />
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-24 rounded-full" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando vagas">
      {Array.from({ length: count }, (_, i) => <JobCardSkeleton key={i} />)}
    </div>
  );
}
