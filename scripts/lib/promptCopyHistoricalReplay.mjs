// Test-only inverses; raw source must match the exact reviewed after hash.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import revisions from './promptCopyRevisions.json' with { type: 'json' };
import policy from './ciPromptCopyPolicy.json' with { type: 'json' };
const root = fileURLToPath(new URL('../../', import.meta.url));
const hash = source => createHash('sha256').update(source).digest('hex');
export const promptCopyHistoricalPaths = [...new Set(revisions.revisions.flatMap(r => r.files.map(f => f.path)))];
const validated = new Map();
export function prePromptCopySource(path, source) {
  let result = source.toString();
  for (const revision of [...revisions.revisions].reverse()) {
    const file = revision.files.find(f => f.path === path);
    if (!file || hash(result) !== file.afterHash) continue;
    const profile = policy.profiles.find(p => p.id === revision.profile);
    assert.ok(profile && [profile.source, 'webapp/src/data/database.json', 'knowledge_base/wardrobe_and_styling.md'].includes(path), 'Unapproved copy inverse path');
    assert.match(revision.base, /^[0-9a-f]{40}$/);
    const key = `${revision.base}:${path}:${file.afterHash}`;
    if (!validated.has(key)) {
      const lines = result.match(/[^\n]*\n|[^\n]+$/g) || [];
      for (const edit of [...file.edits].reverse()) {
        assert.deepEqual(lines.slice(edit.line, edit.line + edit.after.length), edit.after, 'Exact copy inverse fragment');
        lines.splice(edit.line, edit.after.length, ...edit.before);
      }
      const before = lines.join('');
      assert.equal(hash(before), file.beforeHash, 'Copy inverse hash');
      const git = execFileSync('git', ['-C', root, 'show', `${revision.base}:${path}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
      assert.equal(before, git, 'Copy inverse must match trusted Git source');
      validated.set(key, before);
    }
    result = validated.get(key);
  }
  if (result === source.toString()) return source;
  return Buffer.isBuffer(source) ? Buffer.from(result) : result;
}
