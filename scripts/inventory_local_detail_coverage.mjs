// Read-only catalog inventory. Presence of metadata is NOT semantic approval.
// Prints to stdout only; never updates the knowledge base or generated database.
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const input = fs.readFileSync(new URL('../webapp/src/data/database.json', import.meta.url), 'utf8');
const database = JSON.parse(input);
const rows = Object.entries(database.Wardrobe).map(([category, items]) => {
  const candidates = items.filter((item) => item.zh !== '全無');
  return {
    category,
    entriesExcludingNone: candidates.length,
    proposedLocalDetailFieldPresent: candidates.filter((item) => Object.hasOwn(item.meta || {}, 'localDetail')).length,
  };
});
console.log(JSON.stringify({
  source: 'webapp/src/data/database.json',
  sha256: createHash('sha256').update(input).digest('hex'),
  scope: 'Wardrobe catalog only; runtime synthetic modifiers and character profiles require separate review',
  limitation: 'Counts inspect proposed meta.localDetail presence only, not inferred exposure, coverage completeness or runtime support.',
  rows,
}, null, 2));
