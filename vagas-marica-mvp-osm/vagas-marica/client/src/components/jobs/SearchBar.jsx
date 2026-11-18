import { Search, X } from 'lucide-react';

/**
 * Campo de busca por palavra-chave.
 * `size="lg"` é usado na página inicial; `md` nas páginas de vagas e mapa.
 */
export default function SearchBar({
  id, value, onChange, onSubmit, size = 'md', buttonLabel = 'Buscar', className = '',
  placeholder = 'Cargo, profissão ou palavra-chave',
}) {
  const lg = size === 'lg';
  return (
    <form
      role="search"
      className={`flex w-full items-center gap-2 rounded-2xl bg-white ${lg ? 'p-2 shadow-panel' : 'p-1.5 shadow-card ring-1 ring-line'} ${className}`}
      onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}
    >
      <label htmlFor={id} className="sr-only">Buscar por cargo, profissão ou palavra-chave</label>
      <div className="relative min-w-0 flex-1">
        <Search
          size={lg ? 20 : 18}
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${lg ? 'left-4' : 'left-3'}`}
          aria-hidden="true"
        />
        <input
          id={id}
          type="text"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={100}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl bg-transparent pr-9 text-ink placeholder:text-slate-500 focus:outline-none ${
            lg ? 'h-12 pl-12 text-base' : 'h-10 pl-10 text-sm'
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); }}
            aria-label="Limpar texto da busca"
            className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-surface hover:text-ink"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <button type="submit" className={`btn btn-primary shrink-0 ${lg ? 'btn-lg' : 'h-10 px-4 text-sm'}`}>
        <Search size={lg ? 18 : 16} className="sm:hidden" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{buttonLabel}</span>
      </button>
    </form>
  );
}
