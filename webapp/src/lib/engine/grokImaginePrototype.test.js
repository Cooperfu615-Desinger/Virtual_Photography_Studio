import { getGrokImagineResult } from '../grokImagineResult.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getFullBodyImportSource } from '../observationCaptureImport.js';
import { getReferencePersonPreview } from '../referencePersonPreview.js';
import { cases, option, runCase } from './grokImaginePrototypeFixtures.js';
import { SPECIFIED_ACTION_CONCRETE_OPTIONS } from './specifiedActions.js';
import { createSeededRandom, generatePrompts, getLockControls } from '../engine.js';
const baseline=JSON.parse(fs.readFileSync(new URL('./grokImaginePrototypeBaseline.json',import.meta.url)));
test('all existing outputs, selection, structure, summary and random calls stay unchanged',()=>{
  for(const entry of cases){ const {stable,draws}=runCase(entry,true); assert.deepEqual({stable,draws},baseline[entry.name],entry.name); }
});
test('medium, face, and full retain the same effective body, pose, garments and full scene',()=>{
 for(const entry of cases.slice(0,3)){
  const {stable,prototype}=runCase(entry,true);
  assert.equal(typeof prototype,'string',entry.name);
  for(const term of ['C–D cup bust','165–170 cm','medium soft waves','black-tea brown','one hand gently tugging','standing','camisole','jeans','socks','stiletto','small British inn room','aged wooden furniture','bedside table','50mm']) assert.ok(prototype.toLowerCase().includes(term.toLowerCase()),`${entry.name}: ${term}`);
  assert.equal(stable.selection.topId,entry.locks.topId);
  assert.ok(!/--(?:ar|v|raw)\b|^Subject:|^Wardrobe:/m.test(prototype));
 }
});
test('random selected garment is shared without extra random calls',()=>{
 const entry=cases.find(x=>x.name==='random-top'); const {stable,prototype}=runCase(entry,true);
 const control=(getLockControls()).find(c=>c.key==='topId');
 const selected=control.options.find(o=>o.id===stable.selection.topId);
 assert.ok(selected && selected.en && selected.zh!=='全無');
 assert.ok(prototype.includes(selected.en),selected.zh);
});

test('full original resolved text and canonical pose are preserved across three framings',()=>{
 for(const entry of cases.slice(0,3)) {
   const {stable,prototype}=runCase(entry,true);
   const sourceItems=[...stable.structured.Character.filter(x=>/體態-body-type|姿勢組合器-pose-composer/.test(x.id)),
      ...stable.structured.Wardrobe.filter(x=>/上身-tops|褲裝-pants|襪類-legwear|鞋款-shoes/.test(x.id) && x.zh!=='全無'),
      ...stable.structured.Location.filter(x=>x && x.zh!=='全無')];
   assert.equal(sourceItems.length,7,entry.name);
   for(const item of sourceItems) assert.ok(prototype.toLowerCase().includes(item.en.toLowerCase()),`${entry.name}: ${item.zh}`);
 }
});
test('unselected items are silent and legacy comparison can disable the new output',()=>{
 const entry=cases.find(x=>x.name==='none');
 const {prototype,stable}=runCase(entry,true);
 assert.ok(prototype); assert.doesNotMatch(prototype,/\bnone\b|jeans|socks|stiletto/i);
 assert.equal(runCase(entry,false).prototype,undefined);
 assert.deepEqual(stable.selection,baseline.none.stable.selection);
});
test('fixed mode is available without changing the existing frozen baseline',()=>{
 assert.ok(runCase(cases.find(x=>x.name==='fixed'),true).prototype);
});

test('duo retains each role’s resolved garments and body without swapping roles',()=>{
 const base=cases.find(x=>x.name==='duo');
 const entry={...base,locks:{...base.locks,bodyTypeAId:option('bodyTypeAId','高挑時裝模特'),bodyTypeBId:option('bodyTypeBId','小隻精緻身形')}};
 const {stable,prototype}=runCase(entry,true);
 assert.ok(prototype);
 const a=prototype.indexOf('Woman 1 has'); const b=prototype.indexOf('Woman 2 has');
 assert.ok(a>=0 && b>a);
 const first=prototype.slice(a,b),second=prototype.slice(b);
 assert.match(first,/170–175 cm/);assert.match(first,/jeans/i);assert.doesNotMatch(first,/denim shorts/i);
 assert.match(second,/150–155 cm/);assert.match(second,/shorts/i);assert.doesNotMatch(second,/straight-leg jeans/i);
 const normal=runCase(entry,false);assert.deepEqual(stable,normal.stable);
});

