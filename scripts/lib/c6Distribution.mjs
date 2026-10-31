import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import * as engine from '../../webapp/src/lib/engine.js';
import * as actions from '../../webapp/src/lib/engine/specifiedActions.js';
import {getCharacterCardOptions} from '../../webapp/src/lib/characterCardLab.js';
import {buildPage1ControlGroups} from '../../webapp/src/features/page1/page1Selectors.js';
import policy from './c6DistributionPolicy.json' with {type:'json'};

export const ROOT=fileURLToPath(new URL('../../',import.meta.url));
export const hash=x=>createHash('sha256').update(x).digest('hex');
export const contentOption=o=>!['none','random'].includes(o.id)&&!['全無','隨機'].includes(o.zh)&&!o.random;
export function histogram(values){const result={};for(const value of values){const key=String(value??'unset');result[key]=(result[key]||0)+1;}return Object.fromEntries(Object.entries(result).sort(([a],[b])=>a.localeCompare(b,'en')));}
export function uniqueOptions(options){const seen=new Set();return options.filter(o=>{if(seen.has(o.id))return false;seen.add(o.id);return true;});}
export function visibleWardrobeOptions(key,options){
  return options.filter(contentOption).filter(o=>!o.meta?.outerwear?.retired)
    .filter(o=>key==='outfitPresetId'?o.zh.startsWith('套裝：'):key==='dressId'?o.zh.startsWith('連身：'):true);
}
export function lexicalMatches(entries,pattern){const re=new RegExp(pattern,'i');return entries.filter(e=>re.test(e.en)).map(e=>({id:e.id,zh:e.zh}));}
export function assertReviewedUI(root=ROOT){for(const [path,sha]of Object.entries(policy.reviewedUi))assert.equal(hash(readFileSync(join(root,path))),sha,'C6 UI review is stale: '+path);}
export function productFingerprint(){
  const paths=execFileSync('git',['ls-files','-z','webapp/src','knowledge_base'],{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean).sort();
  return {files:paths.length,sha256:hash(paths.map(p=>p+'\0'+hash(readFileSync(join(ROOT,p)))).join('\n'))};
}
export function inventory(){
  assertReviewedUI();
  const index=JSON.parse(readFileSync(join(ROOT,'knowledge_base/catalog/index.json'))),categories=[],all=[];
  for(const section of index.sections)for(const category of section.categories){
    const source=JSON.parse(readFileSync(join(ROOT,'knowledge_base/catalog',category.path))),entries=source.entries;
    assert.equal(new Set(entries.map(e=>e.id)).size,entries.length,'Duplicate source IDs');
    categories.push({section:section.name,category:category.name,path:category.path,rows:entries.length,content:entries.filter(contentOption).length});
    all.push(...entries.map(e=>({...e,sourceSection:section.name,sourceCategory:category.name})));
  }
  assert.equal(new Set(all.map(e=>e.id)).size,all.length,'Duplicate catalog IDs');
  const controls=engine.getLockControls(),opts=k=>controls.find(c=>c.key===k).options,locks=engine.createEmptyLocks();
  const groups=buildPage1ControlGroups({lockControls:controls,locks,sceneDependentOptions:engine.getSceneDependentOptions([],locks)});
  const wardrobe=groups.wardrobeLockControls.filter(c=>policy.wardrobeKeys.includes(c.key)).map(c=>({key:c.key,controlRows:c.options.length,content:uniqueOptions(c.options.filter(contentOption)).length,visibleContent:visibleWardrobeOptions(c.key,c.options).length,visibleIds:visibleWardrobeOptions(c.key,c.options).map(o=>o.id)}));
  const locationMenus=Object.fromEntries(['none','indoor','outdoor','other'].map(sceneAttributeId=>[sceneAttributeId,engine.getSceneDependentOptions([],{...locks,sceneAttributeId}).locationOptions.filter(contentOption).map(x=>x.id)]));
  const cards=getCharacterCardOptions(controls),location=all.filter(e=>e.sourceSection==='Locations'&&contentOption(e)),clothes=all.filter(e=>e.sourceSection==='Wardrobe'&&contentOption(e));
  const lexical={};for(const [name,pattern]of Object.entries(policy.lexicalPatterns))lexical[name]={pattern,matches:lexicalMatches(name.startsWith('wardrobe')?clothes:name.startsWith('location')?location:opts('lightingId').filter(contentOption),pattern),classification:'lexical diagnostic only; not exhaustive or exclusive'};
  return {policyVersion:policy.version,categories,totals:{rows:all.length,content:all.filter(contentOption).length},
    actions:{concrete:actions.SPECIFIED_ACTION_CONCRETE_OPTIONS.length,byBase:histogram(actions.SPECIFIED_ACTION_CONCRETE_OPTIONS.map(x=>x.baseId)),validation:histogram(actions.SPECIFIED_ACTION_CONCRETE_OPTIONS.map(x=>x.validation.status)),randomPool:actions.SPECIFIED_ACTION_RANDOM_POOL.map(x=>({id:x.id,base:x.baseId})),conditionalLyingPool:actions.SPECIFIED_ACTION_LYING_POOL.map(x=>x.id),legacyComposerIsNotPublicInventory:true},
    ui:{basis:'source-derived default unlocked PAGE1 single; not browser acceptance',reviewedUi:policy.reviewedUi,wardrobe,locationMenus,lighting:opts('lightingId').filter(contentOption).map(x=>({id:x.id,zh:x.zh})),characterCards:cards.map(x=>x.id)},
    locationTags:histogram(opts('locationId').filter(contentOption).flatMap(x=>x.meta?.tags||[])),
    characters:{total:cards.length,explicitEastAsian:cards.filter(x=>/adult East Asian woman/.test(x.identityAndBody)).length,explicitAge20:cards.filter(x=>/20-year-old/.test(x.identityAndBody)).length,ovalWord:cards.filter(x=>/oval/.test(x.facialGeometry)).length,skinWords:{fairPalePorcelain:cards.filter(x=>/fair|pale|porcelain/.test(x.skinSignature)).length,lightOlive:cards.filter(x=>/light-olive/.test(x.skinSignature)).length,beige:cards.filter(x=>/beige/.test(x.skinSignature)).length},classification:'explicit text; skin buckets overlap; no image ethnicity inference'},lexical,
    fixedSeasonalSets:opts('fixedCompositionSetId').filter(x=>/春|冬|雪/.test(x.zh)).map(x=>({id:x.id,zh:x.zh})),
    limitations:policy.limitations};
}
export function scenarios(count=1000){
  assert.ok(Number.isSafeInteger(count)&&count>=1&&count<=10000,'count must be an integer from 1 to 10000');
  const controls=engine.getLockControls(),opts=k=>controls.find(c=>c.key===k).options;
  const full=opts('framingId').find(x=>x.zh==='全身鏡頭 (Full Body Shot)');assert.ok(full,'Reviewed full-body framing missing');
  const bed=opts('locationId').find(x=>x.zh==='其他：白色床鋪');assert.ok(bed,'Reviewed lying scene missing');
  const base=engine.createEmptyLocks(),random={...base,framingId:full.id,specifiedActionId:'random',outfitPresetId:'random'};
  return [...['a','b','c'].map(s=>({name:'full-random-'+s,seed:'c6-20261031-'+s,count,locks:{...random}})),
    {name:'default',seed:'c6-default-20261031',count,locks:base},
    {name:'special-outfit',seed:'c6-special-20261031',count,locks:{...base,framingId:full.id,specialOutfitId:'random'}},
    ...['indoor','outdoor'].map(s=>({name:s,seed:'c6-'+s+'-20261031',count:Math.max(1,Math.floor(count/2)),locks:{...random,sceneAttributeId:s}})),
    {name:'locked-bed',seed:'c6-bed-20261031',count:Math.max(1,Math.floor(count/2)),locks:{...random,locationId:bed.id}}];
}
// Saved selection keeps legacy poseBaseId at none for specified actions.
// Read the resolved action ID, and keep the raw compatibility field separately.
export function selectionMeasures(s){
  const action=actions.SPECIFIED_ACTION_CONCRETE_OPTIONS.find(a=>a.id===s.specifiedActionId);
  return {location:s.locationId||'unset',lighting:s.lightingId||'unset',
    action:s.specifiedActionId||'unset',actionBase:action?.baseId||'unset',legacyPoseBase:s.poseBaseId||'unset',
    specialOutfit:s.specialOutfitId||'unset',outfit:s.outfitPresetId||s.dressId||'unset',
    outfitPreset:s.outfitPresetId||'unset',dress:s.dressId||'unset',
    character:s.characterProfileId||'unset',style:s.styleId||'unset'};
}
export function sampleScenario(scenario){
  const controls=engine.getLockControls(),lookup=new Map(controls.flatMap(c=>c.options.map(o=>[o.id,o]))),random=engine.createSeededRandom(scenario.seed),digester=createHash('sha256');
  const rows=Object.fromEntries(Object.keys(selectionMeasures({})).map(key=>[key,[]]));let calls=0;
  for(let i=0;i<scenario.count;i++){
    const p=engine.generatePrompts(1,scenario.locks,[],{random:()=>{calls++;return random();}})[0],s=p.selection;
    for(const [key,value]of Object.entries(selectionMeasures(s)))rows[key].push(value);
    const {id,date,...stable}=p;void id;void date;digester.update(JSON.stringify(stable)+'\n');
  }
  const measured=Object.fromEntries(Object.entries(rows).map(([key,values])=>[key,{unique:new Set(values).size,counts:histogram(values)}]));
  const unseen={};for(const [key,control]of [['location','locationId'],['lighting','lightingId'],['specialOutfit','specialOutfitId']]){const seen=new Set(rows[key]);unseen[key]=controls.find(c=>c.key===control).options.filter(contentOption).filter(o=>!seen.has(o.id)).map(o=>o.id);}
  return {...scenario,rngCalls:calls,outputDigest:digester.digest('hex'),measured,locationCategories:histogram(rows.location.map(id=>id==='unset'?'unset':id.split(':')[1])),outfitSourceCategories:histogram(rows.outfit.map(id=>id==='unset'?'unset':id.split(':')[1])),specialFamilies:histogram(rows.specialOutfit.map(id=>lookup.get(id)?.meta?.family||'unset')),unseen,unseenMeaning:'not observed in this finite scenario; does not prove unreachable',actionBaseMeaning:'baseId of resolved specifiedActionId; none is upper interaction, unset means no concrete action; legacyPoseBase stays separate',outfitMeaning:'resolved outfitPresetId or dressId; individual fields also retained; not all wardrobe pieces'};
}
export function measure({count=1000,inventoryOnly=false}={}){
  const before=productFingerprint(),result={version:policy.version,head:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),product:before,inventory:inventory(),sampling:inventoryOnly?[]:scenarios(count).map(sampleScenario)};
  assert.deepEqual(productFingerprint(),before,'Read-only measurement must not change product files');return result;
}
