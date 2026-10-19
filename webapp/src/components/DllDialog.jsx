import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function DllDialog({ onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const siblings = [...document.body.children].filter(el => !el.contains(ref.current));
    const inert = siblings.map(el => el.inert);
    siblings.forEach(el => { el.inert = true; });
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const key = event => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const items = [...ref.current.querySelectorAll('button:not(:disabled), select:not(:disabled), input:not(:disabled), [tabindex="0"]')];
      if (!items.length) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === items[0] || document.activeElement === ref.current)) { event.preventDefault(); items.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); siblings.forEach((el, i) => { el.inert = inert[i]; }); document.body.style.overflow = overflow; previous?.focus(); };
  }, [onClose]);
  return createPortal(<div className="dll-upscale-backdrop" onClick={onClose}><section ref={ref} tabIndex={-1} className="dll-upscale-dialog" role="dialog" aria-modal="true" aria-label="提升解析度" onClick={event => event.stopPropagation()}>{children}</section></div>, document.body);
}
