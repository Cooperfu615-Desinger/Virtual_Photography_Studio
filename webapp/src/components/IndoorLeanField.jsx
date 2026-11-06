import { Check } from 'lucide-react';

export default function IndoorLeanField({ model, onChange }) {
  if (!model) return null;
  return <fieldset className="indoor-seat-field" aria-label="靠在哪裡">
    <div className="indoor-seat-heading">
      <strong>靠在哪裡</strong>
      <small>指定動作：{model.action.zh}</small>
    </div>
    <div className="indoor-seat-options">
      {[{ id: '', label: '未指定' }, ...model.options].map(({ id, label }) => <label key={id}>
        <input type="radio" name="indoor-lean" checked={id === model.selectedId} onChange={() => onChange(id)} />
        <span>{id === model.selectedId && <Check size={15} aria-hidden="true" />}{label}</span>
      </label>)}
    </div>
    {!model.options.length && <p>此場景沒有可指定的倚靠物件，保留身體傾斜方向。</p>}
  </fieldset>;
}