test('complete outfits and closed outerwear respect the same effective selection',()=>{
 const base=cases[0];
 const preset={...base,name:'preset',locks:{...base.locks,outfitPresetId:option('outfitPresetId','套裝：內衣寫真'),outfitPresetPrimaryColorId:option('outfitPresetPrimaryColorId','黑色'),outfitPresetContrastColorId:option('outfitPresetContrastColorId','白色')}};
 const special={...base,name:'special',locks:{...base.locks,specialOutfitId:option('specialOutfitId','黑色波點頭巾透紗套裝')}};
 const closed={...base,name:'closed',locks:{...base.locks,outerwearId:option('outerwearId','飛行夾克'),outerwearOpeningId:option('outerwearOpeningId','全扣上／全拉上')}};
 const p=runCase(preset,true), q=runCase(special,true), r=runCase(closed,true);
 assert.ok(p.prototype);assert.match(p.prototype,/lingerie/i);assert.match(p.prototype,/black/i);assert.match(p.prototype,/white/i);assert.doesNotMatch(p.prototype,/controlled by/i);assert.doesNotMatch(p.prototype,/cotton camisole|straight-leg jeans/i);
 assert.ok(q.prototype);assert.match(q.prototype,/polka-dot/i);assert.match(q.prototype,/skirt/i);assert.match(q.prototype,/boots/i);assert.match(q.prototype,/bag/i);
 assert.ok(r.prototype);assert.match(r.prototype,/fully zipped closed/i);assert.doesNotMatch(r.prototype,/cotton camisole/i);assert.match(r.prototype,/jeans/i);
 for(const entry of [preset,special,closed]){const a=runCase(entry,false),b=runCase(entry,true);assert.deepEqual(b.stable,a.stable);assert.equal(b.draws,a.draws);}
});

test('resolved garment colors and selected ratio stay attached to the same items',()=>{
 const base=cases[0]; const entry={...base,name:'color',locks:{...base.locks,aspectRatio:'16:9',
  topColorId:option('topColorId','白色'),bottomColorId:option('bottomColorId','深藍色'),
  legwearColorId:option('legwearColorId','黑色'),shoesColorId:option('shoesColorId','黑色')}};
 const p=runCase(entry,true);const old=runCase(entry,false);
 for(const term of ['white cotton camisole','dark blue straight-leg jeans','black ribbed ankle socks','black pointed-toe stiletto','16:9']) assert.ok(p.prototype.toLowerCase().includes(term),term);
 assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);
});

test('default character card keeps permanent anchors, full body and complete outfit',()=>{
 const entry=cases.find(x=>x.name==='character-card');
 const {prototype,stable}=runCase(entry,true);
 const profile=getLockControls().find(c=>c.key==='characterProfileId').options.find(o=>o.id===stable.selection.characterProfileId).profile;
 assert.ok(prototype);
 for(const source of [profile.facialGeometry,profile.eyeSignature,profile.noseSignature,profile.mouthSignature,profile.body,profile.distinctiveFeatures,profile.hair,profile.outfit,profile.accessories]) assert.ok(prototype.toLowerCase().includes(source.toLowerCase()),source);
});

test('all default character cards preserve their structured identity and complete outfit',()=>{
 const base=cases.find(x=>x.name==='character-card');
 const profiles=getLockControls().find(c=>c.key==='characterProfileId').options.filter(o=>o.profile);
 assert.equal(profiles.length,33);
 for(const card of profiles){
  const entry={...base,name:'all-cards',locks:{...base.locks,characterProfileId:card.id}};
  const current=runCase(entry,true),before=runCase(entry,false);
  assert.ok(current.prototype,card.zh);
  for(const key of ['facialGeometry','eyeSignature','noseSignature','mouthSignature','body','distinctiveFeatures','hair','outfit','accessories']){
   const value=card.profile[key]?.replace(/ as the locked footwear state/gi, '');if(value)assert.ok(current.prototype.toLowerCase().includes(value.toLowerCase()),`${card.zh}: ${key}`);
  }
  assert.deepEqual(current.stable,before.stable);assert.equal(current.draws,before.draws);
 }
});

