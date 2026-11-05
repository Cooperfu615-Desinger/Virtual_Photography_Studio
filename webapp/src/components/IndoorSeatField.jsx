import { Check } from 'lucide-react';

export default function IndoorSeatField({ model, onChange }) {
  if (!model) return null;
  const choice = model.mode === 'choice';
  const options = choice ? [{ id: '', label: '未指定' }, ...model.options] : [];
  return <fieldset className="indoor-seat-field" aria-label="坐在哪裡">
    <div className="indoor-seat-heading">
      <strong>坐在哪裡</strong>
      {model.action && <small>指定動作：{model.action.zh}</small>}
    </div>
    {choice ? <div className="indoor-seat-options">
      {options.map(({ id, label }) => <label key={id}>
        <input type="radio" name="indoor-seat" checked={id === model.selectedId} onChange={() => onChange(id)} />
        <span>{id === model.selectedId && <Check size={15} aria-hidden="true" />}{label}</span>
      </label>)}
    </div> : <p>{model.mode === 'pending' ? '選擇坐姿後可指定坐在哪裡。'
      : model.bedOnly ? '此動作需要地面；目前場景為床面，可更換場景或坐姿。'
      : '此動作坐在' + model.groundLabel + '上。'}</p>}
  </fieldset>;
}
