const TONES = {
  gray: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-soft text-brand-dark',
  dark: 'bg-navy text-white',
  success: 'bg-success-soft text-success',
  outline: 'border border-dashed border-brand/60 bg-white text-brand-dark',
};

export default function Badge({ children, tone = 'gray', title, icon: Icon }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  );
}
