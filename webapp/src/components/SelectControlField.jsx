import { Copy } from 'lucide-react';

function getSelectedPromptText(control, value) {
  if (Array.isArray(value)) {
    const selectedOptions = control.options.filter((option) => value.includes(option.id) && option.zh !== '全無');
    return selectedOptions.map((option) => option.en).filter(Boolean).join(', ');
  }

  if (!value) return '';
  const selectedOption = control.options.find((option) => option.id === value);
  if (!selectedOption || selectedOption.zh === '全無') return '';
  return selectedOption.en || '';
}

function isMutedSelectValue(control, value) {
  if (Array.isArray(value)) return value.length === 0;
  if (!value) return true;
  const selected = control.options.find((option) => option.id === value);
  return selected?.zh === '全無';
}

export default function SelectControlField({ control, value, onChange, onCopy, disabled = false }) {
  const copyText = getSelectedPromptText(control, value);
  const isCopyDisabled = disabled || !copyText;

  return (
    <label className={`field ${disabled ? 'field-disabled' : ''}`}>
      <div className="field-heading-row">
        <span>{control.label}</span>
        <button
          type="button"
          className="icon-btn control-copy-icon-btn"
          disabled={isCopyDisabled}
          onClick={() => onCopy(copyText)}
          title={`Copy ${control.label} prompt`}
          aria-label={`Copy ${control.label} prompt`}
        >
          <Copy size={14} />
        </button>
      </div>
      <div className="field-control-row">
        <select
          disabled={disabled}
          className={isMutedSelectValue(control, value) ? 'select-muted' : ''}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {!control.required && !control.suppressDefaultRandomOption ? <option value="">Random</option> : null}
          {control.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.zh}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
