import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildSunoAvoidPrompt,
  buildSunoFullPrompt,
  buildSunoLyricsDirection,
  buildSunoPromptBundle,
  buildSunoStylesPrompt,
  coerceSunoProfile,
  createEmptySunoProfile,
} from './suno.js';

test('SUNO profile remains backward compatible with the previous simplified shape', () => {
  const profile = coerceSunoProfile({
    genres: ['city-pop'],
    instruments: ['rhodes-stabs'],
    bpm: '85-105',
    groove: 'night-drive-pulse',
    vocals: ['airy-female'],
    textures: ['analog-warmth'],
  });

  assert.deepEqual(profile.genres, ['city-pop']);
  assert.deepEqual(profile.instruments, ['rhodes-stabs']);
  assert.equal(profile.bpm, '85-105');
  assert.equal(profile.groove, 'night-drive-pulse');
  assert.deepEqual(profile.vocals, ['airy-female']);
  assert.deepEqual(profile.textures, ['analog-warmth']);
  assert.deepEqual(profile.subgenres, []);
  assert.deepEqual(profile.avoid, []);
});

test('SUNO prompt bundle builds style, lyrics, full and avoid prompts', () => {
  const profile = {
    ...createEmptySunoProfile(),
    genres: ['city-pop', 'neo-soul'],
    subgenres: ['japanese-city-pop'],
    era: '80s',
    density: 'rich',
    moods: ['bittersweet', 'nostalgic'],
    bpm: '85-105',
    vocalType: 'female',
    vocals: ['airy-female'],
    language: 'japanese',
    instruments: ['rhodes-stabs', '808-sub-bass'],
    structure: ['big-chorus'],
    hookStyle: 'catchy',
    lyricThemes: ['love', 'city-night'],
    lyricPerspective: 'first-person',
    avoid: ['rap', 'edm-drop'],
  };

  const bundle = buildSunoPromptBundle(profile);

  assert.match(buildSunoStylesPrompt(profile), /city pop/);
  assert.match(bundle.stylePrompt, /Japanese city pop/);
  assert.match(buildSunoLyricsDirection(profile), /first-person lyrics/);
  assert.match(buildSunoAvoidPrompt(profile), /Avoid rap verses, EDM drop\./);
  assert.match(buildSunoFullPrompt(profile), /Create a song with/);
  assert.match(bundle.fullPrompt, /Avoid rap verses, EDM drop\./);
});
