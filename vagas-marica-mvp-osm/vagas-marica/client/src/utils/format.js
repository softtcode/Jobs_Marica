const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

export const NOT_INFORMED = 'Não informado';

export function formatSalary(salary) {
  if (!salary || (!salary.min && !salary.max)) return null;
  const { min, max } = salary;
  if (min && max && min !== max) return `${brl.format(min)} a ${brl.format(max)}`;
  return brl.format(min || max);
}

export const formatMoney = (n) => brl.format(n);

export function formatDistance(km, approx) {
  if (km == null) return null;
  if (km < 0.05) return 'no bairro';
  const v = km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km).toString();
  return `${approx ? '~' : ''}${v} km`;
}

export function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** "hoje", "ontem", "há 3 dias"… ou a data, para publicações mais antigas. */
export function formatRelativeDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 0) return formatDate(iso);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const companyInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : null);

export const MODE_LABEL = { remote: 'Remoto', hybrid: 'Híbrido', onsite: 'Presencial' };
export const TYPE_LABEL = { job: 'Emprego', freelance: 'Freelance' };
export const PRECISION_LABEL = {
  exact: 'Localização precisa',
  approximate: 'Localização aproximada',
  none: 'Sem localização confiável',
};