test('fixed transit and lounge preserve resolved scene, position, and complete wardrobe',()=>{
 const base=cases[0];
 const samples=[
  {fixedCompositionSetId:'japan-carriage-bench-front',fixedSetPositionId:'carriage-bench-upright',expected:['carriage','bench']},
  {fixedCompositionSetId:'nyc-subway-bench-platform',fixedSetPositionId:'station-nyc-seated',expected:['subway platform','waiting bench']},
  {fixedCompositionSetId:'limewash-black-velvet-industrial-sofa',fixedSetPositionId:'sofa-free-interaction',expected:['black velvet sofa','coffee table']},
 ];
 for(const f of samples){const entry={...base,name:`fixed-${f.fixedCompositionSetId}`,locks:{...base.locks,...f}};delete entry.locks.expected;const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype,f.fixedCompositionSetId);for(const term of [...f.expected,'cotton camisole','jeans','socks','stiletto'])assert.match(p.prototype,new RegExp(term,'i'),`${f.fixedCompositionSetId}: ${term}`);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);}
});

test('preset and multi-clause garment colors preserve visual details without control text',()=>{
 const base=cases[0];
 const entries=[{name:'preset-swim',locks:{...base.locks,outfitPresetId:option('outfitPresetId','套裝：泳裝度假')}},
 {name:'chrome-dress',locks:{...base.locks,dressId:option('dressId','連身：短版｜高領挖腰連身泳裝'),dressColorId:option('dressColorId','鏡面鉻銀')}}];
 for(const entry of entries){const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype,entry.name);assert.doesNotMatch(p.prototype,/controlled by|color selection/i);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);if(entry.name==='preset-swim')assert.match(p.prototype,/triangle bikini swimwear set/i);else {assert.match(p.prototype,/high-neck extreme front cut-out monokini swimsuit/i);assert.match(p.prototype,/mirror-chrome silver/i);assert.match(p.prototype,/crisp environment reflections/i);}}
});

test('card layers and hair variant retain selected card and PAGE1 sources',()=>{
 const base=cases.find(x=>x.name==='character-card');const entry={...base,name:'card-selected',locks:{...base.locks,characterProfileId:'character-rika',characterCardHairVariantId:'low-ponytail',characterCardWardrobeMode:'selected-layers',characterCardWardrobeLayerIds:['top'],characterCardPromptOverride:'temporary override text',skirtId:option('skirtId','牛仔短裙'),shoesId:option('shoesId','高跟鞋'),neckAccessoryId:option('neckAccessoryId','鎖骨細金屬鏈')}};
 const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype);for(const term of ['low ponytail','temporary override text','cropped white short-sleeve baby tee','skirt','heels','collarbone'])assert.match(p.prototype,new RegExp(term,'i'),term);assert.doesNotMatch(p.prototype,/low-rise light-wash blue jeans/i);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);
});

test('observation capture keeps all eight same-run capture choices and uncropped action',()=>{
 const base=cases.find(x=>x.name==='character-card');const entry={...base,name:'capture-card',locks:{...base.locks,captureMode:'observation',observationCapture:{version:1,seed:29,selected:{},fixed:{}}}};
 const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);const s=p.stable.selection.observationCapture;assert.ok(s);assert.equal(Object.values(s.selected).filter(Boolean).length,8);const pose=p.stable.structured.Character.find(x=>x.id.includes('pose-composer:observation-'));assert.ok(p.prototype.toLowerCase().includes(pose.en.toLowerCase()));for(const [key,choice] of Object.entries(pose.meta.observationCapture)){if(choice.en)assert.ok(p.prototype.toLowerCase().includes(choice.en.toLowerCase()),key);}
});

test('dedicated special subjects retain their selected subject and do not revive wardrobe',()=>{
 for(const item of getLockControls().find(c=>c.key==='specialSubjectId').options.filter(o=>o.specialSubject)){
  const entry={...cases[0],name:`subject-${item.id}`,locks:{...cases[0].locks,specialSubjectId:item.id}};const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype,item.id);assert.ok(p.prototype.toLowerCase().includes(item.en.toLowerCase()),item.id);assert.doesNotMatch(p.prototype,/cotton camisole|straight-leg jeans/i);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);
 }
});

