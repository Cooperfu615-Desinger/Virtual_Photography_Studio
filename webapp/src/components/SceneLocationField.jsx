import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Copy, Search, X } from 'lucide-react';
import { filterSceneLocations, getSceneLocationOptions } from '../features/page1/sceneLocationOptions.js';
import './sceneLocationField.css';

function getLocationLabel(option) {
  return option?.zh || option?.label || option?.id || '隨機';
}

function SceneLocationDialog({ control, value, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const titleId = useId();
  const options = filterSceneLocations(getSceneLocationOptions(control), query);

  useEffect(() => {
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled)')]
        .filter((element) => element.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }

    const optionButtons = [...event.currentTarget.querySelectorAll('[data-scene-location-option]:not(:disabled)')];
    const activeIndex = optionButtons.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' && (document.activeElement === inputRef.current || activeIndex >= 0)) {
      event.preventDefault();
      optionButtons[(activeIndex + 1) % optionButtons.length]?.focus();
    } else if (event.key === 'ArrowUp' && activeIndex >= 0) {
      event.preventDefault();
      optionButtons[(activeIndex - 1 + optionButtons.length) % optionButtons.length]?.focus();
    }
  };

  return createPortal(
    <div className="modal-backdrop scene-location-backdrop" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="modal-panel scene-location-dialog" role="dialog" aria-modal="true"
        aria-labelledby={titleId} onKeyDown={handleKeyDown}>
        <div className="scene-location-dialog-header">
          <h3 id={titleId}>選擇場景</h3>
          <button type="button" className="icon-btn scene-location-close" aria-label="關閉場景選擇" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="scene-location-search">
          <Search size={17} aria-hidden="true" />
          <input ref={inputRef} className="text-input" type="search" value={query}
            aria-label="搜尋場景" placeholder="搜尋中文場景或英文關鍵字"
            onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="scene-location-results" role="group" aria-label="場景選項">
          {options.map((option) => {
            const selected = option.id === (value || '');
            return (
              <button key={option.id} type="button" data-scene-location-option="true"
                className={`scene-location-option${selected ? ' scene-location-option-selected' : ''}`}
                aria-pressed={selected} disabled={option.disabled}
                onClick={() => onSelect(option.id)}>
                <span>{getLocationLabel(option)}</span>
                {selected ? <Check size={17} aria-hidden="true" /> : null}
              </button>
            );
          })}
          {options.length === 0 ? <p className="scene-location-empty" role="status">找不到符合的場景</p> : null}
        </div>
      </div>
    </div>, document.body,
  );
}

export default function SceneLocationField({ control, value, onChange, onCopy, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const selectedOption = control.options.find((option) => option.id === value);
  const selectedLabel = getLocationLabel(selectedOption);
  const isMuted = !value || selectedOption?.zh === '全無';
  const copyText = value && selectedOption?.zh !== '全無' ? selectedOption?.en || '' : '';
  const helpId = `${control.key}-help`;

  const closeDialog = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className={`field scene-location-field${disabled ? ' field-disabled' : ''}`}>
      <div className="field-heading-row">
        <span>{control.displayLabel || control.label}</span>
        <button type="button" className="icon-btn control-copy-icon-btn" disabled={disabled || !copyText}
          onClick={() => onCopy(copyText)} title={`Copy ${control.label} prompt`} aria-label={`Copy ${control.label} prompt`}>
          <Copy size={14} aria-hidden="true" />
        </button>
      </div>
      <button ref={triggerRef} type="button"
        className={`scene-location-trigger${isMuted ? ' scene-location-trigger-muted' : ''}`}
        aria-label={`${control.label}：${selectedLabel}`} aria-haspopup="dialog" aria-expanded={isOpen && !disabled}
        aria-describedby={control.helpText ? helpId : undefined} disabled={disabled}
        onClick={() => setIsOpen(true)}>
        <Search size={16} aria-hidden="true" />
        <span>{selectedLabel}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {control.helpText ? <small id={helpId} className="field-help">{control.helpText}</small> : null}
      {isOpen && !disabled ? <SceneLocationDialog control={control} value={value} onClose={closeDialog}
        onSelect={(optionId) => { onChange(optionId); closeDialog(); }} /> : null}
    </div>
  );
}
