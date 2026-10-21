import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Images, Pencil, X } from 'lucide-react';
import './specifiedActionPicker.css';

// Pose UI v2 (Cooper 2026-10-21): the main panel shows 全無／隨機／任意 as cards plus six
// category buttons; a category button opens a dialog listing only that category.
const CATEGORIES = [
  { baseId: 'standing', label: '站姿' },
  { baseId: 'squatting', label: '蹲姿' },
  { baseId: 'none', label: '上身互動' },
  { baseId: 'sitting', label: '坐姿' },
  { baseId: 'kneeling', label: '跪姿' },
  { baseId: 'lying', label: '躺姿' },
];
const NONE_CARD = { id: 'none', zh: '全無', descriptionZh: '不寫任何姿勢。' };
const REFERENCE_SHEET = `${import.meta.env.BASE_URL}reference/specified-actions/pose-reference-sheet.jpeg`;
const REFERENCE_COLUMNS = [0, 261, 506, 754, 1000, 1254];
const REFERENCE_ROWS = [0, 252, 495, 739, 987, 1254];

function PoseReferenceImage({ option }) {
  const cell = Number(option?.referenceNumber) - 1;
  if (!Number.isInteger(cell) || cell < 0 || cell >= 25) return null;
  const column = cell % 5;
  const row = Math.floor(cell / 5);
  const x = REFERENCE_COLUMNS[column] + 2;
  const y = REFERENCE_ROWS[row] + 2;
  const width = REFERENCE_COLUMNS[column + 1] - x - 2;
  const height = REFERENCE_ROWS[row + 1] - y - 2;
  return (
    <span className="specified-action-image" aria-hidden="true">
      <img src={REFERENCE_SHEET} alt="" decoding="async" loading="lazy"
        style={{ width: `${1254 / width * 100}%`, height: `${1254 / height * 100}%`,
          left: `${-x / width * 100}%`, top: `${-y / height * 100}%` }} />
    </span>
  );
}

// A fixed 2:3 slot: the existing sheet crop sits inside it, and actions without a
// schematic show a neutral placeholder, so adding images later does not move the layout.
function ActionImageSlot({ option }) {
  const image = option?.referenceNumber ? <PoseReferenceImage option={option} /> : null;
  return (
    <span className={`specified-action-slot${image ? '' : ' specified-action-slot-empty'}`} aria-hidden="true">
      {image || <Images size={20} />}
    </span>
  );
}

const isMenuChoice = option => Boolean(option?.meta?.tags?.includes('menu_choice'));

function SpecifiedActionDialog({ category, options, value, onClose, onSelect }) {
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
          <h3 id={titleId}>{category.label} · {options.length} 組</h3>
          <button ref={closeRef} type="button" className="icon-btn specified-action-close"
            aria-label="關閉指定動作選擇" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <p id={descriptionId} className="specified-action-reference-note">一次選取一組動作；接管範圍以動作描述為準。</p>
        <div className="specified-action-options" role="group" aria-label={`${category.label}動作清單`}>
          <div className="specified-action-card-grid">
            {options.map((option) => {
              const selected = option.id === value;
              return (
                <button key={option.id} type="button"
                  className={`specified-action-card${selected ? ' specified-action-selected' : ''}`}
                  aria-pressed={selected} aria-label={`指定動作：${option.zh}`}
                  aria-describedby={`specified-action-${option.id}-description`}
                  onClick={() => onSelect(option.id)}>
                  <ActionImageSlot option={option} />
                  <span className="specified-action-card-copy">
                    <span className="specified-action-card-title">
                      <strong>{option.zh}</strong>
                      {/* Standing library v1 (Cooper 2026-10-20): pending actions are selectable but not in 隨機. */}
                      {option.validation?.status === 'pending' ? <span className="specified-action-pending">未驗收</span> : null}
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
  const [dialogBaseId, setDialogBaseId] = useState(null);
  const triggerRef = useRef(null);
  const options = control.options.filter((option) => option.id !== 'none' && !isMenuChoice(option));
  const menuCards = [NONE_CARD, ...control.options.filter(isMenuChoice)];
  // 隨機 and 任意 carry a baseId too; they are menu cards, never the summary card.
  const selected = control.options.find((option) => option.id === value && option.baseId && !isMenuChoice(option));
  const helpId = `${control.key}-help`;
  const helpText = disabledReason || control.helpText;
  const currentValue = value || 'none';
  const counts = Object.fromEntries(CATEGORIES.map(({ baseId }) => [baseId, options.filter((option) => option.baseId === baseId).length]));
  const dialogCategory = CATEGORIES.find((category) => category.baseId === dialogBaseId);

  if (dialogBaseId && disabled) setDialogBaseId(null);

  const openDialog = (baseId, trigger) => {
    triggerRef.current = trigger;
    setDialogBaseId(baseId);
  };
  const closeDialog = () => {
    setDialogBaseId(null);
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
      <div className="specified-action-menu" role="group" aria-label="姿勢方式">
        {menuCards.map((card) => {
          const active = currentValue === card.id;
          return (
            <button key={card.id} type="button" disabled={disabled}
              className={`specified-action-menu-card${active ? ' specified-action-selected' : ''}`}
              aria-pressed={active} aria-describedby={helpText ? helpId : undefined}
              onClick={() => onChange(card.id)}>
              <span className="specified-action-card-title">
                <strong>{card.zh}</strong>
                {active ? <Check size={17} aria-hidden="true" /> : null}
              </span>
              <span className="specified-action-card-description">{card.descriptionZh}</span>
            </button>
          );
        })}
      </div>
      <div className="specified-action-categories" role="group" aria-label="動作分類">
        {CATEGORIES.map(({ baseId, label }) => {
          const active = selected?.baseId === baseId;
          return (
            <button key={baseId} type="button" disabled={disabled} aria-haspopup="dialog"
              aria-expanded={dialogBaseId === baseId && !disabled} aria-pressed={active}
              className={active ? 'specified-action-selected' : 'secondary'}
              onClick={(event) => openDialog(baseId, event.currentTarget)}>
              {label}<small>{counts[baseId]}</small>
            </button>
          );
        })}
      </div>
      {selected ? (
        <div className="specified-action-summary">
          <ActionImageSlot option={selected} />
          <span className="specified-action-card-copy">
            <span className="specified-action-card-title">
              <strong>{selected.zh}</strong>
              {selected.validation?.status === 'pending' ? <span className="specified-action-pending">未驗收</span> : null}
            </span>
            <span className="specified-action-card-description">{selected.descriptionZh}</span>
          </span>
          <button type="button" className="secondary specified-action-change" disabled={disabled}
            onClick={(event) => openDialog(selected.baseId, event.currentTarget)}>
            <Pencil size={14} aria-hidden="true" />更換
          </button>
        </div>
      ) : null}
      {helpText ? <small id={helpId} className="field-help">{helpText}</small> : null}
      {dialogCategory && !disabled ? <SpecifiedActionDialog category={dialogCategory}
        options={options.filter((option) => option.baseId === dialogCategory.baseId)} value={currentValue}
        onClose={closeDialog} onSelect={(id) => { onChange(id); closeDialog(); }} /> : null}
    </div>
  );
}
