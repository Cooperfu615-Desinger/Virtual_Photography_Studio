import { LockKeyhole, Shuffle, UserRound, Shirt, RefreshCw, ArrowLeft } from 'lucide-react';
import { CAPTURE_GROUPS, normalizeCaptureProfile, resolveCapture, rerollCapture, captureOptionReason, captureEligibility } from '../lib/observationCaptureMode.js';
import { getCharacterCardOptions } from '../lib/characterCardLab.js';
import { importCapturePerson, importedPersonLocks } from '../lib/observationCaptureImport.js';
import { buildWorkspaceSummary } from '../lib/page1WorkspaceSummary.js';
import './observationCapturePanel.css';

export default function ObservationCapturePanel({ locks, controls, updateLocks, onWardrobe, onStandard }) {
  const result = resolveCapture(locks.observationCapture);
  const profile = result.profile;
  const cards = getCharacterCardOptions(controls);
  const card = cards.find(c => c.id === locks.characterProfileId);
  const error = captureEligibility(locks, controls) || result.error;
  const importedSource = profile.personSource === 'full-body';
  const person = profile.importedPerson;
  const summary = person ? buildWorkspaceSummary(importedPersonLocks(person), controls) : null;
  const importPerson = () => updateLocks({ observationCapture: importCapturePerson(profile) });
  const allFixed = CAPTURE_GROUPS.every(g => profile.fixed[g.key]);
  const change = (key, id) => {
    const next = resolveCapture({ ...profile, selected: { ...profile.selected, [key]: id }, fixed: { ...profile.fixed, [key]: true } });
    if (!next.error) updateLocks({ observationCapture: next.profile });
  };
  const toggle = key => updateLocks({ observationCapture: { ...profile, fixed: { ...profile.fixed, [key]: !profile.fixed[key] } } });
  return <div className="capture-panel">
    <div className="capture-heading"><div><h2>觀察式抓拍</h2><p>保留人物與穿搭，組合自然的生活瞬間。</p></div><span className="page1-section-chip">原設定已保留</span></div>
    <section className="capture-group capture-person">
      <h3>拍攝人物 {!importedSource && <span className="page1-section-chip">與 A 區同步</span>}</h3>
      <div className="capture-source-row">
        <label className="field"><span>人物來源</span><select value={importedSource ? 'full-body' : 'card'} onChange={event => {
          if (event.target.value === 'full-body') importPerson();
          else updateLocks({ observationCapture: { ...profile, personSource: 'card' } });
        }}><option value="card">選擇角色卡</option><option value="full-body">匯入全身角色照</option></select></label>
        {importedSource && person ? <div className="capture-source-status"><span>已匯入</span><small>來源：一般拍攝・全身角色照</small></div> : null}
      </div>
      {importedSource ? <>
        {summary ? <div className="capture-person-summary" aria-live="polite">
          <strong>生成摘要</strong>
          <p><UserRound size={17} aria-hidden="true" /><b>人物</b><span>{summary.character.summary || '一般單人'}</span></p>
          <p><Shirt size={17} aria-hidden="true" /><b>穿搭</b><span>{summary.wardrobe.summary || '未指定穿搭'}</span></p>
        </div> : <p className="capture-muted" role="status">請先在一般拍攝產生單人全身角色照，再匯入人物與穿搭。</p>}
        <p className="capture-muted">{person ? '人物與穿搭已保留，重抽抓拍不會更換。' : '帶入一般拍攝最後一次產生的全身角色資料。'}</p>
        <div className="capture-import-actions">
          <button type="button" className="secondary" disabled={!profile.availablePerson} onClick={importPerson}><RefreshCw size={16} />重新匯入</button>
          <button type="button" className="secondary" onClick={onStandard}><ArrowLeft size={16} />回一般拍攝調整</button>
        </div>
      </> : <div className="capture-person-row">
        {card?.primaryReferenceImage ? <img src={`${import.meta.env.BASE_URL}${card.primaryReferenceImage}`} alt={card.label} width="96" height="120" /> : <div className="capture-person-placeholder">尚未選人</div>}
        <div className="capture-person-fields"><label className="field"><span>角色卡</span><select value={card?.id || ''} onChange={event => updateLocks({ characterProfileId: event.target.value })}><option value="">請選擇角色卡</option>{cards.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label><div className="capture-wardrobe"><span>穿搭：沿用 C 區目前設定</span><button type="button" className="secondary" onClick={onWardrobe}>調整穿搭</button></div></div>
      </div>}
    </section>
    {['場景與動作', '察覺與觀察位置', '前景與鏡頭', '光線與質感'].map((title, index) => <section className="capture-group" key={title}>
      <h3><span className="capture-number">0{index + 1}</span>{title}</h3>
      <div className="capture-grid">{CAPTURE_GROUPS.slice(index * 2, index * 2 + 2).map(group => {
        const selected = result.selections?.[group.key];
        return <div className="capture-field" key={group.key}>
          <div className="capture-field-heading"><label htmlFor={`capture-${group.key}`}>{group.label}</label><button type="button" className="capture-lock" aria-label={`${group.label}：${profile.fixed[group.key] ? '固定，點擊改為隨機' : '隨機，點擊固定'}`} aria-pressed={profile.fixed[group.key]} onClick={() => toggle(group.key)}>{profile.fixed[group.key] ? <LockKeyhole size={13} /> : <Shuffle size={13} />}{profile.fixed[group.key] ? '固定' : '隨機'}</button></div>
          <select id={`capture-${group.key}`} value={profile.selected[group.key]} onChange={event => change(group.key, event.target.value)}>
            {!selected ? <option value={profile.selected[group.key]}>請重新選擇</option> : null}
            {group.options.map(option => { const reason = captureOptionReason(profile, group.key, option.id); return <option key={option.id} value={option.id} disabled={Boolean(reason)}>{option.zh}{reason ? ` — ${reason}` : ''}</option>; })}
          </select>
        </div>;
      })}</div>
    </section>)}
    {error ? <div className="capture-error" role="alert">{error} 目前暫停產生 Prompt。</div> : <div className="capture-summary" aria-live="polite"><strong>本次組合</strong><span>{CAPTURE_GROUPS.map(g => result.selections[g.key].zh).join('・')}</span></div>}
    <p className="capture-muted">B 姿態、D 場景與 E 部分設定由抓拍接管；原選值保留。</p>
    <div className="capture-actions"><button className="primary-cta" type="button" disabled={allFixed || Boolean(error)} onClick={() => updateLocks({ observationCapture: rerollCapture(profile).profile })}><Shuffle size={16} />重抽隨機項目</button><button className="secondary" type="button" onClick={() => updateLocks({ observationCapture: { ...normalizeCaptureProfile(profile), fixed: {} } })}>全部設為隨機</button></div>
    <p className="capture-muted">{allFixed ? '所有項目均已固定。' : '固定項目不變；不相容選項會顯示原因。'}</p>
  </div>;
}