test('custom identity preserves supplied text without changing other outputs or random draws',()=>{
 const entry=cases[0], identity='An adult woman with a distinctive silver facial marking';
 const run=flag=>{let draws=0;const rand=createSeededRandom('custom-grok7');const [p]=generatePrompts(1,entry.locks,[],{experimentalGrok7:flag,characterProfilePrompt:identity,random:()=>{draws++;return rand();}});const text=getGrokImagineResult(p);p.extraPrompts=p.extraPrompts.filter(entry=>entry.id!=='grok-imagine');delete p.id;delete p.date;return {text,p,draws};};const a=run(false),b=run(true);assert.ok(b.text);assert.ok(b.text.includes(identity));assert.deepEqual(b.p,a.p);assert.equal(b.draws,a.draws);
});

test('resolved single-subject visual fields survive each supported framing',()=>{
 const base=cases[0];const fixed={...base.locks,facialFeaturesId:option('facialFeaturesId','日系清透臉'),skinDetailsId:option('skinDetailsId','自然雀斑'),expressionId:option('expressionId','平靜淡然'),headAccessoryId:option('headAccessoryId','棒球帽'),eyewearId:option('eyewearId','粗框眼鏡'),earringsId:option('earringsId','珍珠耳釘'),neckAccessoryId:option('neckAccessoryId','金屬細頸圈'),waistAccessoryId:option('waistAccessoryId','細版皮革腰帶'),lightingId:option('lightingId','晴朗白日'),lightDirectionId:option('lightDirectionId','柔和順光'),apertureId:option('apertureId','f/2.8 淺景深'),shutterId:option('shutterId','1/250s 日常清晰'),opticalEffectId:option('opticalEffectId','重散景光斑'),filmId:option('filmId','柯達 Portra 暖膚底片')};
 const frames=getLockControls().find(c=>c.key==='framingId').options.filter(o=>o.en && o.zh!=='全無').map(o=>o.zh);
 for(const frame of frames){const entry={name:`field-${frame}`,locks:{...fixed,framingId:option('framingId',frame)}};const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype,frame);const t=p.prototype.toLowerCase();for(const term of ['soft natural features','natural freckles across nose and cheeks','calm composed expression','baseball cap','bold thick-frame glasses','small pearl stud earring','slim metal choker','decorative slim leather waist belt','clear daylight environment','soft frontal subject light','f/2.8-style shallow depth of field','1/250s handheld shutter look','heavy bokeh rendering','kodak portra film rendering','cotton camisole','straight-leg jeans','ribbed ankle socks','pointed-toe stiletto'])assert.ok(t.includes(term),`${frame}: ${term}`);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);}
});

test('capture with imported person retains the same full-body source and capture choices',()=>{
 const [person]=generatePrompts(1,cases[0].locks,[],{random:createSeededRandom('imported-person')});const imported=getFullBodyImportSource(person);assert.ok(imported);
 const entry={...cases[0],name:'capture-imported',locks:{...cases[0].locks,characterProfileId:'none',captureMode:'observation',observationCapture:{version:1,seed:31,selected:{},fixed:{},personSource:'full-body',importedPerson:imported}}};const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);
 for(const term of ['soft hourglass silhouette','side-parted medium soft waves','cotton camisole','straight-leg jeans','ribbed ankle socks','pointed-toe stiletto'])assert.match(p.prototype,new RegExp(term,'i'),term);
 const pose=p.stable.structured.Character.find(x=>x.id.includes('pose-composer:observation-'));for(const [key,choice] of Object.entries(pose.meta.observationCapture)){if(choice.en)assert.ok(p.prototype.toLowerCase().includes(choice.en.toLowerCase()),key);}
});

test('pose composer takeover does not revive an inactive special action',()=>{
 const entry={...cases[0],name:'action-and-pose',locks:{...cases[0].locks,specialActionId:option('specialActionId','喝冰咖啡')}};const p=runCase(entry,true),old=runCase(entry,false);const pose=p.stable.structured.Character.find(x=>x.id?.includes('姿勢組合器-pose-composer'));assert.ok(pose);assert.ok(p.prototype.toLowerCase().includes(pose.en.toLowerCase()));assert.doesNotMatch(p.prototype,/takeaway cup of iced coffee/i);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);
});

test('explicit garment modifiers and accessory color are retained in face detail',()=>{
 const entry={...cases[0],name:'face-modifiers',locks:{...cases[0].locks,framingId:option('framingId','局部五官特寫'),poseHandId:'none',headAccessoryId:option('headAccessoryId','棒球帽'),headAccessoryColorId:option('headAccessoryColorId','黑色'),topFitId:'fitted',topStylingId:'tucked',topPatternId:option('topPatternId','細直條紋'),bottomFitId:'tight',bottomRiseId:'low-rise',bottomPatternId:option('bottomPatternId','細直條紋')}};
 const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype);for(const term of ['black baseball cap','fitted upper-body','tucked','vertical stripe pattern','tight body-skimming','low-rise waistband'])assert.match(p.prototype,new RegExp(term,'i'),term);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);
});

