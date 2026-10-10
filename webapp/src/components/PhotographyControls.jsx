import { useId } from 'react';
import { Check, ChevronRight, Copy, LockKeyhole } from 'lucide-react';
import SelectControlField from './SelectControlField.jsx';
import { getCameraControlDisplayLabel } from '../lib/page1CameraLabels.js';
import '../features/page1/photographyEditor.css';

function getSelectedPromptText(field) {
  const selected = field.control.options.find((option) => option.id === field.value);
  if (!selected || selected.zh === '全無' || selected.zh === '無額外表情') return '';
  return selected.en || '';
}

function CopyControlButton({ field, onCopy }) {
  const copyText = getSelectedPromptText(field);

  return (
    <button
      type="button"
      className="icon-btn control-copy-icon-btn photography-editor-copy"
      disabled={field.disabled || !copyText}
      onClick={() => onCopy(field.control, copyText)}
      title={`Copy ${field.control.label} prompt`}
      aria-label={`Copy ${field.control.label} prompt`}
    >
      <Copy size={14} aria-hidden="true" />
    </button>
  );
}

function ManagedField({ field }) {
  const headingId = useId();
  const reasonId = useId();
  const { control, management } = field;

  return (
    <div
      className="field photography-editor-managed-field"
      data-photography-field={control.key}
      role="group"
      aria-labelledby={headingId}
      aria-describedby={management.reason ? reasonId : undefined}
    >
      <div className="field-heading-row">
        <span id={headingId}>{control.displayLabel || control.label}</span>
        <button
          type="button"
          className="icon-btn control-copy-icon-btn photography-editor-copy"
          disabled
          title={`Copy ${control.label} prompt`}
          aria-label={`Copy ${control.label} prompt`}
        >
          <Copy size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="photography-editor-managed-value" aria-disabled="true">
        <span>{management.value}</span>
        <span className="photography-editor-management-badge">
          <LockKeyhole size={13} aria-hidden="true" />{management.label}
        </span>
      </div>
      {management.reason ? <small id={reasonId} className="photography-editor-field-note">{management.reason}</small> : null}
    </div>
  );
}

function QuickChoiceField({ field, onChange, onCopy, showHeading = true }) {
  const headingId = useId();
  const { control, value, disabled } = field;
  const noneOption = control.required ? null : control.options.find((option) => option.zh === '全無');
  const options = control.options.filter((option) => option.id !== noneOption?.id && option.zh !== '隨機');
  const allowRandom = !control.required && !control.suppressDefaultRandomOption;

  return (
    <div
      className="photography-editor-quick-field"
      data-photography-field={control.key}
      role="group"
      aria-labelledby={showHeading ? headingId : undefined}
      aria-label={showHeading ? undefined : control.displayLabel || control.label}
    >
      {showHeading ? (
        <div className="photography-editor-quick-heading">
          <span id={headingId}>{control.displayLabel || control.label}</span>
          <div className="photography-editor-quick-actions">
            <CopyControlButton field={field} onCopy={onCopy} />
            {noneOption ? (
              <button
                type="button"
                className={`secondary photography-editor-small-choice${value === noneOption.id ? ' photography-editor-small-choice-active' : ''}`}
                aria-pressed={value === noneOption.id}
                disabled={disabled || noneOption.disabled}
                onClick={() => onChange(control, noneOption.id)}
              >全無</button>
            ) : null}
            {allowRandom ? (
              <button
                type="button"
                className={`secondary photography-editor-small-choice${!value ? ' photography-editor-small-choice-active' : ''}`}
                aria-pressed={!value}
                disabled={disabled}
                onClick={() => onChange(control, '')}
              >隨機</button>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="photography-editor-choices">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`secondary photography-editor-choice${value === option.id ? ' photography-editor-choice-active' : ''}`}
            aria-pressed={value === option.id}
            disabled={disabled || option.disabled}
            onClick={() => onChange(control, option.id)}
            title={option.zh}
          >
            <span>{getCameraControlDisplayLabel(control.key, option)}</span>
            {value === option.id ? <Check size={16} aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
      {control.helpText ? <small className="photography-editor-field-note">{control.helpText}</small> : null}
    </div>
  );
}

function PhotographyField({ field, onChange, onCopy }) {
  if (field.management) return <ManagedField field={field} />;

  if (field.control.key === 'framingId' || field.control.key === 'imageTypePresetId') {
    return <QuickChoiceField field={field} onChange={onChange} onCopy={onCopy} showHeading={field.control.key !== 'imageTypePresetId'} />;
  }

  return (
    <div className="photography-editor-select-field" data-photography-field={field.control.key}>
      <SelectControlField
        control={field.control}
        value={field.value}
        disabled={field.disabled}
        onChange={(value) => onChange(field.control, value)}
        onCopy={(text) => onCopy(field.control, text)}
      />
    </div>
  );
}

function GroupActions({ group, onAction }) {
  if (group.id === 'image-type') {
    return <button type="button" className="photography-editor-link" onClick={() => onAction(group.id, 'reset')}>重設為預設</button>;
  }

  if (group.id !== 'composition' && group.id !== 'optics') return null;
  if (group.fields.every((field) => field.management)) return null;

  const actionLabel = group.id === 'composition' ? '構圖' : '鏡頭';
  const disabled = group.actionKeys.length === 0;

  return (
    <div className="photography-editor-group-actions">
      <button type="button" className="secondary" disabled={disabled} onClick={() => onAction(group.id, 'random')}>隨機{actionLabel}</button>
      <button type="button" className="secondary" disabled={disabled} onClick={() => onAction(group.id, 'none')}>清空{actionLabel}</button>
    </div>
  );
}

export default function PhotographyControls({ model, onChange, onCopy, onAction, onShowScene }) {
  const headingId = useId();

  return (
    <div className="photography-editor">
      {model.groups.map((group) => (
        <section
          key={group.id}
          className={`photography-editor-card photography-editor-card--${group.id}`}
          aria-labelledby={`${headingId}-${group.id}`}
          data-photography-group={group.id}
          data-photography-field-keys={group.fields.map((field) => field.control.key).join(',')}
        >
          <header className="photography-editor-card-header">
            <div className="photography-editor-card-heading">
              <h3 id={`${headingId}-${group.id}`}>{group.label}</h3>
              {group.id === 'image-type' && group.fields[0] ? <CopyControlButton field={group.fields[0]} onCopy={onCopy} /> : null}
              {group.id !== 'image-type' && group.summary ? <p className="photography-editor-summary">{group.summary}</p> : null}
            </div>
            <GroupActions group={group} onAction={onAction} />
          </header>
          {group.id === 'composition' && model.fixedNotice ? (
            <div className="photography-editor-fixed-notice">
              <div>
                <strong>{model.fixedNotice.name}</strong>
                <p>{model.fixedNotice.text}</p>
              </div>
              <button type="button" className="photography-editor-link" onClick={onShowScene}>
                查看場景設定<ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          ) : null}
          <div className="photography-editor-fields">
            {group.fields.map((field) => (
              <div
                key={field.control.key}
                className={`photography-editor-field-slot${field.control.key === 'framingId' || field.control.key === 'imageTypePresetId' ? ' photography-editor-field-slot--full' : ''}`}
              >
                <PhotographyField field={field} onChange={onChange} onCopy={onCopy} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
