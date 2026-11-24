"""Read-only daily full-validation planning and reporting, never deployment.

Only verified jobs/steps on committed main ancestors authorize a skip. A green
docs/copy run or a daily check-only run is not full-test evidence. API trouble
costs a full run, never silently grants coverage.
"""
import argparse
from datetime import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts.ci_docs import (Repository, ValidationError, approved_document,
                            append_summary, check_documents, github_json, load_policy)
from scripts.ci_prompt_copy import LEDGER

ROOT = Path(__file__).resolve().parents[1]
DAILY = '.github/workflows/daily-validation.yml'
DEPLOY = '.github/workflows/deploy.yml'
QUALITY_STEPS = {
    'webapp-quality': [
        'Checkout', 'Select trusted catalog history', 'Test data sync validation',
        'Validate generated database', 'Validate public asset budget', 'Setup Node',
        'Install dependencies', 'Validate catalog integrity', 'Test catalog preparation tools',
        'Verify formal catalog history and all generated outputs', 'Test',
        'Verify current Prompt copy sources', 'Lint',
    ],
    'functions-quality': ['Checkout', 'Setup Node', 'Install dependencies', 'Test', 'Lint'],
    'build': ['Checkout', 'Setup Node', 'Install dependencies', 'Validate Firebase build secrets',
              'Build site', 'Validate production prompt catalog initialization'],
}
PENDING = {'queued', 'in_progress', 'waiting', 'pending', 'requested'}


def steps_succeeded(jobs, required):
    for name, names in required.items():
        matching = [j for j in jobs if j.get('name') == name]
        if len(matching) != 1:
            return False
        job = matching[0]
        if job.get('status') != 'completed' or job.get('conclusion') != 'success':
            return False
        for step in names:
            found = [s for s in job.get('steps', []) if s.get('name') == step]
            if len(found) != 1 or found[0].get('conclusion') != 'success':
                return False
    return True


def full_success(repo, run, jobs):
    if run.get('status') != 'completed' or run.get('conclusion') != 'success':
        return False
    required = {name: list(steps) for name, steps in QUALITY_STEPS.items()}
    if run['path'] == DAILY:
        required['plan'] = ['Decide daily validation']
        required['full-evidence'] = ['Record complete full validation']
        required['daily-result'] = ['Summarize daily validation']
    else:
        required['scope'] = ['Test CI routing', 'Classify changes and validate documentation']
        required['ci-result'] = ['Summarize required results']
        # Previously delivered full runs without this new companion step are
        # usable only when their committed ledger has no copy revisions.
        if not any(s.get('name') == 'Verify current Prompt copy sources'
                   for j in jobs for s in j.get('steps', [])):
            ledger = json.loads(repo.read(run['head_sha'], LEDGER))
            if ledger != {'version': 1, 'revisions': []}:
                return False
            required['webapp-quality'].remove('Verify current Prompt copy sources')
    return steps_succeeded(jobs, required)


def equivalent(repo, policy, tested, head):
    if not repo.ancestor(tested, head):
        return False
    if not all(approved_document(c, policy) for c in repo.changes(tested, head)):
        return False
    check_documents(repo, policy, tested, head)
    return True


def eligible_run(run, repository, workflow):
    return (type(run.get('id')) is int and type(run.get('run_attempt')) is int and run['run_attempt'] > 0
            and run.get('path') == workflow and run.get('head_branch') == 'main'
            and run.get('repository', {}).get('full_name') == repository
            and run.get('head_repository', {}).get('full_name') == repository
            and run.get('event') in (['schedule', 'workflow_dispatch'] if workflow == DAILY
                                     else ['push', 'workflow_dispatch']))


def run_jobs(prefix, run, get_json):
    jobs = []
    for page in range(1, 11):
        data = get_json(f'{prefix}/actions/runs/{run["id"]}/attempts/{run["run_attempt"]}/jobs?per_page=100&page={page}')
        rows = data['jobs']
        if not isinstance(rows, list) or type(data['total_count']) is not int:
            raise ValueError('Invalid job response')
        jobs.extend(rows)
        if len(jobs) == data['total_count']:
            return jobs
        if len(rows) != 100 or len(jobs) > data['total_count']:
            break
    raise ValueError('Incomplete job evidence')


def recent_runs(prefix, workflow, get_json):
    result = []
    for page in range(1, 4):
        data = get_json(f'{prefix}/actions/workflows/{Path(workflow).name}/runs?branch=main&per_page=100&page={page}')
        rows = data['workflow_runs']
        if not isinstance(rows, list) or type(data['total_count']) is not int:
            raise ValueError('Invalid run response')
        result.extend(rows)
        if len(result) == data['total_count']:
            return result
        if len(rows) != 100 or len(result) > data['total_count']:
            raise ValueError('Incomplete run listing')
    # Deliberate bounded history: absence of proof within 300 runs costs a full
    # run. Newer records in this complete prefix must all be considered first.
    return result


