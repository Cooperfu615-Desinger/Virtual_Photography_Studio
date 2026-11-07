import {Check} from 'lucide-react';

export default function IndoorKneelField({model,onChange}) {
  if (!model) return null;
  return <fieldset className="indoor-seat-field" aria-label="跪在哪裡">
    <div className="indoor-seat-heading">
      <strong>跪在哪裡</strong>
      <small>指定動作：{model.action.zh}</small>
    </div>
    <div className="indoor-seat-options">
      {[{id:'',label:'未指定'},...model.options].map(({id,label})=><label key={id}>
        <input type="radio" name="indoor-kneel" checked={id===model.selectedId} onChange={()=>onChange(id)} />
        <span>{id===model.selectedId&&<Check size={15} aria-hidden="true" />}{label}</span>
      </label>)}
    </div>
  </fieldset>;
}
