import assert from 'node:assert/strict';
import review from '../../webapp/src/lib/engine/captureCompatibilitySources.json' with {type:'json'};
import {fixtures as colorFixtures} from './c7ColorFixtures.mjs';
export const BASE='b5f035003a48f9dae848b91b27eeccb296a37b3e';
export const REPORT='Docs/reports/c7-capture-pairing-2026-10-31';
export const sourceFlags=(kind,item)=>review[kind].find(x=>x.id===item?.id&&x.en===item?.en)?.flags||[];
const clash=(a,b,p,q)=>a.includes(p)&&b.includes(q)||a.includes(q)&&b.includes(p);
// Independent baseline oracle: reviewed relations are evaluated at original
// candidate predicates, before any product helper exists. Original samplers stay.
export function referenceAllows(stage,item,state,phase='combined'){
 const loc=sourceFlags('location',stage==='location'?item:state.location),ambient=sourceFlags('ambient',stage==='ambient'?item:state.ambient),style=sourceFlags('style',stage==='style'?item:state.style);
 if(['location','ambient'].includes(stage)&&loc.includes('flower')&&ambient.includes('frozen'))return false;
 if(phase==='season')return true;
 if(['location','style'].includes(stage)&&clash(style,loc,'day','night'))return false;
 if(['style','ambient'].includes(stage)&&clash(style,ambient,'day','night'))return false;
 if(['style','subject'].includes(stage)&&clash(style,sourceFlags('subject',stage==='subject'?item:state.subject),'high','low'))return false;
 if(['style','shutter'].includes(stage)&&style.includes('slow')&&sourceFlags('shutter',stage==='shutter'?item:state.shutter).includes('fast'))return false;
 return true;
}
export function fixtures(engine){
 const old=colorFixtures(engine),controls=engine.getLockControls(),opts=k=>controls.find(c=>c.key===k).options,by=(k,s)=>opts(k).find(x=>x.zh.includes(s)).id;
 const base={...old.base},cases=[],add=(name,patch,eligible=true,extra={})=>cases.push({name,input:{...base,...patch},eligible,seed:'c7-capture:'+cases.length,...extra});
 const sunflower=by('locationId','向日葵'),party=by('locationId','夜間家庭派對'),winter=by('lightingId','雪地冷光'),cold=by('lightingId','冬季灰冷'),day=by('lightingId','晴朗白日'),night=by('lightingId','月光夜色'),high=by('lightDirectionId','高調亮光'),low=by('lightDirectionId','低光高反差'),slow=by('styleId','保羅'),dayStyle=by('styleId','川內'),fast=by('shutterId','1/1000s');
 for(const loc of [sunflower,by('locationId','目黑川'),by('locationId','金色海灘'),by('locationId','泳池露台')])for(const light of opts('lightingId'))add('manual-season:'+loc+'/'+light.id,{locationId:loc,lightingId:light.id});
 for(const style of opts('styleId'))for(const [key,list]of [['lightingId',opts('lightingId')],['lightDirectionId',opts('lightDirectionId')],['shutterId',opts('shutterId')]])for(const x of list)add('manual-style:'+style.id+'/'+key+'/'+x.id,{styleId:style.id,[key]:x.id});
 for(const style of opts('styleId'))for(const key of ['lightingId','lightDirectionId','shutterId'])for(let i=0;i<6;i++)add('random-'+key+':'+style.id+':'+i,{styleId:style.id,[key]:key==='shutterId'?'random':'',...(key==='lightDirectionId'?{lightingId:day}:{})});
 for(const p of [{lightingId:day},{lightingId:night},{lightingId:winter},{lightDirectionId:high},{lightDirectionId:low},{shutterId:fast},{locationId:party},{locationId:sunflower,lightingId:''}])for(let i=0;i<30;i++)add('random-style:'+JSON.stringify(p)+':'+i,{styleId:'',...p});
 for(const loc of opts('locationId'))for(const light of [winter,cold])add('all-location-random:'+loc.id+'/'+light,{locationId:loc.id,lightingId:''});
 for(const p of [{locationId:sunflower,lightingId:''},{locationId:'',lightingId:winter},{locationId:'',lightingId:cold},{locationId:'',styleId:dayStyle},{locationId:'',styleId:'',lightingId:'',lightDirectionId:'',filmId:'',shutterId:'random',topId:'',expressionId:''}])for(let i=0;i<70;i++)add('integrated:'+JSON.stringify(p)+':'+i,p);
 for(const f of opts('framingId'))for(const p of [{locationId:sunflower,lightingId:''},{locationId:party,styleId:''},{styleId:slow,lightingId:'',lightDirectionId:'',shutterId:'random'},{styleId:'',shutterId:fast}])add('crop:'+f.id+JSON.stringify(p),{framingId:f.id,...p});
 for(const r of old.cases.filter(r=>!r.eligible))add('excluded:'+r.name,{...r.input,styleId:r.name.startsWith('legacy-style:')?r.input.styleId:slow,lightingId:'',shutterId:'random'},false,{options:r.options,custom:r.custom});
 for(const key of ['styleId','locationId','lightingId','lightDirectionId','shutterId'])add('unknown:'+key,{locationId:sunflower,styleId:slow,lightingId:'',[key]:'unknown-'+key},false);
 for(let i=0;i<30;i++)add('custom-season:'+i,{locationId:sunflower,lightingId:'',styleId:slow},false,{custom:true});
 for(const key of ['styleId','lightingId','lightDirectionId','shutterId','locationId'])for(let i=0;i<6;i++)add('reroll:'+key+':'+i,{locationId:sunflower,styleId:slow,lightingId:'',lightDirectionId:'',shutterId:'random'},true,{options:{excludePreviousSelection:{[key]:opts(key)[1].id}}});
 return {base,controls,cases,db:old.db,review,sunflower,party,winter,cold,day,night,high,low,slow,dayStyle,fast};
}
export function runCase(engine,row,library=[],phase){let calls=0;const rand=engine.createSeededRandom(row.seed);const[p]=engine.generatePrompts(1,row.input,library,{...row.options,random:()=>{calls++;return rand();},...(phase&&row.eligible?{c7CaptureReference:(stage,item,state)=>referenceAllows(stage,item,state,phase)}:{})});assert.ok(p,row.name);const{id,date,...prompt}=p;void id;void date;return JSON.parse(JSON.stringify({calls,prompt}));}