def plan_once(repo, head, repository, get_json=github_json, current_run=0):
    if not re.fullmatch(r'[\w.-]+/[\w.-]+', repository):
        raise ValidationError('Invalid repository')
    if not repo.valid_commit(head):
        raise ValidationError('Candidate is unavailable')
    policy = load_policy(repo, head)
    parent = repo.git('rev-parse', head + '^').decode().strip()
    # Always check changed documentation even when product validation is needed.
    check_documents(repo, policy, parent, head)
    plan = {'mode': 'full', 'reason': 'no_verified_full_result', 'head': head,
            'evidence_sha': '', 'evidence_run': '', 'pending_run': '',
            'last_full_sha': '', 'last_full_run': '', 'deploy': False}
    prefix = 'repos/' + repository
    try:
        candidates = []
        for workflow in (DEPLOY, DAILY):
            for run in recent_runs(prefix, workflow, get_json):
                if (eligible_run(run, repository, workflow) and run['id'] != current_run
                        and repo.ancestor(run.get('head_sha'), head)):
                    candidates.append(run)
        # Re-runs of older IDs may be newer attempts; never use ID ordering alone.
        candidates.sort(key=lambda r: (r.get('run_started_at', r.get('created_at', '')), r['id']), reverse=True)
        blocked_by_failure = False
        for listed in candidates:
            same = equivalent(repo, policy, listed['head_sha'], head)
            # Older product results are diagnostic only. Bound expensive job
            # reads once the latest successful full ancestor has been located.
            if not same and (plan['last_full_sha'] or listed.get('conclusion') != 'success'):
                continue
            run = get_json(f'{prefix}/actions/runs/{listed["id"]}')
            if (not eligible_run(run, repository, listed['path']) or run['id'] != listed['id']
                    or run['head_sha'] != listed['head_sha']
                    or run['run_attempt'] != listed['run_attempt']):
                raise ValueError('Run identity changed while reading evidence')
            # Daily runs on main share one non-cancelling serial queue. Another
            # pending daily run cannot execute until this run releases that queue;
            # waiting for it would deadlock until our 30-minute timeout.
            if run['path'] == DAILY and run['status'] in PENDING:
                continue
            jobs = run_jobs(prefix, run, get_json)
            # A known scoped-copy run cannot supply or reserve full coverage.
            test_steps = [s for j in jobs if j.get('name') == 'webapp-quality'
                          for s in j.get('steps', []) if s.get('name') == 'Test']
            scoped = any(s.get('name') == 'Test scoped Prompt copy' and s.get('conclusion') == 'success'
                         for j in jobs for s in j.get('steps', []))
            if same and run['status'] in PENDING:
                if scoped or (test_steps and all(s.get('conclusion') == 'skipped' for s in test_steps)):
                    continue
                return {**plan, 'mode': 'wait', 'reason': 'equivalent_run_in_progress',
                        'pending_run': str(run['id'])}
            if run.get('conclusion') != 'success':
                if same:
                    blocked_by_failure = True
                    plan.update(reason='previous_attempt_not_successful', previous_run=str(run['id']))
                continue
            if not full_success(repo, run, jobs):
                continue
            checked = get_json(f'{prefix}/actions/runs/{run["id"]}')
            if any(checked.get(k) != run.get(k) for k in
                   ('id', 'head_sha', 'run_attempt', 'status', 'conclusion', 'path')):
                raise ValueError('Evidence was rerun while being checked')
            if not plan['last_full_sha']:
                plan.update(last_full_sha=run['head_sha'], last_full_run=str(run['id']))
            if not same or blocked_by_failure:
                continue
            return {**plan, 'mode': 'skip', 'reason': 'verified_full_result',
                    'evidence_sha': run['head_sha'], 'evidence_run': str(run['id'])}
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.SubprocessError) as error:
        plan.update(reason='unavailable_evidence', diagnostic=type(error).__name__)
    return plan


def wait_for_plan(evaluate, max_wait=1800, interval=30, clock=time.monotonic, sleep=time.sleep):
    start = clock()
    while True:
        plan = evaluate()
        if plan['mode'] != 'wait':
            return plan
        elapsed = clock() - start
        print(f'[daily] waiting for run {plan["pending_run"]}; {elapsed:.0f}s / {max_wait}s', flush=True)
        if elapsed >= max_wait:
            return {**plan, 'mode': 'deferred', 'reason': 'previous_run_still_pending'}
        sleep(min(interval, max_wait - elapsed))


def result_ok(needs):
    plan = needs.get('plan', {})
    mode = plan.get('outputs', {}).get('mode')
    if plan.get('result') != 'success' or mode not in ('full', 'skip'):
        return False
    if mode == 'skip':
        outputs = plan.get('outputs', {})
        if (not re.fullmatch(r'[a-f0-9]{40}', outputs.get('evidence_sha', '')) or
                not re.fullmatch(r'[1-9][0-9]*', outputs.get('evidence_run', ''))):
            return False
    expected = 'success' if mode == 'full' else 'skipped'
    return all(needs.get(name, {}).get('result') == expected
               for name in (*QUALITY_STEPS, 'full-evidence'))


