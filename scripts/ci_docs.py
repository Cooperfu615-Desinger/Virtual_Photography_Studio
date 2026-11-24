"""Conservative docs-only CI gate. Reads committed objects; never repairs source files."""
import argparse
import json
import os
from pathlib import Path, PurePosixPath
import posixpath
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.ci_prompt_copy import classify as classify_copy, CopyIneligible


POLICY_PATH = 'scripts/lib/ciDocsPolicy.json'
SHA = re.compile(r'^[a-f0-9]{40}$')
REQUIRED_PRODUCT_STEPS = {
    'webapp-quality': ['Test', 'Lint'],
    'functions-quality': ['Test', 'Lint'],
    'build': ['Build site', 'Validate production prompt catalog initialization'],
    'deploy': ['Deploy to GitHub Pages'],
}


class ValidationError(Exception):
    pass


class Repository:
    def __init__(self, root):
        self.root = Path(root)
        self.trees = {}
        self.validated_commits = set()
        self.contents = {}

    def git(self, *args):
        try:
            return subprocess.check_output(['git', '-C', str(self.root), *args], stderr=subprocess.PIPE)
        except subprocess.CalledProcessError as error:
            raise ValidationError('Required Git history is unavailable') from error

    def valid_commit(self, ref):
        if not SHA.fullmatch(ref or '') or ref == '0' * 40:
            return False
        if ref in self.validated_commits:
            return True
        try:
            valid = self.git('rev-parse', '--verify', ref + '^{commit}').decode().strip() == ref
            if valid:
                self.validated_commits.add(ref)
            return valid
        except ValidationError:
            return False

    def ancestor(self, base, head):
        return self.valid_commit(base) and self.valid_commit(head) and subprocess.run(
            ['git', '-C', str(self.root), 'merge-base', '--is-ancestor', base, head],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0

    def tree(self, ref):
        if not self.valid_commit(ref):
            raise ValidationError('Invalid commit identifier')
        if ref not in self.trees:
            tree = {}
            for item in self.git('ls-tree', '-rz', '--full-tree', ref).split(b'\0'):
                if item:
                    metadata, path = item.split(b'\t', 1)
                    mode, kind, oid = metadata.decode().split()
                    tree[path.decode('utf-8')] = (mode, kind, oid)
            self.trees[ref] = tree
        return self.trees[ref]

    def changes(self, base, head):
        before, after = self.tree(base), self.tree(head)
        return [{'path': path, 'before': before.get(path), 'after': after.get(path)}
                for path in sorted(before.keys() | after.keys()) if before.get(path) != after.get(path)]

    def read(self, ref, path):
        item = self.tree(ref).get(path)
        if not item or item[:2] != ('100644', 'blob'):
            raise ValidationError('Document is not a regular tracked text file: ' + path)
        if item[2] not in self.contents:
            self.contents[item[2]] = self.git('cat-file', 'blob', item[2]).decode('utf-8')
        return self.contents[item[2]]


def validate_policy(policy):
    paths = policy.get('documents', [])
    if type(policy.get('version')) is not int or policy['version'] != 1 or not paths or len(paths) != len(set(paths)):
        raise ValidationError('Invalid docs policy')
    for path in paths:
        if (not isinstance(path, str) or not path.endswith('.md') or
                '..' in PurePosixPath(path).parts or path.startswith('/') or
                not (path in ['AGENTS.md', 'README.md'] or path.startswith('Docs/')) or
                path.startswith(('Docs/reports/', 'Docs/archive/')) or
                re.search(r'(?:test-prompts|scenes-v\d|baseline|fixture)', path, re.I)):
            raise ValidationError('Unsafe docs policy entry: ' + str(path))


def approved_document(change, policy):
    # Deletions, renames (delete + add), executable files and symlinks take the full path.
    return (change['path'] in policy['documents'] and change['after'] is not None and
            change['after'][:2] == ('100644', 'blob') and
            (change['before'] is None or change['before'][:2] == ('100644', 'blob')))


def prose_only(text):
    lines, fence = [], None
    for line in text.splitlines():
        marker = re.match(r'^\s{0,3}(`{3,}|~{3,})', line)
        if marker:
            token = marker.group(1)
            if fence is None:
                fence = token
            elif token[0] == fence[0] and len(token) >= len(fence):
                fence = None
        elif fence is None:
            lines.append(line)
    if fence is not None:
        raise ValidationError('Unclosed Markdown code fence')
    return '\n'.join(lines)


def document_links(text):
    prose = prose_only(text)
    definitions = dict(re.findall(r'^\s{0,3}\[([^]\n]+)\]:\s*(<[^>]+>|\S+)', prose, re.M))
    definitions = {name.casefold(): value for name, value in definitions.items()}
    targets = list(definitions.values())
    targets += re.findall(r'!?\[[^]\n]*\]\(\s*(<[^>\n]+>|[^\s)]+)', prose)
    for label, identifier in re.findall(r'!?\[([^]\n]+)\]\[([^]\n]*)\]', prose):
        key = (identifier or label).casefold()
        if key not in definitions:
            raise ValidationError('Undefined Markdown link reference: ' + key)
        targets.append(definitions[key])
    return [target.strip('<>') for target in targets]


def check_documents(repo, policy, base, head):
    changes = repo.changes(base, head)
    tree = repo.tree(head)
    checked = []
    for change in changes:
        if not approved_document(change, policy):
            continue
        path = change['path']
        text = repo.read(head, path)
        if '\x00' in text or not text.endswith('\n') or any(line.rstrip() != line for line in text.splitlines()):
            raise ValidationError('Invalid text, trailing whitespace or missing final newline: ' + path)
        for target in document_links(text):
            parsed = urlsplit(target)
            # External URLs and anchors are not fetched or rewritten by CI.
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            target_path = unquote(parsed.path)
            resolved = posixpath.normpath(posixpath.join(posixpath.dirname(path), target_path))
            if target_path.startswith('/') or resolved == '..' or resolved.startswith('../'):
                raise ValidationError('Link escapes repository: ' + path + ' -> ' + target)
            exists = resolved in tree or any(name.startswith(resolved.rstrip('/') + '/') for name in tree)
            if not exists or (resolved in tree and tree[resolved][0] == '120000'):
                raise ValidationError('Missing or symbolic local link: ' + path + ' -> ' + target)
        checked.append(path)
    # Check the entire committed diff, not unrelated local work.
    repo.git('diff', '--check', base, head, '--')
    return checked


def successful_product_run(jobs, copy=False):
    required = dict(REQUIRED_PRODUCT_STEPS)
    if copy:
        required['webapp-quality'] = ['Test scoped Prompt copy', 'Lint', 'Test data sync validation',
                                      'Validate generated database', 'Validate catalog integrity',
                                      'Test catalog preparation tools', 'Verify formal catalog history and all generated outputs']
        required['scope'] = ['Test CI routing', 'Classify changes and validate documentation']
        required['ci-result'] = ['Summarize required results']
    for name, steps in required.items():
        matches = [job for job in jobs if job.get('name') == name]
        if len(matches) != 1 or matches[0].get('status') != 'completed' or matches[0].get('conclusion') != 'success':
            return False
        for step in steps:
            found = [s for s in (matches[0].get('steps') or []) if s.get('name') == step]
            if len(found) != 1 or found[0].get('conclusion') != 'success':
                return False
    return True


def deployment_evidence(repository, get_json, repo=None, policy=None):
    """Only the latest Pages deployment and its successful full run are evidence."""
    if not re.fullmatch(r'[\w.-]+/[\w.-]+', repository or ''):
        return None
    prefix = 'repos/' + repository
    try:
        deployments = get_json(prefix + '/deployments?environment=github-pages&per_page=1')
        if not deployments:
            return None
        deployed = deployments[0]
        if (deployed.get('environment') != 'github-pages' or
                type(deployed.get('id')) is not int or not SHA.fullmatch(deployed.get('sha', ''))):
            return None
        statuses = get_json(prefix + '/deployments/' + str(deployed['id']) + '/statuses?per_page=1')
        if not statuses or statuses[0].get('state') != 'success':
            return None
        match = re.fullmatch(r'https://github\.com/' + re.escape(repository) +
                             r'/actions/runs/(\d+)(?:/job/\d+)?', statuses[0].get('log_url', ''))
        if not match:
            return None
        run_id = int(match.group(1))
        run = get_json(prefix + '/actions/runs/' + str(run_id))
        if (run.get('head_sha') != deployed['sha'] or run.get('head_branch') != 'main' or
                run.get('event') not in ['push', 'workflow_dispatch'] or
                run.get('path') != '.github/workflows/deploy.yml' or
                run.get('status') != 'completed' or run.get('conclusion') != 'success'):
            return None
        listing = get_json(prefix + '/actions/runs/' + str(run_id) + '/jobs?filter=latest&per_page=100')
        jobs = listing.get('jobs', [])
        if listing.get('total_count') != len(jobs):
            return None
        evidence = {'sha': deployed['sha'], 'deployment_id': deployed['id'], 'run_id': run_id}
        if successful_product_run(jobs):
            return evidence
        if not repo or not policy or not successful_product_run(jobs, copy=True):
            return None
        # A copy deployment is never mislabeled as a full test run. Find a verified
        # full ancestor and reclassify its entire delta. Bounded lookup fails closed.
        runs = get_json(prefix + '/actions/workflows/deploy.yml/runs?branch=main&status=success&per_page=30')
        for candidate in runs.get('workflow_runs', [])[:30]:
            anchor = candidate.get('head_sha', '')
            if (candidate.get('event') not in ['push', 'workflow_dispatch'] or candidate.get('head_branch') != 'main' or
                    candidate.get('path') != '.github/workflows/deploy.yml' or candidate.get('status') != 'completed' or
                    candidate.get('conclusion') != 'success' or not repo.ancestor(anchor, deployed['sha'])):
                continue
            listing = get_json(prefix + '/actions/runs/' + str(candidate['id']) + '/jobs?filter=latest&per_page=100')
            if listing.get('total_count') != len(listing.get('jobs', [])) or not successful_product_run(listing['jobs']):
                continue
            try:
                classify_copy(repo, anchor, deployed['sha'], policy['documents'])
            except (CopyIneligible, ValidationError, ValueError, KeyError):
                continue
            return {**evidence, 'mode': 'copy', 'full_base': anchor}
        return None
    except (OSError, ValueError, KeyError, TypeError, AttributeError, IndexError, subprocess.SubprocessError):
        # Missing permissions/history/evidence can only cost time, never bypass a gate.
        return None


def make_plan(repo, policy, event, base, head, evidence=None):
    validate_policy(policy)
    if not repo.valid_commit(head):
        raise ValidationError('Candidate commit is unavailable')
    plan = {'mode': 'full', 'reason': 'unclassified', 'head': head, 'base': base,
            'deployed_sha': '', 'checked_documents': [], 'changed_paths': [],
            'deploy': event in ['push', 'workflow_dispatch']}
    if event not in ['push', 'pull_request', 'workflow_dispatch']:
        raise ValidationError('Unsupported CI event')
    if base == head or not repo.ancestor(base, head):
        plan['reason'] = 'unavailable_comparison_history'
        return plan
    changes = repo.changes(base, head)
    plan['changed_paths'] = [change['path'] for change in changes]
    plan['checked_documents'] = check_documents(repo, policy, base, head)
    if event == 'workflow_dispatch':
        plan['reason'] = 'manual_full_run'
    elif not changes or not all(approved_document(change, policy) for change in changes):
        plan['reason'] = 'non_document_or_unknown_changes'
        try:
            classify_copy(repo, base, head, policy['documents'])
            if not evidence or not repo.ancestor(evidence.get('sha'), base):
                plan['reason'] = 'unverified_deployment'
            else:
                # Include queued or untested product changes, never only the latest push.
                compare = evidence.get('full_base', evidence['sha'])
                reviews = classify_copy(repo, compare, head, policy['documents'])
                plan.update(mode='copy', reason='verified_scoped_copy', copy_base=compare,
                            deployed_sha=evidence['sha'], evidence=evidence,
                            profiles=sorted({r['profile']['id'] for r in reviews}))
        except (CopyIneligible, ValidationError, ValueError, KeyError, TypeError) as error:
            plan['copy_rejection'] = str(error)
    elif not evidence or not repo.ancestor(evidence.get('sha'), head):
        plan['reason'] = 'unverified_deployment'
    else:
        plan['deployed_sha'] = evidence['sha']
        cumulative = repo.changes(evidence['sha'], head)
        if not all(approved_document(change, policy) for change in cumulative):
            plan['reason'] = 'undeployed_changes'
        else:
            plan.update(mode='docs', reason='verified_document_only', deploy=False,
                        evidence=evidence)
    if plan['mode'] in ['docs', 'copy']:
        comparison = plan.get('copy_base', plan['deployed_sha'])
        plan['checked_documents'] = check_documents(repo, policy, comparison, head)
    return plan


def check_deploy_revision(repo, policy, candidate, current_main):
    if not repo.ancestor(candidate, current_main):
        raise ValidationError('Candidate is not on current main; deployment blocked')
    if any(not approved_document(change, policy) for change in repo.changes(candidate, current_main)):
        raise ValidationError('Newer product changes exist on main; stale deployment blocked')


def result_ok(needs, event):
    scope = needs.get('scope', {})
    mode = scope.get('outputs', {}).get('mode')
    if scope.get('result') != 'success' or mode not in ['docs', 'copy', 'full']:
        return False
    if event not in ['push', 'pull_request', 'workflow_dispatch'] or (event == 'workflow_dispatch' and mode != 'full'):
        return False
    for name in REQUIRED_PRODUCT_STEPS:
        expected = 'success' if mode in ['copy', 'full'] and (event != 'pull_request' or name not in ['build', 'deploy']) else 'skipped'
        if needs.get(name, {}).get('result') != expected:
            return False
    return True


def github_json(path):
    result = subprocess.check_output(['gh', 'api', path], stderr=subprocess.PIPE, timeout=25)
    return json.loads(result)


def append_summary(text):
    path = os.environ.get('GITHUB_STEP_SUMMARY')
    if path:
        with open(path, 'a', encoding='utf-8') as handle:
            handle.write(text + '\n')
    print(text)


def load_policy(repo, head):
    policy = json.loads(repo.read(head, POLICY_PATH))
    validate_policy(policy)
    return policy


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['plan', 'preflight', 'summarize'])
    args = parser.parse_args()
    event = os.environ.get('GITHUB_EVENT_NAME', '')
    if args.command == 'summarize':
        needs = json.loads(os.environ.get('CI_NEEDS_JSON', '{}'))
        passed = result_ok(needs, event)
        rows = '\n'.join('| ' + name + ' | ' + needs.get(name, {}).get('result', 'missing') + ' |'
                         for name in ['scope', *REQUIRED_PRODUCT_STEPS])
        mode = needs.get('scope', {}).get('outputs', {}).get('mode', 'unknown')
        append_summary('## CI result: ' + ('passed' if passed else 'FAILED') + '\n\nRoute: `' + mode +
                       '`\n\n| Job | Result |\n| --- | --- |\n' + rows +
                       '\n\nDocs route: product tests/build/deploy are intentionally skipped only after verified equivalence. '
                       'Copy route: scoped comparison, catalog checks, lint/build, Functions and deployment remain required. '
                       'Full route: every applicable product gate must succeed. Scheduled tests are not enabled.')
        return 0 if passed else 1
    repo = Repository(Path(__file__).resolve().parents[1])
    head = os.environ.get('GITHUB_SHA', '')
    if head != repo.git('rev-parse', 'HEAD').decode().strip():
        raise ValidationError('Checkout does not match the workflow candidate')
    policy = load_policy(repo, head)
    if args.command == 'preflight':
        if os.environ.get('GITHUB_REF') != 'refs/heads/main' or event not in ['push', 'workflow_dispatch']:
            raise ValidationError('Deployment is limited to main push/manual runs')
        repo.git('fetch', '--no-tags', 'origin', 'refs/heads/main')
        current = repo.git('rev-parse', 'FETCH_HEAD').decode().strip()
        check_deploy_revision(repo, policy, head, current)
        append_summary('Deployment revision verified: `' + head + '`; current main `' + current + '`.')
        return 0
    if event == 'pull_request':
        base = os.environ.get('PR_BASE', '')
    elif event == 'push':
        base = os.environ.get('PUSH_BEFORE', '')
    else:
        base = repo.git('rev-parse', 'HEAD^').decode().strip()
    # Do not request GitHub evidence for a change already known to need full tests.
    plan = make_plan(repo, policy, event, base, head)
    if plan['reason'] == 'unverified_deployment':
        evidence = deployment_evidence(os.environ.get('GITHUB_REPOSITORY', ''), github_json, repo, policy)
        plan = make_plan(repo, policy, event, base, head, evidence)
    output = os.environ.get('GITHUB_OUTPUT')
    if output:
        with open(output, 'a', encoding='utf-8') as handle:
            handle.write('mode=' + plan['mode'] + '\nreason=' + plan['reason'] +
                         '\ndeployed_sha=' + plan['deployed_sha'] + '\ncopy_base=' + plan.get('copy_base', '') + '\n')
    append_summary('## CI scope\n\n```json\n' + json.dumps(plan, ensure_ascii=True, indent=2).replace('`', '\\u0060') +
                   '\n```\n\nDocument checks: tracked regular text, final newline/whitespace, Markdown fences, '
                   'local link paths and committed diff. External links and heading anchors are not fetched. '
                   'Unknown changes or missing successful deployment evidence take the full route.')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValidationError, UnicodeError, ValueError, OSError) as error:
        append_summary('## CI validation failed\n\n' + str(error).replace('`', "'").replace('\n', ' '))
        sys.exit(1)
