import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';
import { downloadImageFile } from '../lib/imageDownload.js';
import { downloadMagnificImageViaFirebase } from '../lib/magnificProxyClient.js';

export default function DllImageViewer({ images, onClose }) {
  const dialog = useRef(null);
  const [zoom, setZoom] = useState(0);
  const [error, setError] = useState('');
  const [sizes, setSizes] = useState({});
  const drag = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const panes = useRef([]);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const siblings = [...document.body.children].filter(el => !el.contains(dialog.current));
    const inert = siblings.map(el => el.inert);
    siblings.forEach(el => { el.inert = true; });
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const escape = event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const buttons = [...dialog.current.querySelectorAll('button:not(:disabled)')];
        if (event.shiftKey && (document.activeElement === buttons[0] || document.activeElement === dialog.current)) { event.preventDefault(); buttons.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
      }
    };
    window.addEventListener('keydown', escape);
    const root = dialog.current;
    const wheel = event => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setZoom(value => Math.max(.25, Math.min(4, (value || 1) - Math.sign(event.deltaY) * .25)));
    };
    root.addEventListener('wheel', wheel, { passive: false });
    return () => { root.removeEventListener('wheel', wheel); siblings.forEach((el, index) => { el.inert = inert[index]; }); document.body.style.overflow = overflow; window.removeEventListener('keydown', escape); previous?.focus(); };
  }, [onClose]);
  const sync = (pane, x, y) => panes.current.forEach(other => {
    if (other !== pane) { other.scrollLeft = x * Math.max(0, other.scrollWidth - other.clientWidth); other.scrollTop = y * Math.max(0, other.scrollHeight - other.clientHeight); }
  });
  return createPortal(<div className="dll-viewer-backdrop" onClick={onClose}>
    <div className="dll-image-viewer" role="dialog" aria-modal="true" aria-label="圖片檢視與比較" tabIndex={-1} ref={dialog} onClick={event => event.stopPropagation()}>
      <header><strong>{images.length > 1 ? '圖片比較 · 同步縮放與拖曳' : '檢視大圖'}</strong><div className="dll-row">
        <button className="secondary" onClick={() => setZoom(0)}><Maximize2 size={16} />適合視窗</button>
        <button className="secondary" onClick={() => setZoom(1)}>100%</button>
        <button className="secondary" aria-label="縮小" onClick={() => setZoom(Math.max(.25, (zoom || 1) - .25))}><ZoomOut size={18} /></button>
        <button className="secondary" aria-label="放大" onClick={() => setZoom(Math.min(4, (zoom || 1) + .25))}><ZoomIn size={18} /></button>
        <button className="secondary" onClick={onClose}><X size={18} />關閉</button>
      </div></header>
      {error && <p role="alert">{error}</p>}
      <div className={`dll-viewer-panes ${images.length > 1 ? 'comparing' : ''}`}>
        {images.map((image, index) => <section key={image.key || index}><div className="dll-row"><span>{image.label || `第 ${index + 1} 張`}</span>
          <button className="dll-text-button" onClick={async () => { try { await downloadImageFile({ src: image.src, index, remoteDownload: downloadMagnificImageViaFirebase }); } catch (e) { setError(e.message); } }}><Download size={14} />下載</button></div>
          <div className="dll-pan" ref={el => { panes.current[index] = el; }}
            onPointerDown={event => {
              pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
              event.currentTarget.setPointerCapture(event.pointerId);
              if (pointers.current.size === 2) {
                const [a, b] = [...pointers.current.values()];
                const img = event.currentTarget.querySelector('img');
                pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom: zoom || img.clientWidth / img.naturalWidth };
                drag.current = null;
              } else if (zoom) drag.current = { x: event.clientX, y: event.clientY, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
            }}
            onPointerMove={event => {
              if (!pointers.current.has(event.pointerId)) return;
              pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
              if (pinch.current && pointers.current.size === 2) {
                const [a, b] = [...pointers.current.values()];
                setZoom(Math.max(.25, Math.min(4, pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinch.current.distance))));
                return;
              }
              if (!drag.current) return;
              const pane = event.currentTarget; pane.scrollLeft = drag.current.left - event.clientX + drag.current.x; pane.scrollTop = drag.current.top - event.clientY + drag.current.y;
              sync(pane, pane.scrollLeft / Math.max(1, pane.scrollWidth - pane.clientWidth), pane.scrollTop / Math.max(1, pane.scrollHeight - pane.clientHeight));
            }}
            onPointerUp={event => { pointers.current.delete(event.pointerId); drag.current = null; pinch.current = null; }} onPointerCancel={event => { pointers.current.delete(event.pointerId); drag.current = null; pinch.current = null; }}>
            <img src={image.src} alt={image.label || '生成圖片'} draggable={false} onLoad={event => { const width = event.currentTarget.naturalWidth; setSizes(previous => ({ ...previous, [index]: width })); }}
              style={zoom ? { width: `${(sizes[index] || image.meta?.width || 1024) * zoom}px`, maxWidth: 'none', maxHeight: 'none' } : undefined} />
          </div>
        </section>)}
      </div>
    </div>
  </div>, document.body);
}
