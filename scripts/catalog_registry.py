"""Phase B registry checks. No production registry is created or activated here."""
import hashlib
import json
import re
import subprocess
from pathlib import PurePosixPath


class RegistryError(ValueError):
    pass


def fail(message):
    raise RegistryError(message)


def index_rows(rows, label):
    if not isinstance(rows, list):
        fail(f'{label}: entries must be an array')
    result = {}
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get('id'), str) or not row['id']:
            fail(f'{label}: invalid id: {row!r}')
        if row['id'] in result:
            fail(f'{label}: duplicate id {row["id"]}')
        result[row['id']] = row
    return result


def load_registry_history(repo, base_commit, candidate_commit=None, registry_path='knowledge_base/catalog/id_registry.json'):
    """Read trusted caller-selected Git history, never a base pointer inside candidate JSON."""
    if not re.fullmatch(r'[0-9a-f]{40}', base_commit or ''):
        fail('registryBaseCommit must be a full immutable SHA')
    path = PurePosixPath(registry_path)
    if path.is_absolute() or '..' in path.parts or ':' in registry_path:
        fail('invalid registry path')
    def git(*args):
        try:
            return subprocess.check_output(['git', '-C', str(repo), *args], stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as exc:
            fail(f'historical Git object unavailable: {exc.stderr.decode().strip()}')
    if git('rev-parse', base_commit+'^{commit}').decode().strip() != base_commit:
        fail('base must identify a commit')
    candidate = candidate_commit or git('rev-parse', 'HEAD').decode().strip()
    if candidate_commit and candidate == base_commit:
        fail('candidate commit cannot be its own historical baseline')
    git('merge-base', '--is-ancestor', base_commit, candidate)
    blob = git('show', base_commit+':'+registry_path)
    try:
        history = json.loads(blob)
    except (ValueError, UnicodeDecodeError) as exc:
        fail(f'invalid historical registry JSON: {exc}')
    return history, {'registryBaseCommit': base_commit, 'registrySha256': hashlib.sha256(blob).hexdigest()}


def validate_registry(records, registry, history=None, *, initial_frozen=None, allow_retirement=False):
    if not isinstance(registry, dict) or set(registry) != {'version', 'entries'} or type(registry['version']) is not int or registry['version'] != 1:
        fail('registry must contain version=1 and entries only')
    if (history is None) == (initial_frozen is None):
        fail('exactly one trusted history or initial A inventory is required')
    current = index_rows(registry['entries'], 'registry')
    data = index_rows(records, 'catalog')
    old = index_rows(history.get('entries') if isinstance(history, dict) else None, 'history') if history is not None else {}
    initial = index_rows(initial_frozen, 'A inventory') if initial_frozen is not None else None
    if history is not None and (history.get('version') != 1 or set(history) != {'version', 'entries'}):
        fail('invalid historical registry envelope')
    if initial is not None and set(current) != set(initial):
        fail('initial registry differs from sealed A IDs')
    for ident, prior in old.items():
        if ident not in current:
            fail(f'deleted historical id: {ident}')
        now = current[ident]
        for key in ('initialGroup', 'initialCategory', 'createdFrom'):
            if now.get(key) != prior.get(key):
                fail(f'{ident}: immutable {key} changed')
        if now.get('status') != prior.get('status'):
            if not allow_retirement or prior.get('status') not in ('active', 'frozen') or now.get('status') != 'retired':
                fail(f'{ident}: illegal status transition {prior.get("status")} -> {now.get("status")}')
        if prior.get('status') == 'retired' and now != prior:
            fail(f'{ident}: retired history must be retained unchanged in this validator version')
    allowed = {'id', 'initialGroup', 'initialCategory', 'createdFrom', 'status', 'reason', 'decisionRef', 'replacedBy', 'restorePolicy'}
    for ident, row in current.items():
        if set(row) - allowed:
            fail(f'{ident}: unknown registry fields')
        for key in ('initialGroup', 'initialCategory', 'createdFrom'):
            if not isinstance(row.get(key), str) or not row[key].strip():
                fail(f'{ident}: missing {key}')
        if row['initialGroup'] not in ('wardrobe', 'camera', 'locations', 'character', 'regional', 'negative'):
            fail(f'{ident}: invalid initialGroup')
        status = row.get('status')
        if status not in ('frozen', 'active', 'retired'):
            fail(f'{ident}: invalid status {status}')
        if initial is not None:
            prior = initial[ident]
            if status != 'frozen' or any(row[k] != prior[k] for k in ('initialGroup', 'initialCategory', 'createdFrom')):
                fail(f'{ident}: initial freeze differs from A provenance')
        elif ident not in old:
            if status != 'active' or not re.fullmatch(r'(wardrobe|camera|locations|character|regional|negative):[^:]+:[a-z]+(?:-[a-z0-9]+)*', ident):
                fail(f'{ident}: new ID must be active and use permanent kebab-case format')
            issued_category = re.sub(r'[^a-z0-9一-鿿]+', '-', row['initialCategory'].lower()).strip('-')
            if ident.split(':')[1] != issued_category:
                fail(f'{ident}: issued category slug mismatch')
            if ident.split(':')[0] != row['initialGroup']:
                fail(f'{ident}: issued group mismatch')
        if status in ('frozen', 'active'):
            if ident not in data:
                fail(f'{ident}: live registry entry has no catalog record')
        else:
            if ident in data:
                fail(f'{ident}: retired ID cannot be a live catalog record')
            for key in ('reason', 'decisionRef', 'restorePolicy'):
                if not isinstance(row.get(key), str) or not row[key].strip():
                    fail(f'{ident}: retirement requires {key}')
            if 'replacedBy' not in row:
                fail(f'{ident}: retirement requires explicit replacedBy (or null)')
            target = row['replacedBy']
            if target is not None and (not isinstance(target, str) or target == ident or target not in current or current[target]['status'] == 'retired' or target not in data):
                fail(f'{ident}: invalid/cyclic/dangling replacement {target!r}')
    if set(data) != {ident for ident, r in current.items() if r['status'] != 'retired'}:
        fail('catalog and live registry ID sets differ')
    owners = {}
    for row in records:
        aliases = row.get('legacyIds')
        if not isinstance(aliases, list) or any(not isinstance(a, str) or not a for a in aliases):
            fail(f'{row["id"]}: invalid legacyIds')
        if len(set(aliases)) != len(aliases):
            fail(f'{row["id"]}: duplicate aliases')
        for alias in [row['id'], *aliases]:
            if alias in current and alias != row['id']:
                fail(f'alias {alias} reuses another issued primary ID')
            if alias in owners and owners[alias] != row['id']:
                fail(f'alias {alias} belongs to both {owners[alias]} and {row["id"]}')
            owners[alias] = row['id']
    return {'records': len(data), 'historicalIds': len(old), 'initialFrozen': len(initial or {})}
