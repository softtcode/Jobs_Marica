import { useId, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

/** Cartão de seção do formulário. `highlight` marca campos sugeridos pela importação. */
export function Section({ id, title, description, icon: Icon, highlight, children, action }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`card scroll-mt-24 p-5 sm:p-6 ${highlight ? 'ring-2 ring-brand/30' : ''}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex gap-3">
          {Icon && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Icon size={18} aria-hidden="true" /></span>}
          <div>
            <h2 id={`${id}-title`} className="text-base font-bold text-ink">
              {title}
              {highlight && <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 align-middle text-[11px] font-semibold text-brand-dark">sugerido pela importação</span>}
            </h2>
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, hint, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Lista de etiquetas com digitação livre e sugestões do dicionário. */
export function TagInput({ id, label, values, onChange, suggestions = [], placeholder, hint }) {
  const [draft, setDraft] = useState('');
  const listId = useId();
  const add = (raw) => {
    const items = raw.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    const lower = new Set(values.map((v) => v.toLowerCase()));
    onChange([...values, ...items.filter((i) => !lower.has(i.toLowerCase()))].slice(0, 40));
    setDraft('');
  };
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-white p-2 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-3 pr-1 text-[13px] font-medium text-brand-dark">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remover ${v}`}
              className="grid h-5 w-5 place-items-center rounded-full hover:bg-white">
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id} list={listId} value={draft} maxLength={60}
          onChange={(e) => (/[,;]$/.test(e.target.value) ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(draft); }
            if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
          }}
          onBlur={() => add(draft)}
          placeholder={values.length ? 'Adicionar…' : placeholder}
          className="h-8 min-w-[10rem] flex-1 bg-transparent px-1.5 text-sm placeholder:text-slate-500 focus:outline-none"
        />
        <datalist id={listId}>{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
      </div>
      <p className="mt-1 text-xs text-muted">{hint || 'Pressione Enter ou vírgula para adicionar.'}</p>
    </div>
  );
}

/** Seleção múltipla em "chips" (checkboxes acessíveis). */
export function ChipGroup({ legend, options, values, onChange, hint }) {
  const toggle = (v) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const value = o.value ?? o.id ?? o;
          const label = o.label ?? o;
          return (
            <label key={value} className="cursor-pointer">
              <input type="checkbox" className="peer sr-only" aria-label={label} checked={values.includes(value)} onChange={() => toggle(value)} />
              <span className="inline-flex items-center rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-brand/50 hover:bg-brand-soft/40 peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:font-semibold peer-checked:text-brand-dark peer-checked:before:mr-1 peer-checked:before:content-['✓'] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                {label}
              </span>
            </label>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </fieldset>
  );
}

/** Lista de itens repetíveis (experiências, formações, cursos, idiomas). */
export function RepeatableList({ items, onChange, empty, addLabel, renderItem, itemLabel, max = 10 }) {
  const update = (i, patch) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-muted">{empty}</p>}
      {items.map((item, i) => (
        <div key={i} className="relative rounded-xl border border-line bg-surface/60 p-4">
          <button type="button" onClick={() => remove(i)} aria-label={`Remover ${itemLabel} ${i + 1}`}
            className="btn btn-ghost absolute right-2 top-2 h-8 w-8 p-0 hover:text-danger">
            <Trash2 size={16} aria-hidden="true" />
          </button>
          {renderItem(item, (patch) => update(i, patch), i)}
        </div>
      ))}
      {items.length < max && (
        <button type="button" onClick={() => onChange([...items, {}])} className="btn btn-sm btn-outline">
          <Plus size={16} aria-hidden="true" /> {addLabel}
        </button>
      )}
    </div>
  );
}
