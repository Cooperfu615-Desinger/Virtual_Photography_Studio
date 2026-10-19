import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Copy, Images, X } from 'lucide-react';
import './specifiedActionPicker.css';

const BASE_LABELS = { all: '全部', standing: '站立動態', none: '上身互動', sitting: '坐姿', kneeling: '跪姿', lying: '躺姿' };
const REFERENCE_SHEET = `${import.meta.env.BASE_URL}reference/specified-actions/pose-reference-sheet.jpeg`;
const REFERENCE_COLUMNS = [0, 261, 506, 754, 1000, 1254];
const REFERENCE_ROWS = [0, 252, 495, 739, 987, 1254];

function PoseReferenceImage({ option, compact = false }) {
  const cell = Number(option?.referenceNumber) - 1;
  if (!Number.isInteger(cell) || cell < 0 || cell >= 25) return null;
  const column = cell % 5;
  const row = Math.floor(cell / 5);
  const x = REFERENCE_COLUMNS[column] + 2;
  const y = REFERENCE_ROWS[row] + 2;
  const width = REFERENCE_COLUMNS[column + 1] - x - 2;
  const height = REFERENCE_ROWS[row + 1] - y - 2;
  return (
    <span className={`specified-action-image${compact ? ' specified-action-image-compact' : ''}`} aria-hidden="true">
      <img src={REFERENCE_SHEET} alt="" decoding="async"
        style={{ width: `${1254 / width * 100}%`, height: `${1254 / height * 100}%`,
          left: `${-x / width * 100}%`, top: `${-y / height * 100}%` }} />
    </span>
  );
}

function SpecifiedActionDialog({ options, value, onClose, onSelect }) {
  const [category, setCategory] = useState('all');
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose();
    } else if (event.key === 'Tab') {
      const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled)')]
        .filter((element) => element.getClientRects().length);
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  return createPortal(
    <div className="modal-backdrop specified-action-backdrop" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="modal-panel specified-action-dialog" role="dialog" aria-modal="true"
        aria-labelledby={titleId} aria-describedby={descriptionId} onKeyDown={handleKeyDown}>
        <div className="specified-action-dialog-header">
          <h3 id={titleId}>選擇指定動作 · 11 組</h3>
          <button ref={closeRef} type="button" className="icon-btn specified-action-close"
            aria-label="關閉指定動作選擇" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <p id={descriptionId} className="specified-action-reference-note">一次選取一組動作。圖像僅供姿勢參考；接管範圍以動作描述為準，新加入的三組先以文字呈現。</p>
        <div className="specified-action-filters" role="group" aria-label="動作分類">
          {Object.entries(BASE_LABELS).map(([id, label]) => <button key={id} type="button"
            className={category === id ? 'specified-action-selected' : 'secondary'} aria-pressed={category === id}
            onClick={() => setCategory(id)}>{label}</button>)}
        </div>
        <div className="specified-action-options" role="group" aria-label="指定動作清單">
          <button type="button" className={`specified-action-none${value === 'none' ? ' specified-action-selected' : ''}`}
            aria-pressed={value === 'none'} onClick={() => onSelect('none')}>
            <span>全無 · 使用原本的姿勢設定</span>
            {value === 'none' ? <Check size={17} aria-hidden="true" /> : null}
          </button>
          <div className="specified-action-card-grid">
            {options.filter(option => category === 'all' || option.baseId === category).map((option) => {
              const selected = option.id === value;
              return (
                <button key={option.id} type="button"
                  className={`specified-action-card${!option.referenceNumber ? ' specified-action-text-card' : ''}${selected ? ' specified-action-selected' : ''}`}
                  aria-pressed={selected} aria-label={`指定動作：${option.zh}`}
                  aria-describedby={`specified-action-${option.id}-description`}
                  onClick={() => onSelect(option.id)}>
                  <PoseReferenceImage option={option} />
                  <span className="specified-action-card-copy">
                    <span className="specified-action-card-title">
                      <strong>{options.indexOf(option) + 1}. {option.zh}</strong>
                      {selected ? <Check size={17} aria-hidden="true" /> : null}
                    </span>
                    <span id={`specified-action-${option.id}-description`} className="specified-action-card-description">{option.descriptionZh}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>, document.body,
  );
}

export default function SpecifiedActionPicker({ control, value, disabled = false, disabledReason = '', onChange, onCopy }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const options = control.options.filter((option) => option.id !== 'none');
  const selected = control.options.find((option) => option.id === value && option.baseId);
  const helpId = `${control.key}-help`;
  const helpText = disabledReason || control.helpText;
  const currentValue = value || 'none';

  if (isOpen && disabled) setIsOpen(false);

  const closeDialog = () => {
    setIsOpen(false);
    requestAnimationFrame(() => {
      if (triggerRef.current?.isConnected) triggerRef.current.focus();
    });
  };

  return (
    <div className={`field specified-action-field${disabled ? ' field-disabled' : ''}`}>
      <div className="field-heading-row">
        <span>{control.displayLabel || control.label}</span>
        <button type="button" className="icon-btn control-copy-icon-btn" disabled={disabled || !selected?.en}
          aria-label={`Copy ${control.label} prompt`} title={`Copy ${control.label} prompt`}
          onClick={() => onCopy(selected.en)}>
          <Copy size={14} aria-hidden="true" />
        </button>
      </div>
      <button ref={triggerRef} type="button" className={`specified-action-trigger${selected ? ' specified-action-trigger-selected' : ''}`}
        aria-label={`${control.label}：${selected?.zh || '全無'}`} aria-haspopup="dialog"
        aria-expanded={isOpen && !disabled} aria-describedby={helpText ? helpId : undefined} disabled={disabled}
        onClick={() => { setIsOpen(true); }}>
        {selected?.referenceNumber ? <PoseReferenceImage option={selected} compact /> : <Images size={19} aria-hidden="true" />}
        <span>{selected?.zh || '全無'}<small>選擇 11 組指定動作</small></span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {helpText ? <small id={helpId} className="field-help">{helpText}</small> : null}
      {isOpen && !disabled ? <SpecifiedActionDialog options={options} value={currentValue}
        onClose={closeDialog} onSelect={(id) => { onChange(id); closeDialog(); }} /> : null}
    </div>
  );
}
