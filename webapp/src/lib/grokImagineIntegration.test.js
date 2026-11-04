import { getGrokImagineResult, withGrokImagineForSave } from './grokImagineResult.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEmptyLocks, createSeededRandom, generatePrompts, getLockControls } from './engine.js';
import { buildPage1DisplayOutputs, buildPage1GenerationPromptCards } from './page1PromptOutputs.js';
import { buildMarkdownExport, parseExportedMarkdownPrompt, serializeFavoritePrompt, deserializeFavoritePrompt } from '../features/saved-cards/cardCodec.js';
import { createSavedCardsArchive, parseSavedCardsArchive } from '../features/saved-cards/savedCardArchive.js';
const generate = enabled => generatePrompts(1, {...createEmptyLocks(), subjectCount:'1'}, [], {
  random:createSeededRandom('grok7-integration-v1'), experimentalGrok7:enabled,
})[0];
const seventh = p => getGrokImagineResult(p);
const legacy = p => ({...p, extraPrompts:p.extraPrompts.filter(entry=>entry.id!=='grok-imagine'), id:'fixture', date:'2026-11-04T00:00:00.000Z'});

test('new output is appended without modifying existing prompt data, selection or resolved sources',()=>{
 const old=generate(false), current=generate(true);assert.ok(seventh(current));assert.deepEqual(legacy(current),legacy(old));
 const all=buildPage1GenerationPromptCards(current), six=buildPage1GenerationPromptCards(old);
 assert.deepEqual(all.slice(0,-1),six);assert.equal(all.at(-1).title,'Grok Imagine');assert.equal(all.at(-1).value,seventh(current));
 const display=buildPage1DisplayOutputs(current,'four-free-variations');const unappended=buildPage1DisplayOutputs(old,'four-free-variations');assert.deepEqual(display.cards.slice(0,-1),unappended.cards);assert.deepEqual(display.dllSources.slice(0,-1),unappended.dllSources);assert.equal(display.cards.at(-1).value,display.dllSources.at(-1).value);assert.ok(display.cards.at(-1).value.startsWith(seventh(current)));
});

test('new output and all old text survive favorite, Markdown, ZIP and legacy round trips',async()=>{
 const p=withGrokImagineForSave(generate(true)),previous=generate(false);for(const item of [p,previous]){item.id='grok7-roundtrip';item.date='2026-11-04T00:00:00.000Z';item.source='page1';}
 const restored=deserializeFavoritePrompt(serializeFavoritePrompt(p));const oldRound=deserializeFavoritePrompt(serializeFavoritePrompt(previous));assert.deepEqual(restored.extraPrompts,p.extraPrompts);assert.deepEqual(restored.selection,oldRound.selection);
 const fromMarkdown=parseExportedMarkdownPrompt(buildMarkdownExport(p),getLockControls(),'grok7-import');const oldMarkdown=parseExportedMarkdownPrompt(buildMarkdownExport(previous),getLockControls(),'grok7-import');assert.deepEqual(fromMarkdown.extraPrompts,p.extraPrompts);assert.deepEqual(fromMarkdown.selection,oldMarkdown.selection);
 const [fromZip]=await parseSavedCardsArchive(await createSavedCardsArchive([p],0,'uint8array'),getLockControls());const [oldZip]=await parseSavedCardsArchive(await createSavedCardsArchive([previous],0,'uint8array'),getLockControls());assert.deepEqual(fromZip.extraPrompts,p.extraPrompts);assert.deepEqual(fromZip.selection,oldZip.selection);assert.deepEqual(oldRound.extraPrompts,previous.extraPrompts);assert.equal(seventh(oldRound),'');
});
