import { Link } from 'react-router-dom';

/** Marca Jobs Maricá: monograma "J" com ponto de localização. */
export function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="9" fill="#101827" />
      <path d="M12 8.5h6v11a4.75 4.75 0 0 1-9.5 0" fill="none" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
      <circle cx="23.5" cy="22.5" r="3" fill="#2563EB" />
    </svg>
  );
}

export default function Logo({ dark = false, onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-2.5 rounded-lg" aria-label="Jobs Maricá — página inicial">
      <LogoMark />
      <span className={`font-display text-[17px] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>
        Jobs<span className="text-brand"> Maricá</span>
      </span>
    </Link>
  );
}
