import { useState } from 'react';
import { ChevronDown, FlaskConical } from 'lucide-react';

/**
 * Aviso de "Ambiente de demonstração". Sempre visível (título + resumo);
 * o texto completo pode ser expandido para não ocupar espaço demais.
 */
export default function DemoNotice({ title = 'Ambiente de demonstração', summary, children, compact = false }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-2xl border border-brand/20 bg-gradient-to-r from-brand-soft to-white ${compact ? 'p-3' : 'p-4'}`} role="note">
      <div className="flex gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy text-brand-light" aria-hidden="true">
          <FlaskConical size={16} />
        </span>
        <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-slate-700">
          <p className="font-semibold text-ink">{title}</p>
          <p>{summary}</p>
          {children && open && <div className="mt-1.5">{children}</div>}
          {children && (
            <button
              type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-dark hover:underline"
            >
              {open ? 'Mostrar menos' : 'Saiba mais'}
              <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Texto padrão do aviso nas páginas de vagas. */
export function JobsDemoNotice({ compact }) {
  return (
    <DemoNotice
      compact={compact}
      summary="As vagas desta plataforma são fictícias e foram criadas exclusivamente para demonstrar o funcionamento do Jobs Maricá."
    >
      Em uma versão com oportunidades reais, o usuário seria direcionado à página original da vaga para realizar sua
      candidatura. Empresas, salários e localizações são demonstrativos; os pontos no mapa indicam apenas uma referência
      aproximada do bairro.
    </DemoNotice>
  );
}