test('every fixed set retains its complete authored scene and existing output baseline',()=>{
 const options=getLockControls().find(c=>c.key==='fixedCompositionSetId').options.filter(o=>o.id!=='none'&&o.en);assert.ok(options.length>10);
 for(const item of options){const entry={name:`fixed-set-${item.id}`,locks:{...cases[0].locks,fixedCompositionSetId:item.id}};const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype,item.id);const source=item.en.replace(/Sky color, cloud shape, sun strength, water brightness, and weather mood are controlled by the selected ambient light and subject-light options, not by this fixed set\.\s*/i, '');assert.ok(p.prototype.toLowerCase().includes(source.toLowerCase()),item.id);assert.doesNotMatch(p.prototype,/fixed-set rule:|preserve anchors:|controlled by/i);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);}
});

test('every transit pose position preserves the full seat or support source',()=>{
 const positions=getLockControls().find(c=>c.key==='fixedSetPositionId').options.filter(x=>x.carriagePose||x.stationPose);assert.ok(positions.length>10);
 for(const position of positions){const entry={name:`position-${position.id}`,locks:{...cases[0].locks,fixedCompositionSetId:position.setId,fixedSetPositionId:position.id}};const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype,position.id);assert.ok(p.prototype.toLowerCase().includes(position.en.toLowerCase()),position.id);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);}
});

test('special look hair replacement keeps the associated headwear',()=>{
 const base=cases[0];for(const [look,accessory] of [['黑毛帽白短背心鏈條工裝寬褲造型','black knit beanie'],['黃色寬T條紋襯衫橄欖工裝褲造型','pale blue embroidered baseball cap'],['紅緞背心牛仔迷你裙騎士靴造型','luxury patterned bandana headscarf'],['粉色蝴蝶結背心牛仔短褲泡泡襪造型','small pink bow hair clips'],['綠針織運動短褲藍包造型','pale blue bandana headscarf'],['紫色佩斯利襯衫短褲軍靴造型','green bandana headscarf'],['紅帽波點背心寬牛仔造型','red baseball cap']]){const entry={name:`look-${look}`,locks:{...base.locks,specialOutfitId:option('specialOutfitId',look)}};const p=runCase(entry,true);assert.ok(p.prototype);assert.ok(p.prototype.toLowerCase().includes(accessory),look);assert.ok(p.prototype.includes('Side-parted medium soft waves'));}
});

test('reference preview uses the reference person and keeps existing six preview outputs',()=>{
 const before=runPromptWithReference(false),after=runPromptWithReference(true);assert.ok(after.text);assert.match(after.text,/attached reference image/i);assert.doesNotMatch(after.text,/cotton camisole|straight-leg jeans|soft hourglass silhouette/i);assert.match(after.text,/gently tugging/i);assert.match(after.text,/small British inn room/i);assert.deepEqual(after.stable,before.stable);assert.equal(after.draws,before.draws);
 function runPromptWithReference(flag){let draws=0;const rand=createSeededRandom('reference-grok7');const [p]=generatePrompts(1,cases[0].locks,[],{experimentalGrok7:flag,random:()=>{draws++;return rand();}});const result=getReferencePersonPreview(p);const text=getGrokImagineResult(result);const stable={...result,extraPrompts:result.extraPrompts.filter(entry=>entry.id!=='grok-imagine')};delete stable.id;delete stable.date;return {stable,text,draws};}
});

test('specified actions keep their complete canonical source and do not revive latent props across framings',()=>{
 for(const action of SPECIFIED_ACTION_CONCRETE_OPTIONS){for(const frame of ['局部五官特寫','中景鏡頭 (Medium Shot)','全身鏡頭 (Full Body Shot)']){const entry={name:`specified-${action.id}-${frame}`,locks:{...cases[0].locks,poseBaseId:action.baseId,specifiedActionId:action.id,poseHandId:'arms-crossed',posePropId:'hand-hold-iced-coffee',poseAnchorId:'sitting-chair',framingId:option('framingId',frame)}};const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype,entry.name);const pose=p.stable.structured.Character.find(x=>x.id?.includes('姿勢組合器-pose-composer'));assert.ok(pose,entry.name);assert.ok(p.prototype.toLowerCase().includes(pose.en.toLowerCase()),entry.name);assert.doesNotMatch(p.prototype,/iced coffee/i,entry.name);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);}}
});