def job_report(jobs):
    lines = ['| Job / step | Result | Wall time (s) |', '| --- | --- | --- |']
    for job in jobs:
        for row in [job, *job.get('steps', [])]:
            seconds = ''
            if row.get('started_at') and row.get('completed_at'):
                seconds = str(round((datetime.fromisoformat(row['completed_at'].replace('Z', '+00:00')) -
                                     datetime.fromisoformat(row['started_at'].replace('Z', '+00:00'))).total_seconds(), 1))
            name = str(row.get('name', '?')).replace('|', '/')
            lines.append(f'| {name} | {row.get("conclusion") or row.get("status", "pending")} | {seconds} |')
    return '\n'.join(lines)


def summarize(needs, head, repository, run_id, get_json=github_json):
    passed = result_ok(needs)
    outputs = needs.get('plan', {}).get('outputs', {})
    mode = outputs.get('mode', 'unknown')
    label = ('Full validation passed' if mode == 'full' else 'Reused verified full result') if passed else 'FAILED / not verified'
    url = f'https://github.com/{repository}/actions/runs/{run_id}'
    append_summary(f'## Daily validation: {label}\n\nCandidate: `{head}`\n\n'
                   f'Reason: `{outputs.get("reason", "plan_failed")}`\n\n'
                   f'Evidence: `{outputs.get("evidence_sha", "")}` / run `{outputs.get("evidence_run", "")}`\n\n'
                   f'Last verified full ancestor: `{outputs.get("last_full_sha", "")}` / run `{outputs.get("last_full_run", "")}`\n\n'
                   f'Pending run: `{outputs.get("pending_run", "")}`\n\n[Run and logs]({url})\n\n'
                   'Deployment: **none**. This workflow cannot publish or roll back the site.\n\n'
                   'Test counts and runner durations remain in the Test step logs; job/step times below include setup overhead.')
    try:
        prefix = 'repos/' + repository
        run = get_json(f'{prefix}/actions/runs/{run_id}')
        append_summary(job_report(run_jobs(prefix, run, get_json)))
        latest = get_json(prefix + '/branches/main')['commit']['sha']
        append_summary(f'Latest main: `{latest}`; candidate is ' + ('current.' if latest == head else
                       '**superseded**. This result does not certify the newer version.'))
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.SubprocessError):
        append_summary('Run details/latest-main lookup unavailable; verification result is not certified.')
        passed = False
    if not passed:
        print('::error title=Daily full validation not verified::Inspect the daily summary and failed steps. '
              'No deployment was performed. Native Actions failure notifications apply.')
    return passed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['plan', 'summarize', 'record'])
    args = parser.parse_args()
    head = os.environ.get('GITHUB_SHA', '')
    if (os.environ.get('GITHUB_REF') != 'refs/heads/main' or
            os.environ.get('GITHUB_EVENT_NAME') not in ('schedule', 'workflow_dispatch')):
        raise ValidationError('Daily validation is limited to main schedule/manual events')
    if args.command == 'record':
        needs = json.loads(os.environ['DAILY_NEEDS_JSON'])
        if (needs.get('plan', {}).get('outputs', {}).get('mode') != 'full' or
                needs.get('plan', {}).get('result') != 'success' or
                not all(needs.get(name, {}).get('result') == 'success' for name in QUALITY_STEPS)):
            raise ValidationError('Cannot record incomplete full validation')
        append_summary('Complete full validation executed for `' + head + '`. Deployment: none.')
        return 0
    repository, run_id = os.environ.get('GITHUB_REPOSITORY', ''), int(os.environ.get('GITHUB_RUN_ID', '0'))
    if args.command == 'summarize':
        return 0 if summarize(json.loads(os.environ['DAILY_NEEDS_JSON']), head, repository, run_id) else 1
    repo = Repository(ROOT)
    if repo.git('rev-parse', 'HEAD').decode().strip() != head:
        raise ValidationError('Checkout does not match the scheduled candidate')
    plan = wait_for_plan(lambda: plan_once(repo, head, repository, get_json=github_json, current_run=run_id))
    append_summary('## Daily plan\n\n```json\n' + json.dumps(plan, indent=2) + '\n```\n\nDeployment: none.')
    output = os.environ.get('GITHUB_OUTPUT')
    if output:
        with open(output, 'a', encoding='utf-8') as handle:
            for key in ('mode', 'reason', 'head', 'evidence_sha', 'evidence_run', 'pending_run', 'last_full_sha', 'last_full_run'):
                handle.write(key + '=' + plan[key] + '\n')
    # A deferred job produces a failed summary rather than a misleading green pass.
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValidationError, ValueError, KeyError, OSError, subprocess.SubprocessError) as error:
        print('::error title=Daily validation error::' + type(error).__name__ + ': ' + str(error), file=sys.stderr)
        sys.exit(1)
