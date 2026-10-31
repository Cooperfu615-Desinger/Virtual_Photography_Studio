import assert from 'node:assert/strict';
import review from './c1IdentityReview.json' with {type:'json'};
export const BASE = review.baseCommit;
export const REPORT = 'Docs/reports/c1-character-identity-2026-10-31';
export {review};
export const plain = value => JSON.parse(JSON.stringify(value));
export function applyApprovedText(value) {
  if (typeof value === 'string') return review.rows.reduce((text, row) => {
    const pattern = new RegExp(row.before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return text.replace(pattern, match => /^[A-Z]/.test(match) ? row.after[0].toUpperCase() + row.after.slice(1) : row.after);
  }, value);
  if (Array.isArray(value)) return value.map(applyApprovedText);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,applyApprovedText(v)]));
  return value;
}
export function fixtures(engine, lab) {
  const controls = engine.getLockControls(), cards = lab.getCharacterCardOptions(controls);
  const opts = key => controls.find(c => c.key === key).options;
  const base = engine.createEmptyLocks();
  for (const control of controls) {
    const none = control.options.find(o => o.zh === '全無');
    if (none) base[control.key] = none.id;
  }
  Object.assign(base, {subjectCount:'1',characterProfileId:'none',specialSubjectId:'none',fixedCompositionSetId:'none'});
  const cases = [], page2 = [];
  const add = (name, patch, extra={}) => cases.push({name,locks:{...base,...patch},seed:'c1:'+name,...extra});
  for (const card of cards) for (const mode of ['full-default','selected-layers']) for (const crop of opts('framingId')) {
    add(`${card.id}/${mode}/${crop.id}`, {characterProfileId:card.id,characterCardWardrobeMode:mode,characterCardWardrobeLayerIds:[],framingId:crop.id});
  }
  const target = new Set(review.rows.map(r=>r.id));
  for (const card of cards) {
    const hairs = target.has(card.id) ? lab.getCompatibleHairVariants(card) : [{id:'default'}];
    for (const hair of hairs) for (const mode of ['pure','all','one']) {
      const variant = lab.createEmptyCharacterCardVariant([card]);
      variant.hairVariantId = hair.id;
      if (mode === 'pure') variant.outputMode = 'pure-character';
      if (mode === 'one') variant.includedWardrobeLayers = variant.includedWardrobeLayers.slice(0,1);
      for (const eyewear of target.has(card.id) ? ['default','glasses-off','glasses-on'] : ['default']) {
        const v={...variant,eyewearMode:eyewear};
        page2.push({name:`${card.id}/${hair.id}/${mode}/${eyewear}`,variant:v});
        if (target.has(card.id)) add('from-page2/'+page2.at(-1).name,lab.buildPage1LocksFromCharacterCardVariant(base,v,cards));
      }
    }
  }
  for (let i=0;i<100;i++) add('ordinary/'+i, {characterProfileId:'none',locationId:'',styleId:'',lightingId:'',topId:'',expressionId:''});
  for (const crop of opts('framingId')) {
    add('duo/'+crop.id,{subjectCount:'2',framingId:crop.id});
    for (const row of review.rows) add('legacy-special/'+row.id+'/'+crop.id,{characterProfileId:'none',specialSubjectId:row.id,framingId:crop.id},{normalize:true});
  }
  for (const option of opts('specialSubjectId')) if (option.id!=='none') add('special/'+option.id,{specialSubjectId:option.id});
  for (const option of opts('fixedCompositionSetId')) if (option.id!=='none') add('fixed/'+option.id,{fixedCompositionSetId:option.id});
  return {controls,cards,base,cases,page2};
}
export function runCase(engine,row) {
  const random=engine.createSeededRandom(row.seed);let calls=0;
  const locks=row.normalize?engine.normalizeLocks(row.locks):row.locks;
  const [p]=engine.generatePrompts(1,locks,[],{random:()=>{calls++;return random();}});
  assert.ok(p,row.name);const {id,date,...prompt}=p;void id;void date;
  return plain({calls,prompt});
}
export function publicOutputs(prompt) {
  return Object.fromEntries(['grokPrompt','zImagePrompt','midjourneyPrompt','nanoBananaPrompt'].map(k=>[k,prompt[k]])
    .concat((prompt.extraPrompts||[]).map(o=>[o.id,o.text])));
}
