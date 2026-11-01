#!/usr/bin/env node
// Read-only stdout CLI. No arbitrary input files, write/update flags or browser adapters.
import { measureBaseline, verifyBaseline } from './lib/savedCardsPersistenceBaseline.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { measureArchiveBaseline, ARCHIVE_BASELINE_URL } from './lib/savedCardsPersistenceArchiveBaseline.mjs';
const args = process.argv.slice(2);
if (args.length > 1 || (args[0] && !['--check', '--measure'].includes(args[0]))) {
  process.stderr.write('Usage: node scripts/check_saved_cards_persistence_a.mjs [--check|--measure]\n');
  process.exitCode = 2;
} else {
  try {
    const result = args[0] === '--measure' ? measureBaseline() : verifyBaseline();
    if (args[0] !== '--measure') {
      const archive = await measureArchiveBaseline();
      assert.deepEqual(archive, JSON.parse(readFileSync(ARCHIVE_BASELINE_URL, 'utf8')), 'Archive baseline drift');
      result.archiveCharacterizationMatched = true;
      result.knownArchiveDefect = archive.status;
    }
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stderr.write(error.stack + '\n');
    process.exitCode = 1;
  }
}
