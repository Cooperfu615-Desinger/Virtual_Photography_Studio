// Independent expected-text transform over a fixed Git engine, never a regenerated seal.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync,symlinkSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as current from '../webapp/src/lib/engine.js';
import * as codec from '../webapp/src/features/saved-cards/cardCodec.js';
import {transitionPage1Locks} from '../webapp/src/features/page1/lockTransitions.js';
import {getFullBodyImportSource} from '../webapp/src/lib/observationCaptureImport.js';
import {resolveCapture} from '../webapp/src/lib/observationCaptureMode.js';
import {stablePrompt,outputStates,pack,sha256,differences} from './lib/catalogBaseline.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const base='bd31bd34f0bfa8986193a6048fe1a69a265e3668';
const out=resolve(process.argv[2]||'/tmp/a2-runtime-color-acceptance');
const own=resolve(root,'Docs/reports/wardrobe-runtime-color-a2-2026-10-27');
assert.ok(!out.startsWith(resolve(root)+'/')||out===own||out.startsWith(own+'/'),'Protect other reports');
mkdirSync(out,{recursive:true});
const dir=mkdtempSync(join(tmpdir(),'vps-runtime-base-'));
const git=(...args)=>execFileSync('git',['-C',root,...args],{maxBuffer:64*1024*1024});
function expectedText(s){
  const sentenceCase=(source,result)=>/^[A-Z]/.test(source)?result[0].toUpperCase()+result.slice(1):result;
  return s.replace(/complete outfit palette direction: shift the complete outfit palette toward a (.+?), preserving garment structure, accessory separation, material contrast, and multi-piece color variation/gi,(source,palette)=>sentenceCase(source,'outfit palette: '+palette))
    .replace(/(primary|secondary) garment color expressed as /gi,(_,role)=>role+' garment with ')
    .replace(/(primary|secondary) garment color in /gi,(_,role)=>role+' garment in ')
    .replace(/(primary|secondary) garment color /gi,(_,role)=>role+' garment in ')
    .replace(/coordinated top-to-bottom palette: upper\/main dress area/gi,source=>sentenceCase(source,'dress palette from top to bottom: upper/main dress area'));
}
function expected(value,frozenCapture=false){
  if(frozenCapture&&value?.id==='full-body-character')return structuredClone(value);
  if(typeof value==='string')return expectedText(value);
  if(Array.isArray(value))return value.map(v=>expected(v,frozenCapture));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,frozenCapture&&['importedPerson','fullBodyPrompt'].includes(k)?structuredClone(v):expected(v,frozenCapture)]));
  return value;
}
try{
  execFileSync('tar',['-x','-C',dir],{input:git('archive',base,'webapp/src','webapp/package.json')});
  symlinkSync(join(root,'webapp/node_modules'),join(dir,'webapp/node_modules'),'dir');
  const load=p=>import(pathToFileURL(join(dir,p)).href);
  const old=await load('webapp/src/lib/engine.js'),oldCodec=await load('webapp/src/features/saved-cards/cardCodec.js');
  const oldImport=await load('webapp/src/lib/observationCaptureImport.js'),oldTransition=await load('webapp/src/features/page1/lockTransitions.js');
  assert.deepEqual(current.getKnowledgeBaseSnapshot(),old.getKnowledgeBaseSnapshot());
  const controls=current.getLockControls();assert.deepEqual(controls,old.getLockControls());
  const options=k=>controls.find(c=>c.key===k).options, concrete=k=>options(k).filter(x=>!['none','random'].includes(x.id)&&x.zh!=='全無');
  const option=(k,label)=>{const o=options(k).find(x=>x.zh.includes(label));assert.ok(o,k+label);return o;};
  const empty=()=>{const l=current.createEmptyLocks();for(const c of controls){const n=c.options.find(x=>x.zh==='全無'||x.id==='none');if(n)l[c.key]=n.id;}return {...l,subjectCount:'1',framingId:option('framingId','全身鏡頭').id};};
  const run=(e,l,seed)=>{let calls=0;const rng=e.createSeededRandom(seed);const p=e.generatePrompts(1,structuredClone(l),[],{random:()=>{calls++;return rng();}})[0];return {p,calls};};
  const cases=[],baseline=[],saved=[],changedOutputs={},mismatches=[],compatibility=[],knownLimitations=[];
  function compare(name,l,{unchanged=false,save=false,frozenCapture=false}={}){
    const a=run(old,l,name),b=run(current,l,name);
    assert.ok(a.p&&b.p,'Generation must resolve: '+name+' old='+Boolean(a.p)+' new='+Boolean(b.p));
    const want=unchanged?stablePrompt(a.p):expected(stablePrompt(a.p),frozenCapture);
    const diffs=differences(want,stablePrompt(b.p));
    if(diffs.length){mismatches.push({name,locks:l,diffs}); if(mismatches.length>=8)throw new Error('Oracle mismatch; see oracle-mismatches.json');}
    assert.deepEqual(b.p.selection,a.p.selection,name+' selection');assert.equal(b.calls,a.calls,name+' RNG');
    for(const [k,v]of Object.entries(outputStates(b.p)))if(v.text!==outputStates(a.p)[k].text)changedOutputs[k]=(changedOutputs[k]||0)+1;
    cases.push({name,locks:l,before:sha256(JSON.stringify(stablePrompt(a.p))),after:sha256(JSON.stringify(stablePrompt(b.p))),rngCalls:b.calls,unchanged});
    if(save)baseline.push({name,locks:l,before:stablePrompt(a.p),after:stablePrompt(b.p)});
    return {before:a.p,after:b.p};
  }
  try{
    // Full palette responsibility for every full-look option, including fixed-black-bottom exceptions.
    for(const key of ['specialOutfitId','outfitPresetId','dressId'])for(const item of concrete(key))for(const palette of options('completeLookPaletteId')){
      compare('palette:'+key+':'+item.id+':'+palette.id,{...empty(),[key]:item.id,completeLookPaletteId:palette.id});
    }
    for(const item of concrete('outfitPresetId'))for(const [primary,contrast]of [['none','white'],['red','none'],['red','white'],['mirror-chrome-silver','black'],['glossy-black-latex','white'],['multicolor-horizontal-stripes','white']]){
      compare('roles:'+item.id+':'+primary+':'+contrast,{...empty(),outfitPresetId:item.id,outfitPresetPrimaryColorId:primary,outfitPresetContrastColorId:contrast});
    }
    const generic=option('outfitPresetId','鏈條緞面');
    for(const role of ['Primary','Contrast'])for(const color of options('outfitPreset'+role+'ColorId'))compare('swatch:'+role+':'+color.id,{...empty(),outfitPresetId:generic.id,outfitPresetPrimaryColorId:'red',outfitPresetContrastColorId:'white',['outfitPreset'+role+'ColorId']:color.id});
    for(const item of concrete('dressId'))for(const palette of concrete('topBottomPaletteId'))compare('dress-area:'+item.id+':'+palette.id,{...empty(),dressId:item.id,topBottomPaletteId:palette.id});
    const reps=[['specialOutfitId',option('specialOutfitId','紅色亮面膠帶')],['outfitPresetId',generic],['dressId',option('dressId','無袖迷你')]];
    for(const [key,item]of reps)for(const palette of options('completeLookPaletteId')){
      const locks={...empty(),[key]:item.id,completeLookPaletteId:palette.id,...(key==='outfitPresetId'?{outfitPresetPrimaryColorId:'light-blue',outfitPresetContrastColorId:'white'}:{}),...(key==='dressId'?{topBottomPaletteId:concrete('topBottomPaletteId')[0].id}:{})};
      const pair=compare('saved:'+key+':'+palette.id,locks,{save:true});
      for(const crop of options('framingId'))compare('crop:'+key+':'+palette.id+':'+crop.id,{...locks,framingId:crop.id});
      const raw=oldCodec.serializeFavoritePrompt({...pair.before,id:'old-runtime-'+key+palette.id,date:'2026-10-27T00:00:00.000Z'});
      const bytes=JSON.stringify(raw),a=oldCodec.deserializeFavoritePrompt(raw),b=codec.deserializeFavoritePrompt(raw);
      assert.deepEqual(outputStates(b),outputStates(a),'frozen public JSON text');assert.deepEqual(b.selection,a.selection);assert.equal(JSON.stringify(raw),bytes);
      const md=oldCodec.buildMarkdownExport(pair.before),fresh=codec.buildMarkdownExport(pair.after);
      for(const [kind,text]of [['old-snapshot',md],['old-prose',md.slice(md.indexOf('\n')+1)]]){
        const x=codec.parseExportedMarkdownPrompt(text,controls,'runtime-import'),y=oldCodec.parseExportedMarkdownPrompt(text,controls,'runtime-import');
        assert.deepEqual(stablePrompt(x),stablePrompt(y),'old Markdown remains exact '+kind);compatibility.push({key,palette:palette.id,kind});
      }
      const parsed=codec.parseExportedMarkdownPrompt(fresh,controls,'runtime-import');
      assert.deepEqual(parsed.selection,oldCodec.parseExportedMarkdownPrompt(fresh,controls,'runtime-import').selection,'new snapshot preserves existing default normalization');assert.deepEqual(outputStates(parsed),outputStates(pair.after),'new snapshot outputs');
      assert.deepEqual(codec.parseLocksFromStandardPrompt(pair.before.grokPrompt,controls),oldCodec.parseLocksFromStandardPrompt(pair.before.grokPrompt,controls),'old pasted text');
      const np=codec.parseLocksFromStandardPrompt(pair.after.grokPrompt,controls),op=oldCodec.parseLocksFromStandardPrompt(pair.before.grokPrompt,controls);
      assert.deepEqual(np.locks,op.locks,'new prose has same recovery evidence');
      const ui=transitionPage1Locks({previousLocks:locks,candidateLocks:current.normalizeLocks(codec.buildRestoreLocks(b.selection,controls)),lockControls:controls,restoringSelection:true});
      assert.deepEqual(ui,oldTransition.transitionPage1Locks({previousLocks:locks,candidateLocks:old.normalizeLocks(oldCodec.buildRestoreLocks(a.selection,controls)),lockControls:controls,restoringSelection:true}));
      if(key==='specialOutfitId'&&palette.id!=='none'){assert.equal(ui.completeLookPaletteId,'none');knownLimitations.push({key,palette:palette.id,applied:'none'});}
      let imported=oldImport.getFullBodyImportSource(pair.before),freshImport=getFullBodyImportSource(pair.after);
      assert.equal(Boolean(imported),Boolean(freshImport),'capture eligibility matches fixed main');
      if(!imported){
        assert.equal(key,'dressId');
        knownLimitations.push({kind:'pre-existing-split-dress-import-unavailable',key,palette:palette.id,identicalAtBase:true});
        const compatible={...locks,topBottomPaletteId:'none'};
        imported=oldImport.getFullBodyImportSource(run(old,compatible,'capture-source:'+palette.id).p);
        freshImport=getFullBodyImportSource(run(current,compatible,'capture-source:'+palette.id).p);
        assert.ok(imported&&freshImport,'plain dress import remains available');
      }
      for(const seed of [41,42]){
        const capture={...locks,captureMode:'observation',observationCapture:{...resolveCapture({seed}).profile,personSource:'full-body',importedPerson:imported}};
        compare('frozen-capture:'+key+':'+palette.id+':'+seed,capture,{frozenCapture:true});
        assert.deepEqual(capture.observationCapture.importedPerson,imported,'old imported source unchanged');
      }
      saved.push({key,palette:palette.id,locks,raw,markdown:md,newMarkdown:fresh,oldImport:imported,freshImport});
    }
    for(const role of ['A','B'])for(const [key,item]of reps)for(const palette of ['none','black-red-street','silver-metallic'])for(const crop of options('framingId')){
      const k=key.replace(/Id$/,'')+role+'Id';
      compare('duo:'+role+':'+key+':'+palette+':'+crop.id,{...empty(),subjectCount:'2',[k]:options(k).find(x=>x.zh===item.zh).id,['completeLookPalette'+role+'Id']:palette,['outfitPreset'+role+'PrimaryColorId']:'light-blue',['outfitPreset'+role+'ContrastColorId']:'white',['topBottomPalette'+role+'Id']:concrete('topBottomPaletteId')[0].id,framingId:crop.id});
    }
    for(const item of concrete('characterProfileId'))compare('card:'+item.id,{...empty(),characterProfileId:item.id},{unchanged:true});
    for(const set of concrete('fixedCompositionSetId'))compare('fixed:'+set.id,{...empty(),fixedCompositionSetId:set.id,outfitPresetId:generic.id,outfitPresetPrimaryColorId:'red',outfitPresetContrastColorId:'white',completeLookPaletteId:'black-red-street'});
    for(const coat of concrete('outerwearId'))for(const opening of options('outerwearOpeningId').filter(x=>['敞開穿','全扣上／全拉上'].includes(x.zh)))compare('coat:'+coat.id+':'+opening.id,{...empty(),outfitPresetId:generic.id,outfitPresetPrimaryColorId:'red',outfitPresetContrastColorId:'white',completeLookPaletteId:'black-red-street',outerwearId:coat.id,outerwearOpeningId:opening.id});
    for(let i=0;i<100;i++)compare('random:'+i,current.createEmptyLocks());
    assert.equal(mismatches.length,0,'Unexpected output difference');
    const protectedFiles=git('ls-tree','-r','--name-only','-z',base).toString().split('\0').filter(p=>/^(knowledge_base\/|webapp\/src\/data\/)/.test(p)&&p!=='knowledge_base/catalog/README.md');
    for(const p of protectedFiles)assert.equal(sha256(readFileSync(join(root,p))),sha256(git('show',base+':'+p)),p);
    const report={baseCommit:base,cases:cases.length,protectedCases:cases.filter(x=>x.unchanged).length,protectedFiles:protectedFiles.length,saved:saved.length,compatibility:compatibility.length,changedOutputs,oracleMismatches:0,knownLimitations};
    writeFileSync(join(out,'acceptance.json'),JSON.stringify(report,null,2)+'\n');
    writeFileSync(join(out,'baseline-and-saved.json.gz'),pack({baseCommit:base,baseline,saved,cases,compatibility}));
    console.log(JSON.stringify(report));
  }finally{writeFileSync(join(out,'oracle-mismatches.json'),JSON.stringify(mismatches,null,2)+'\n');}
}finally{rmSync(dir,{recursive:true,force:true});}
