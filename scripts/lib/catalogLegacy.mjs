// E: source-only relocation. Runtime formulas remain in engine.js.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
export const PRE_E = '5e7ed02952ceea4a2f76b81583c5f783748ff308';
export const ENGINE = 'webapp/src/lib/engine.js';
export const SOURCE = 'knowledge_base/catalog/legacy_mappings.json';
export const GENERATED = 'webapp/src/data/legacyMappings.json';
export const FIXTURE = 'webapp/src/lib/engine/legacyMappings.baseline.json';
export const CONSTANTS = ['LEGACY_CHARACTER_EXPRESSION_CATEGORY', 'LEGACY_ENVIRONMENT_MOOD_CATEGORY'];
export const TABLES = [
  'REGIONAL_STYLE_LEGACY_OPTION_MAP', 'CAMERA_FRAMING_LEGACY_OPTION_MAP', 'CAMERA_ANGLE_LEGACY_OPTION_MAP',
  'CAMERA_ORBIT_LEGACY_OPTION_MAP', 'CAMERA_AMBIENT_LIGHT_RENAME_LEGACY_OPTION_MAP', 'CAMERA_FILM_LEGACY_OPTION_MAP',
  'CAMERA_PROFILE_RENDERING_MIGRATIONS', 'CHARACTER_IDENTITY_LEGACY_OPTION_MAP', 'CHARACTER_EXPRESSION_POSE_LEGACY_OPTION_MAP',
  'CHARACTER_EXPRESSION_POSE_LEGACY_SOCIAL_POSE_MIGRATIONS', 'CHARACTER_LEGACY_SELFIE_SPECIAL_ACTION_MIGRATIONS',
  'CHARACTER_SPECIAL_ACTION_TO_POSE_COMPOSER_MIGRATIONS', 'LEGACY_POSE_HAND_TO_PROP_ID',
  'CHARACTER_POSE_TO_POSE_COMPOSER_MIGRATIONS', 'POSE_COMPOSER_ARRANGEMENT_TO_ANCHOR_MIGRATIONS',
  'WARDROBE_LEGACY_OPTION_MAP', 'WARDROBE_LEGACY_PROMPT_ALIASES', 'LOCATION_LEGACY_PROMPT_ALIASES',
  'WARDROBE_OUTFIT_TO_DRESS_LEGACY_LOCK_MIGRATIONS', 'LEGACY_HAIR_STYLING_STATE_MIGRATIONS',
  'LEGACY_EYEWEAR_LOCK_MIGRATIONS', 'LEGACY_OUTERWEAR_OPENING_LOCK_MIGRATIONS',
];
export const OPTION_TABLES = TABLES.filter(n => n.endsWith('_OPTION_MAP'));
export const encode = value => JSON.stringify(value, null, 2)+'\n';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const valueHash = value => hash(JSON.stringify(value));
export function parseSource(root, text) {
  const ast = createRequire(join(root,'webapp/package.json'))('espree').parse(text, {ecmaVersion:'latest',sourceType:'module',range:true,loc:true});
  const declarations = new Map(ast.body.flatMap(s => (s.declaration || s).declarations || []).map(d => [d.id.name,d]));
  const literal = (node, seen = new Set()) => {
    assert(node, 'Missing literal');
    if (node.type === 'Literal') { assert(!node.regex && !node.bigint); return node.value; }
    if (node.type === 'ArrayExpression') return node.elements.map(n => literal(n,seen));
    if (node.type === 'ObjectExpression') return Object.fromEntries(node.properties.map(p => {
      assert(p.type==='Property' && !p.computed && p.kind==='init');
      return [p.key.name ?? p.key.value,literal(p.value,seen)];
    }));
    assert(node.type==='Identifier' && !seen.has(node.name), 'Only literal source and literal constant references are supported');
    return literal(declarations.get(node.name)?.init,new Set([...seen,node.name]));
  };
  const extract = name => {
    const d=declarations.get(name); assert(d, 'Missing '+name); let node=d.init, calculation='literal';
    if(node.type==='CallExpression' && node.callee.property?.name==='map') {node=node.callee.object;calculation='load-time map';}
    if(node.type==='NewExpression' && node.callee.name==='Map') {node=node.arguments[0];calculation='load-time Map';}
    return {name, line:d.loc.start.line, calculation, range:node.range, source:literal(node), sourceHash:hash(text.slice(...node.range))};
  };
  return {ast, declarations, literal, inventory:[...CONSTANTS,...TABLES].map(extract)};
}
export function testingExport() {
  const groups={REGIONAL:'regional',CAMERA:'camera',CHARACTER:'character',WARDROBE:'wardrobe'};
  const aliases=OPTION_TABLES.map(n => {
    const group=groups[n.split('_')[0]],helper='build'+group[0].toUpperCase()+group.slice(1)+'LegacyIds';
    return `    ...${n}.map((entry, index) => ({table: '${n}', index, group: '${group}', category: entry.category, targetZh: entry.targetZh, ids: ${helper}(entry.category, entry.legacy, entry.legacyCategory)})),`;
  }).join('\n');
  return `\n// Read-only E compatibility evidence; callers receive copies, never runtime tables.\nexport function getLegacyMappingsForTesting() {\n  return structuredClone({\n    constants: { ${CONSTANTS.join(', ')} },\n    tables: {\n${TABLES.map(n=>`      ${n}: ${n==='LEGACY_POSE_HAND_TO_PROP_ID'?'Array.from('+n+'.entries())':n},`).join('\n')}\n    },\n    optionAliases: [\n${aliases}\n    ],\n    hairLegacyIds: LEGACY_HAIR_STYLING_STATE_MIGRATIONS.flatMap(entry => buildCharacterLegacyIds('髮型 (Hairstyle)', entry.legacy)),\n  });\n}\n`;
}
export function relocatedEngine(root, original) {
  const {inventory}=parseSource(root,original);
  let out=original;
  for(const row of [...inventory].sort((a,b)=>b.range[0]-a.range[0])) {
    const replacement=CONSTANTS.includes(row.name)?`legacyMappings.constants.${row.name}.value`:`legacyMappings.tables.${row.name}.source`;
    out=out.slice(0,row.range[0])+replacement+out.slice(row.range[1]);
  }
  return `import legacyMappings from '../data/legacyMappings.json' with { type: 'json' };\n`+out+testingExport();
}
export async function withPreE(root, sourceSha, callback) {
  assert.equal(sourceSha,PRE_E,'Explicit reviewed pre-E SHA required');
  execFileSync('git',['-C',root,'merge-base','--is-ancestor',sourceSha,'HEAD']);
  const dir=mkdtempSync(join(tmpdir(),'catalog-e-reference-'));
  try {
    const archive=execFileSync('git',['-C',root,'archive',sourceSha,'webapp/src/lib','webapp/src/data','webapp/src/features','webapp/package.json'],{maxBuffer:64e6});
    execFileSync('tar',['-x','-C',dir],{input:archive});
    const original=readFileSync(join(dir,ENGINE),'utf8');
    writeFileSync(join(dir,ENGINE),original+testingExport());
    const engine=await import(pathToFileURL(join(dir,ENGINE)).href);
    const codec=await import(pathToFileURL(join(dir,'webapp/src/features/saved-cards/cardCodec.js')).href);
    return await callback({original, engine, codec});
  } finally {rmSync(dir,{recursive:true,force:true});}
}
export function restoreCases(snapshot, engine, codec) {
  const cases=[],controls=engine.getLockControls(),compiled=engine.getCompiledCatalogForTesting();
  const add=(table,key,value,extra={})=>{
    const input={subjectCount:/[AB](?:Id|ColorId|PlacementId|OpeningId)$/.test(key)?'2':'1',[key]:value,...extra};
    cases.push({table,input,expectedHash:valueHash(engine.normalizeLocks(input,controls))});
  };
  for(const r of snapshot.optionAliases) {
    const target=compiled.catalog[r.group][r.category].find(o=>o.zh===r.targetZh); assert(target);
    for(const c of controls.filter(c=>c.options.some(o=>o.id===target.id))) for(const id of r.ids) add(r.table,c.key,id);
  }
  for(const [table,rows] of Object.entries(snapshot.tables)) {
    if(OPTION_TABLES.includes(table))continue;
    if(table==='CAMERA_PROFILE_RENDERING_MIGRATIONS') {for(const id of Object.keys(rows)) for(const key of ['filmId','cameraSystemId']) add(table,key,id); continue;}
    if(table==='LEGACY_POSE_HAND_TO_PROP_ID') {for(const [id] of rows) {add(table,'poseHandId',id);add(table,'poseHandId',id,{posePropId:'hand-use-phone'});} continue;}
    if(table==='LEGACY_HAIR_STYLING_STATE_MIGRATIONS') {for(const id of snapshot.hairLegacyIds)for(const key of ['hairstyleId','hairstyleAId','hairstyleBId']) {add(table,key,id); add(table,key,id,{[key.replace('hairstyle','hairStylingState')]:'none'});}continue;}
    for(const row of rows) {
      if(row.prompts) {for(const prompt of row.prompts)cases.push({table,prompt,expectedHash:valueHash(codec.parseLocksFromStandardPrompt(prompt,controls))});continue;}
      const keys=table.includes('OUTFIT_TO_DRESS')?['outfitPresetId','outfitPresetAId','outfitPresetBId']:table.includes('EYEWEAR')?['eyewearId','eyewearAId','eyewearBId']:table.includes('OUTERWEAR')?['outerwearId','outerwearAId','outerwearBId']:table.includes('ARRANGEMENT_TO_ANCHOR')?['poseArrangementId']:table.includes('SPECIAL_ACTION')?['specialActionId']:['poseId'];
      for(const key of keys) {
        const ids=row.legacyIds || (row.legacyId?[row.legacyId]:row.arrangementId?[row.arrangementId]:controls.find(c=>c.key===key).options.filter(o=>o.zh===row.label).map(o=>o.id));
        assert(ids.length,table+': no fixture for '+row.label);
        for(const id of ids) {add(table,key,id);add(table,key,id,{poseBaseId:'sitting',poseArrangementId:'sitting-hug-knees',posePropId:'hand-use-phone'});}
        if(table.includes('SELFIE_SPECIAL'))add(table,key,'historical:'+row.label);
      }
    }
  }
  for(const id of ['shoulder-lean','leaning-shoulders']) add('J12','duoPoseId',id,{subjectCount:'2'});
  for(const key of ['poseId','specialActionId','poseHandId','filmId','eyewearId']) add('unknown-fallback',key,'unknown-old-id');
  assert(TABLES.every(table=>cases.some(c=>c.table===table)),'Every table needs a restore case');
  return cases;
}

