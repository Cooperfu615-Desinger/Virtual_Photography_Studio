"""Trusted Git history selection for the formal catalog. Never reads a candidate base pointer."""
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path
from scripts.catalog_registry import load_registry_history, validate_registry, RegistryError

PRE_C_COMMIT = '64870460e8a153a07baf953df0d6cf784ce2aca4'
A_COMMIT = '0746b280cc9f5c00daec7dadc73329779ac658e9'
INITIAL_SHA256 = '039f3c87c398f3f133eef949ba0a0bfa525071f8c66841e7f4d2e1299f5991ad'
REGISTRY_PATH = 'knowledge_base/catalog/id_registry.json'


def git(repo, *args):
    try:
        return subprocess.check_output(['git', '-C', str(repo), *args], stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as exc:
        raise RegistryError('Required Git history unavailable: '+exc.stderr.decode().strip()) from exc


def validate_history(repo, records, registry, base_commit=None, candidate_commit=None):
    repo = Path(repo)
    base = base_commit or os.environ.get('REGISTRY_BASE_COMMIT')
    candidate_commit = candidate_commit or os.environ.get('REGISTRY_CANDIDATE_COMMIT')
    if not re.fullmatch(r'[a-f0-9]{40}', base or ''):
        raise RegistryError('Specify reviewed full SHA with --registry-base-commit or REGISTRY_BASE_COMMIT')
    candidate = candidate_commit or git(repo, 'rev-parse', 'HEAD').decode().strip()
    if candidate_commit and candidate == base:
        raise RegistryError('Committed candidate cannot be its own history')
    git(repo, 'merge-base', '--is-ancestor', base, candidate)
    if base != PRE_C_COMMIT:
        history, proof = load_registry_history(repo, base, candidate_commit)
        return dict(validate_registry(records, registry, history=history), mode='historical', **proof)
    # One introduction batch only. No intervening commit may carry a registry,
    # even if a later candidate deletes it. Missing history never triggers bootstrap.
    for commit in git(repo, 'rev-list', base+'..'+candidate).decode().splitlines():
        if commit != candidate:
            raise RegistryError('Initial bootstrap is only allowed directly after the fixed pre-C commit')
    if not candidate_commit and candidate != base:
        raise RegistryError('Bootstrap cannot be reused after C is committed; select committed registry history')
    if git(repo, 'ls-tree', base, REGISTRY_PATH).strip():
        raise RegistryError('Pre-C baseline unexpectedly contains a registry')
    blob = (repo/'scripts/fixtures/catalog_initial_frozen.json').read_bytes()
    if hashlib.sha256(blob).hexdigest() != INITIAL_SHA256:
        raise RegistryError('Initial A inventory seal differs')
    frozen = json.loads(blob)
    # Verify membership against the immutable A snapshot retained in reviewed B.
    snapshot_blob = git(repo, 'show', PRE_C_COMMIT+':webapp/src/lib/engine/catalogSnapshot.catalog.json')
    snapshot = json.loads(snapshot_blob)
    ids = {r['id'] for cs in snapshot.values() for rows in cs.values() for r in rows}
    ids -= {'wardrobe:headphones:none', 'wardrobe:faceCovering:none'}
    if ids != {r['id'] for r in frozen} or any(r['createdFrom'] != A_COMMIT for r in frozen):
        raise RegistryError('Initial inventory differs from sealed A source IDs/provenance')
    return dict(validate_registry(records, registry, initial_frozen=frozen), mode='initial-C-only',
                registryBaseCommit=base, initialInventorySha256=INITIAL_SHA256,
                snapshotSha256=hashlib.sha256(snapshot_blob).hexdigest(), frozenBaselineCommit=A_COMMIT)