test('supine support and owned scene stay faithful across close, medium and full framing',()=>{
 for(const frame of ['局部五官特寫','中景鏡頭 (Medium Shot)','全身鏡頭 (Full Body Shot)']){const entry={name:`supine-${frame}`,locks:{...cases[0].locks,poseBaseId:'lying',poseOrientationId:'lying-supine',poseArrangementId:'lying-body-natural-stretch',poseHandId:'none',poseHeadId:'none',poseAnchorId:'lying-bed-surface',framingId:option('framingId',frame)}};const p=runCase(entry,true),old=runCase(entry,false);const pose=p.stable.structured.Character.find(x=>x.id?.includes('姿勢組合器-pose-composer'));assert.ok(p.prototype,frame);assert.ok(pose,frame);assert.ok(p.prototype.toLowerCase().includes(pose.en.toLowerCase()),frame);assert.match(p.prototype,/bed/i,frame);assert.doesNotMatch(p.prototype,/small british inn room/i,frame);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);}
});

test('observation capture retains all eight resolved options over 20 fixed capture seeds',()=>{
 const base=cases.find(x=>x.name==='character-card');for(let seed=1;seed<=20;seed++){const entry={name:`capture-seed-${seed}`,locks:{...base.locks,captureMode:'observation',observationCapture:{version:1,seed,selected:{},fixed:{}}}};const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype,String(seed));const pose=p.stable.structured.Character.find(x=>x.id.includes('pose-composer:observation-'));for(const [key,choice] of Object.entries(pose.meta.observationCapture)){if(choice.en)assert.ok(p.prototype.toLowerCase().includes(choice.en.toLowerCase()),`${seed}: ${key}`);}assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);}
});

test('duo source fields and colors stay with their respective roles across framings',()=>{
 const base=cases.find(x=>x.name==='duo');const locks={...base.locks,bodyTypeAId:option('bodyTypeAId','高挑時裝模特'),bodyTypeBId:option('bodyTypeBId','小隻精緻身形'),hairstyleAId:option('hairstyleAId','側分柔波中長髮'),hairstyleBId:option('hairstyleBId','側分柔波中長髮'),hairColorAId:option('hairColorAId','柔霧黑茶'),hairColorBId:option('hairColorBId','柔霧黑茶'),topAColorId:option('topAColorId','白色'),topBColorId:option('topBColorId','黑色'),shoesAId:option('shoesAId','尖頭細跟高跟鞋'),shoesBId:option('shoesBId','高跟鞋')};
 for(const frame of ['全臉傾斜特寫','中景鏡頭 (Medium Shot)','全身鏡頭 (Full Body Shot)']){const entry={name:`duo-fields-${frame}`,locks:{...locks,framingId:option('framingId',frame)}};const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype,frame);const a=p.prototype.indexOf('Woman 1 has'),b=p.prototype.indexOf('Woman 2 has');assert.ok(a>=0&&b>a,frame);const first=p.prototype.slice(a,b),second=p.prototype.slice(b);for(const term of ['170–175 cm','white cotton camisole','straight-leg jeans','pointed-toe stiletto','side-parted medium soft waves','soft black-tea brown hair'])assert.ok(first.toLowerCase().includes(term.toLowerCase()),`${frame} first: ${term}`);for(const term of ['150–155 cm','black short-sleeve top','denim shorts','high heels','side-parted medium soft waves','soft black-tea brown hair'])assert.ok(second.toLowerCase().includes(term.toLowerCase()),`${frame} second: ${term}`);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);}
});

test('fixed scene and background state remain separate readable sentences',()=>{
 const entry={name:'fixed-background-boundary',locks:{...cases[0].locks,fixedCompositionSetId:'seaside-slope-railway-crossing',fixedSetBackgroundStateId:'crossing-train-passing'}};const p=runCase(entry,true),old=runCase(entry,false);assert.ok(p.prototype);assert.match(p.prototype,/foreground\. Railway crossing state: one local train may pass/i);assert.match(p.prototype,/overhead wires/i);assert.deepEqual(p.stable,old.stable);assert.equal(p.draws,old.draws);
});