// Strict field references use displayZh after the real compiler and actual embedded options.
export async function validateLegacyReferences(root, document, engine, snapshot = engine.getLegacyMappingsForTesting()) {
  const issues=[], compiled=engine.getCompiledCatalogForTesting(), controls=engine.getLockControls();
  const pose=await import(pathToFileURL(join(root,'webapp/src/lib/engine/poseComposerOptions.js')).href);
  let references=0, selfAliases=0;const ambiguous=[];
  const issue=(code,key,message)=>issues.push({code,itemKey:key,message,evidence:[]});
  for(const [name,table] of Object.entries(document.tables)) {
    const seen=new Set();
    const check=(field,value,desc,row,index)=>{
      const key=`${name}[${index}].${field}`;
      if(['catalog-zh','attribute','catalog-category'].includes(desc.fieldKind)) {
        const category=desc.category || row[desc.categoryField] || value;
        const options=compiled.entries[desc.group]?.[category];
        if(!options || (desc.fieldKind!=='catalog-category' && !options.some(o=>o.zh===value)))issue('LEGACY_TARGET',key,'Missing catalog category/displayZh: '+value);
        if(desc.fieldKind!=='catalog-category')references++;
      } else if(desc.fieldKind==='embedded-ref') {
        assert.equal(desc.module,'webapp/src/lib/engine/poseComposerOptions.js');
        const matches=pose[desc.export].filter(o=>o[desc.match]===value);references++;
        if(!matches.length)issue('LEGACY_TARGET',key,'Missing embedded reference: '+value);
        if(matches.length>1)ambiguous.push({key,value,orderedMatches:matches.map(o=>o.id),firstMatch:matches[0].id});
      } else if(desc.fieldKind==='legacy-key') {
        const values=desc.format==='pairs'?value:desc.format==='strings'?value:[value];
        for(const v of values) {
          // Identical historical labels in different categories or positions are separate issued keys.
          const token=JSON.stringify([row.legacyCategory || row.category || '',field,v]);
          if(seen.has(token))issue('LEGACY_KEY_DUPLICATE',key,'Repeated legacy key within its category/field namespace');
          seen.add(token);
        }
      }
    };
    if(table.shape==='dictionary')Object.entries(table.source).forEach(([key,value],i)=>{check('$key',key,table.fields.$key,{},i);check('$value',value,table.fields.$value,{},i);});
    else if(table.shape==='pairs')table.source.forEach((row,i)=>row.forEach((v,j)=>check(String(j),v,table.fields[j],{},i)));
    else table.source.forEach((row,i)=>Object.entries(row).forEach(([f,v])=>check(f,v,table.fields[f],row,i)));
  }
  const primary=new Map(Object.values(compiled.entries).flatMap(cs=>Object.values(cs).flat()).map(o=>[o.id,o]));
  for(const row of snapshot.optionAliases) {
    const target=compiled.catalog[row.group][row.category].find(o=>o.zh===row.targetZh);
    for(const id of row.ids)if(primary.has(id)) {
      if(id!==target?.id)issue('LEGACY_CURRENT_ID_COLLISION',row.table+':'+id,'Old ID equals another current entry');
      else selfAliases++;
    }
  }
  // Also protect runtime control namespaces, including computed migration IDs and J12.
  // The shared controlIssues gate owns exact J12 allowlisting; no new exception is introduced here.
  for(const row of snapshot.optionAliases)for(const id of row.ids) {
    const target=compiled.catalog[row.group][row.category].find(o=>o.zh===row.targetZh);
    for(const c of controls.filter(c=>c.options.some(o=>o.id===target?.id))) {
      if(c.options.some(o=>o.id===id && o.id!==target.id))issue('LEGACY_CURRENT_ID_COLLISION',c.key+':'+id,'Old ID shadows a different control entry');
    }
  }
  return {issues,tables:Object.keys(document.tables).length,constants:Object.keys(document.constants).length,references,selfAliases,ambiguous};
}
