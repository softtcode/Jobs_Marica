import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// Pilha de painéis abertos: com um modal sobre outro, só o de cima responde ao teclado.
const openStack = [];

/**
 * Painel modal deslizante (filtros, lista e detalhes no celular).
 * Fecha com Esc ou clique no fundo, prende o foco e devolve o foco ao sair.
 */
export default function Drawer({ open, onClose, title, ariaLabel, side = 'right', children, footer, bare = false }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const panel = panelRef.current;
    panel?.querySelector(FOCUSABLE)?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const token = {};
    openStack.push(token);

    const onKey = (e) => {
      if (openStack[openStack.length - 1] !== token) return;
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); }
      if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      openStack.splice(openStack.indexOf(token), 1);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const position = side === 'bottom'
    ? 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl animate-slide-up'
    : side === 'left'
      ? 'inset-y-0 left-0 w-[min(92vw,400px)] animate-slide-in-left'
      : 'inset-y-0 right-0 w-[min(92vw,420px)] animate-slide-in';

  const center = side === 'center';
  return createPortal(
    <div className={`fixed inset-0 z-[1000] ${center ? 'grid place-items-center p-4' : ''}`}>
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        className={center
          ? 'relative flex max-h-[90dvh] w-full max-w-lg animate-fade-up flex-col overflow-hidden rounded-2xl bg-white shadow-panel'
          : `absolute flex flex-col overflow-hidden bg-white shadow-panel ${position} ${bare && side === 'bottom' ? 'h-[92dvh]' : ''}`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-base font-bold">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Fechar" className="btn btn-ghost h-10 w-10 p-0">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        )}
        {bare ? children : <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">{children}</div>}
        {footer && <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
