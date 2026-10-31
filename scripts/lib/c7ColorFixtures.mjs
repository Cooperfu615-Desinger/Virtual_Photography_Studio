import assert from 'node:assert/strict';
import {resolveCapture} from '../../webapp/src/lib/observationCaptureMode.js';
import review from '../../webapp/src/lib/engine/imagingColorSources.json' with {type:'json'};
export const BASE='591cc0575ab87582540662236b4230fadfea16bf';
export const REPORT='Docs/reports/c7-color-pairing-2026-10-31';
export function referenceMode(kind,item){return review[kind].find(r=>r.id===item?.id&&r.en===item?.en)?.mode||'open';}
export function referenceAllows(style,film){const a=referenceMode('style',style),b=referenceMode('film',film);return a==='open'||b==='open'||a===b;}
// Independent oracle: run the ORIGINAL picker and capture its random tape first.
// Reinterpret its final index within the approved pool, retaining its chosen
// frequency group whenever that group still has an eligible candidate.
export function referencePicker(stage,candidates,random,picker,anchor){
 const draws=[];const chosen=picker(candidates,()=>{const n=random();draws.push(n);return n;});
 const eligible=candidates.filter(x=>stage==='style'?referenceAllows(x,anchor):referenceAllows(anchor,x));
 if(eligible.length===candidates.length)return chosen;
 assert.ok(eligible.length,'reviewed default pool must remain nonempty');
 const group=stage==='film'?eligible.filter(x=>Boolean(x.meta.tags.includes('low_frequency_film'))===Boolean(chosen.meta.tags.includes('low_frequency_film'))):eligible;
 const pool=group.length?group:eligible;return pool[Math.floor(draws.at(-1)*pool.length)];
}
export function fixtures(engine){
 const controls=engine.getLockControls(),opts=k=>controls.find(c=>c.key===k).options,by=(k,s)=>opts(k).find(o=>o.zh.includes(s)).id;
 const base=engine.createEmptyLocks();for(const c of controls){const n=c.options.find(o=>o.zh==='全無');if(n)base[c.key]=n.id;}
 Object.assign(base,{subjectCount:'1',framingId:by('framingId','全身鏡頭')});
 const monoStyle=by('styleId','森山大道'),colorStyle=by('styleId','蜷川實花'),monoFilm=by('filmId','高階黑白灰階'),colorFilm=by('filmId','富士 Provia');
 const cases=[],add=(name,patch,eligible=true,extra={})=>cases.push({name,input:{...base,...patch},eligible,seed:'c7-color:'+cases.length,...extra});
 for(const s of opts('styleId'))for(const f of opts('filmId'))add('manual:'+s.zh+'/'+f.zh,{styleId:s.id,filmId:f.id});
 for(const s of opts('styleId'))for(const filmId of ['', 'random'])for(let i=0;i<8;i++)add('random-film:'+s.zh+':'+filmId+':'+i,{styleId:s.id,filmId});
 for(const f of opts('filmId'))for(const styleId of ['', 'random'])for(let i=0;i<8;i++)add('random-style:'+f.zh+':'+styleId+':'+i,{styleId,filmId:f.id});
 for(const randomLock of ['', 'random'])for(let i=0;i<60;i++)add('both-random:'+randomLock+':'+i,{styleId:randomLock,filmId:randomLock});
 for(const loc of opts('locationId'))for(let i=0;i<2;i++)add('scene:'+loc.zh+':'+i,{locationId:loc.id,styleId:'',filmId:i?monoFilm:''});
 for(const framing of opts('framingId'))for(const styleId of [monoStyle,colorStyle])for(let i=0;i<4;i++)add('framing:'+framing.zh+':'+styleId+':'+i,{framingId:framing.id,styleId,filmId:''});
 for(const styleId of [monoStyle,colorStyle,''])for(let i=0;i<40;i++)add('downstream:'+styleId+':'+i,{styleId,filmId:'',expressionId:'',topId:'',topColorId:'',pantsId:'',bottomColorId:'',opticalEffectId:''});
 for(const excluded of [monoFilm,by('filmId','Leica 風格'),by('filmId','VHS')])for(let i=0;i<12;i++)add('reroll:'+excluded+':'+i,{styleId:monoStyle,filmId:'',topId:''},true,{options:{excludePreviousSelection:{filmId:excluded,styleId:monoStyle}}});
 const excluded=[{subjectCount:'2'},...['fixedCompositionSetId','characterProfileId','specialSubjectId'].flatMap(key=>opts(key).filter(o=>o.id!=='none').map(o=>({[key]:o.id}))),{poseBaseId:'lying'},
 {importedWorldSceneMode:'architecture',importedWorldSceneArchitectureText:'an imported quiet room',importedWorldSceneLabel:'imported'},
 {captureMode:'observation',characterProfileId:'character-rika',observationCapture:resolveCapture({seed:719}).profile}];
 for(const [i,patch]of excluded.entries())for(let j=0;j<4;j++)add('excluded:'+i+':'+j,{styleId:j%2?monoStyle:'',filmId:j%2?'':monoFilm,...patch},false);
 add('imported-identity',{styleId:monoStyle,filmId:''},false,{options:{characterProfilePrompt:'A 20-year-old adult woman with a round face and natural dark hair.'}});
 for(let i=0;i<12;i++)add('custom:'+i,{styleId:monoStyle,filmId:''},false,{custom:true});
 for(const styleId of ['unknown-style','regional:攝影風格:daido-moriyama-森山大道:15'])add('legacy-style:'+styleId,{styleId,filmId:''},styleId!=='unknown-style');
 for(const filmId of ['unknown-film','ricoh-gr-snapshot','leica-m-rangefinder'])add('legacy-film:'+filmId,{styleId:'',filmId},false);
 for(const p of opts('cameraSystemId').filter(o=>o.id!=='none'))for(const key of ['filmId','cameraSystemId']){
  const input=engine.normalizeLocks({...base,filmId:'',styleId:'',[key]:p.id});add('normalized-profile:'+key+':'+p.id,input);
 }
 return {base,controls,cases,db:engine.getKnowledgeBaseSnapshot(),monoStyle,colorStyle,monoFilm,colorFilm,review};
}
export function runCase(engine,row,library=[],oracle=false){
 let calls=0;const random=engine.createSeededRandom(row.seed);
 const [p]=engine.generatePrompts(1,row.input,library,{...row.options,random:()=>{calls++;return random();},...(oracle&&row.eligible?{c7Reference:referencePicker}:{})});
 assert.ok(p,row.name);const{id,date,...prompt}=p;void id;void date;return JSON.parse(JSON.stringify({calls,prompt}));
}
