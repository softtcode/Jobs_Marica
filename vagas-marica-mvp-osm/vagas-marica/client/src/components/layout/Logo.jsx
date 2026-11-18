import { Link } from 'react-router-dom';
import { palette } from '../../theme/palette.js';

/**
 * Marca própria do Jobs Maricá: monograma "J" com ponto de localização.
 * Não usa brasão, logotipo ou símbolo oficial da Prefeitura — só as cores remetem à cidade.
 *  - fundo claro: quadro grafite, "J" branco, ponto vermelho;
 *  - fundo escuro (`dark`): quadro um tom mais claro com contorno sutil e ponto rosa claro,
 *    para não se perder no fundo nem perder contraste.
 */
export function LogoMark({ size = 36, dark = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect
        width="32" height="32" rx="9"
        fill={dark ? palette.navy[800] : palette.navy.DEFAULT}
        stroke={dark ? 'rgba(255,255,255,.14)' : 'none'}
      />
      <path d="M12 8.5h6v11a4.75 4.75 0 0 1-9.5 0" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="23.5" cy="22.5" r="3" fill={dark ? palette.brand.light : palette.brand.DEFAULT} />
    </svg>
  );
}

export default function Logo({ dark = false, onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex items-center gap-2.5 rounded-lg" aria-label="Jobs Maricá — página inicial">
      <LogoMark dark={dark} />
      <span className={`font-display text-[17px] font-extrabold tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>
        {/* Sobre o escuro, o vermelho principal não tem contraste suficiente para texto: usa o rosa claro. */}
        Jobs<span className={dark ? 'text-brand-light' : 'text-brand'}> Maricá</span>
      </span>
    </Link>
  );
}
