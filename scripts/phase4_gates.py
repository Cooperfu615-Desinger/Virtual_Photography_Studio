"""Run Phase 4 gates with a trusted registry SHA; retain lossless compressed logs."""
import gzip
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'Docs/reports/phase4-completion-2026-10-28' / sys.argv[1]
assert OUT.parent == ROOT / 'Docs/reports/phase4-completion-2026-10-28'
OUT.mkdir(parents=True, exist_ok=True)
env = dict(os.environ, REGISTRY_BASE_COMMIT=sys.argv[2])
checks = [
 ('test', ['npm', 'test'], 'webapp'),
 ('quality', ['npm', 'run', 'test:prompt-quality'], 'webapp'),
 ('lint', ['npm', 'run', 'lint'], 'webapp'),
 ('build', ['npm', 'run', 'build'], 'webapp'),
 ('audit', ['node', 'scripts/validate_prompt_logic.mjs', '200', 'prompt-quality-baseline', '--strict'], '.'),
 ('sync', ['python3', 'scripts/sync_to_json.py', '--check', '--report-json'], '.'),
 ('python', ['python3', '-m', 'unittest', 'discover', '-s', 'scripts/tests'], '.'),
 ('strict', ['node', 'scripts/check_catalog_integrity.mjs', '--strict'], '.'),
 ('catalog', ['node', '--test', 'scripts/tests/catalog-integrity.test.mjs', 'scripts/tests/catalog-semantics.test.mjs', 'scripts/tests/catalog-legacy.test.mjs'], '.'),
 ('assets', ['python3', 'scripts/check_public_assets.py'], '.'),
]
results = json.loads((OUT / 'gates-latest.json').read_text()) if len(sys.argv) > 3 and (OUT / 'gates-latest.json').exists() else []
for name, command, cwd in checks:
 if len(sys.argv) > 3 and name not in sys.argv[3:]:
  continue
 r = subprocess.run(command, cwd=ROOT / cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
 (OUT / (name + '.log.gz')).write_bytes(gzip.compress(r.stdout, mtime=0))
 results = [item for item in results if item['name'] != name]
 results.append(dict(name=name, exitCode=r.returncode, log=name + '.log.gz'))
 (OUT / 'gates-latest.json').write_text(json.dumps(results, indent=2) + '\n')
 print(name, r.returncode, flush=True)
sys.exit(any(r['exitCode'] for r in results))
