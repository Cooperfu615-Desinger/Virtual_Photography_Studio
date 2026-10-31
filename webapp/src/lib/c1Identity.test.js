import {Buffer} from 'node:buffer';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync,symlinkSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import * as engine from './engine.js';
import * as lab from './characterCardLab.js';
import {review,applyApprovedText,publicOutputs,REPORT} from '../../../scripts/lib/c1IdentityFixtures.mjs';
import {C1_ROOT,hash,preC1IdentitySource,preparePreC1IdentityFiles} from '../../../scripts/lib/c1IdentityReplay.mjs';
import {CHARACTER_WARDROBE_SOURCES} from './engine/characterWardrobeSources.js';
import {CHARACTER_PROFILE_OPTIONS} from './engine/characterProfiles.js';
import {validateCharacterWardrobeSources} from '../../../scripts/lib/b3CharacterWardrobeChecks.mjs';
import wardrobeReview from '../../../scripts/lib/b3CharacterWardrobeReview.json' with {type:'json'};
import {serializeFavoritePrompt,deserializeFavoritePrompt} from '../features/saved-cards/cardCodec.js';
const controls=engine.getLockControls(),cards=lab.getCharacterCardOptions(controls);
const baseline=JSON.parse(gunzipSync(readFileSync(join(C1_ROOT,REPORT,'before.json.gz'))));
test('C1 changes exactly the two reviewed anchors; all other card data and compatible identity strings stay byte equivalent',()=>{
  assert.equal(cards.length,33);assert.deepEqual(JSON.parse(JSON.stringify(cards)),applyApprovedText(baseline.cards));
  for(const row of review.rows){const c=cards.find(c=>c.id===row.id);assert.equal(c.distinctiveFeatures.split(', ').length,4);assert.equal(c.distinctiveFeatures.split(', ')[row.anchor],row.after);assert.equal(c[row.sourceField],row.source);}
  for(const c of cards)assert.equal(c.identityAndBody,c.legacyIdentityAndBody);
  for(const [a,b]of review.retainedSkinPairs)assert.equal(cards.find(c=>c.id===a).skinSignature,cards.find(c=>c.id===b).skinSignature);
  assert.deepEqual(validateCharacterWardrobeSources(CHARACTER_WARDROBE_SOURCES,CHARACTER_PROFILE_OPTIONS,cards,wardrobeReview),{cards:33,layers:134,shared:118,reviewedDifferences:16});
});
test('C1 Natsuki and Miku retain specific anatomical contrasts, not just different spellings or styling',()=>{
  const n=cards.find(c=>c.id==='character-natsuki'),m=cards.find(c=>c.id==='character-miku');
  assert.match(n.distinctiveFeatures,/smooth tapered jaw/);assert.match(n.distinctiveFeatures,/large level dark-brown round-almond eyes/);assert.match(n.distinctiveFeatures,/even lower lip/);
  assert.match(m.distinctiveFeatures,/slightly wide-set.*soft lower-lid fullness/);assert.match(m.distinctiveFeatures,/fuller lower lip/);
  for(const c of [n,m])assert.doesNotMatch(c.distinctiveFeatures,/\b(hair|outfit|makeup|lipstick|eyeliner|freckles|mole)\b/);
});
test('each of the six PAGE2 outputs independently keeps every anchor for all cards and wardrobe modes',()=>{
  for(const c of cards)for(const mode of ['pure','all','one']){
    const v=lab.createEmptyCharacterCardVariant([c]);if(mode==='pure')v.outputMode='pure-character';if(mode==='one')v.includedWardrobeLayers=v.includedWardrobeLayers.slice(0,1);
    const bundle=lab.buildCharacterCardPromptBundle(cards,v);assert.equal(bundle.outputs.length,6);
    for(const o of bundle.outputs)for(const anchor of c.distinctiveFeatures.split(', '))assert.ok(o.value.toLowerCase().includes(anchor.toLowerCase()),c.id+':'+mode+':'+o.id+':'+anchor);
  }
});
test('C1 both identities survive every compatible hair variant, removable eyewear and imported PAGE1 layers',()=>{
  for(const row of review.rows){const c=cards.find(c=>c.id===row.id);
    for(const hair of lab.getCompatibleHairVariants(c))for(const mode of ['pure-character','included-wardrobe'])for(const eyewearMode of ['default','glasses-off','glasses-on']){
      const v={...lab.createEmptyCharacterCardVariant([c]),hairVariantId:hair.id,outputMode:mode,eyewearMode};
      const locks=lab.buildPage1LocksFromCharacterCardVariant(engine.createEmptyLocks(),v,cards);
      const [p]=engine.generatePrompts(1,locks,[],{random:engine.createSeededRandom('c1:'+c.id+hair.id+mode+eyewearMode)});
      for(const [id,text]of Object.entries(publicOutputs(p))){assert.ok(text,id);for(const a of c.distinctiveFeatures.split(', '))assert.ok(text.toLowerCase().includes(a.toLowerCase()),c.id+':'+id+':'+a);}
      assert.equal(locks.characterProfileId,c.id);assert.equal(locks.subjectCount,'1');
    }
  }
});
test('old Saved Cards retain their public originals; regenerating by unchanged ID uses the current anchors',()=>{
  for(const row of baseline.saved){const old=deserializeFavoritePrompt(row.raw),frozen=structuredClone(old);
    const raw=serializeFavoritePrompt(old);assert.deepEqual(publicOutputs(deserializeFavoritePrompt(raw)),publicOutputs(old));assert.deepEqual(old,frozen);
    if(row.source==='page2'){
      const preserved=lab.buildCharacterCardSavedCard(cards,row.variant,row.bundle);assert.deepEqual(publicOutputs(preserved),publicOutputs(old));
      const fresh=lab.buildCharacterCardPromptBundle(cards,row.variant);assert.deepEqual(fresh.outputs,applyApprovedText(row.bundle.outputs));assert.notDeepEqual(fresh.outputs,row.bundle.outputs);
    }
  }
});
test('C1 inverse matches the trusted Git source, is idempotent, and refuses unsafe or mixed copies',()=>{
  const current=readFileSync(join(C1_ROOT,review.path)),before=execFileSync('git',['show',review.baseCommit+':'+review.path],{cwd:C1_ROOT});
  assert.equal(hash(before),review.beforeHash);assert.deepEqual(preC1IdentitySource(review.path,current),before);
  assert.throws(()=>preparePreC1IdentityFiles(C1_ROOT),/isolated/);
  for(const mode of ['valid','git','missing','tampered','mixed','duplicate','symlink','parent-symlink']){
    const dir=mkdtempSync(join(tmpdir(),'c1-inverse-'));try{
      const path=join(dir,review.path);mkdirSync(dirname(path),{recursive:true});
      if(mode==='symlink')symlinkSync(join(C1_ROOT,review.path),path);
      else if(mode==='parent-symlink'){rmSync(join(dir,'webapp'),{recursive:true});symlinkSync(join(C1_ROOT,'webapp'),join(dir,'webapp'),'dir');}
      else if(mode!=='missing')writeFileSync(path,mode==='tampered'?Buffer.concat([current,Buffer.from('\n// changed')]):mode==='mixed'?current.toString().replace(review.rows[0].after,review.rows[0].before):mode==='duplicate'?Buffer.concat([current,current]):current);
      if(mode==='git')mkdirSync(join(dir,'.git'));
      if(mode==='valid'){preparePreC1IdentityFiles(dir).apply();assert.deepEqual(readFileSync(path),before);preparePreC1IdentityFiles(dir).apply();assert.deepEqual(readFileSync(path),before);}
      else assert.throws(()=>preparePreC1IdentityFiles(dir),/rejects|missing/);
    }finally{rmSync(dir,{recursive:true,force:true});}
  }
  assert.deepEqual(readFileSync(join(C1_ROOT,review.path)),current);
});
