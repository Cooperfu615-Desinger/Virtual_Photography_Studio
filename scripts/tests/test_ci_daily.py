import copy
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest
from unittest import mock

from scripts import ci_daily as daily
from scripts import ci_docs
from scripts.catalog_ci_history import select_history

ROOT = Path(__file__).resolve().parents[2]
REPOSITORY = 'owner/project'
PREFIX = 'repos/' + REPOSITORY


class DailyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '-qb', 'main')
        self.git('config', 'user.name', 'Daily fixture')
        self.git('config', 'user.email', 'fixture@example.invalid')
        self.write('README.md', '# Readme\n')
        self.write('app.js', 'original\n')
        self.write(ci_docs.POLICY_PATH, json.dumps({'version': 1, 'documents': ['README.md']}))
        self.write(daily.LEDGER, json.dumps({'version': 1, 'revisions': []}))
        self.commit()
        self.write('app.js', 'current\n')
        self.head = self.commit()
        self.repo = ci_docs.Repository(self.root)
        self.runs, self.jobs = {}, {}
        self.calls = []

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], stderr=subprocess.PIPE).decode().strip()

    def write(self, path, text):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text)

    def commit(self):
        # Only this disposable fixture repo is staged/committed.
        self.git('add', '.')
        self.git('commit', '-qm', 'fixture')
        return self.git('rev-parse', 'HEAD')

    def add_run(self, identifier=10, workflow=daily.DEPLOY, sha=None, conclusion='success'):
        run = {'id': identifier, 'run_attempt': 1, 'head_sha': sha or self.head, 'head_branch': 'main',
               'path': workflow, 'event': 'push' if workflow == daily.DEPLOY else 'schedule',
               'repository': {'full_name': REPOSITORY}, 'head_repository': {'full_name': REPOSITORY},
               'status': 'completed', 'conclusion': conclusion,
               'run_started_at': f'2026-11-24T04:{identifier:02}:00Z'}
        required = copy.deepcopy(daily.QUALITY_STEPS)
        if workflow == daily.DAILY:
            required.update({'plan': ['Decide daily validation'], 'full-evidence': ['Record complete full validation'],
                             'daily-result': ['Summarize daily validation']})
        else:
            required.update({'scope': ['Test CI routing', 'Classify changes and validate documentation'],
                             'ci-result': ['Summarize required results']})
        self.runs[identifier] = run
        self.jobs[identifier] = [{'name': name, 'status': 'completed', 'conclusion': 'success',
                                 'steps': [{'name': s, 'conclusion': 'success'} for s in names]}
                                for name, names in required.items()]
        return run

    def api(self, path):
        self.calls.append(path)
        if '/workflows/' in path:
            workflow = '.github/workflows/' + path.split('/workflows/')[1].split('/')[0]
            rows = [r for r in self.runs.values() if r['path'] == workflow]
            return {'total_count': len(rows), 'workflow_runs': copy.deepcopy(rows)}
        if '/attempts/' in path:
            identifier = int(path.split('/runs/')[1].split('/')[0])
            return {'total_count': len(self.jobs[identifier]), 'jobs': copy.deepcopy(self.jobs[identifier])}
        if path.endswith('/branches/main'):
            return {'commit': {'sha': self.head}}
        return copy.deepcopy(self.runs[int(path.rsplit('/', 1)[1])])

    def plan(self, head=None, api=None, current_run=99):
        return daily.plan_once(self.repo, head or self.head, REPOSITORY, api or self.api, current_run)

    def test_verified_full_push_skips(self):
        self.add_run()
        p = self.plan()
        self.assertEqual((p['mode'], p['evidence_sha'], p['evidence_run'], p['deploy']),
                         ('skip', self.head, '10', False))
        self.assertFalse(any('/deployments' in p for p in self.calls))

    def test_verified_daily_full_skips(self):
        self.add_run(workflow=daily.DAILY)
        self.assertEqual(self.plan()['mode'], 'skip')

    def test_daily_check_only_is_not_full_evidence(self):
        self.add_run(workflow=daily.DAILY)
        self.jobs[10] = [j for j in self.jobs[10] if j['name'] in ('plan', 'daily-result')]
        self.assertEqual(self.plan()['mode'], 'full')

    def test_docs_and_copy_green_runs_do_not_certify_full(self):
        self.add_run()
        for kind in ('docs', 'copy'):
            jobs = copy.deepcopy(self.jobs[10])
            for j in self.jobs[10]:
                if kind == 'docs' and j['name'] in daily.QUALITY_STEPS:
                    j['conclusion'] = 'skipped'
                if j['name'] == 'webapp-quality':
                    for s in j['steps']:
                        if s['name'] == 'Test':
                            s['conclusion'] = 'skipped'
                    j['steps'].append({'name': 'Test scoped Prompt copy', 'conclusion': 'success'})
            self.assertEqual(self.plan()['mode'], 'full')
            self.jobs[10] = jobs

    def test_every_required_step_must_exist_and_succeed(self):
        self.add_run(workflow=daily.DAILY)
        original = copy.deepcopy(self.jobs[10])
        for index, job in enumerate(original):
            for step_index, step in enumerate(job['steps']):
                for state in ('failure', 'skipped', 'cancelled', None):
                    with self.subTest(job=job['name'], step=step['name'], state=state):
                        self.jobs[10] = copy.deepcopy(original)
                        self.jobs[10][index]['steps'][step_index]['conclusion'] = state
                        self.assertEqual(self.plan()['mode'], 'full')
        self.jobs[10] = original + [copy.deepcopy(original[0])]
        self.assertEqual(self.plan()['mode'], 'full')

    def test_verified_docs_equivalence_and_changed_test_or_policy(self):
        self.add_run()
        self.write('README.md', '# Updated\n')
        docs = self.commit()
        self.assertEqual(self.plan(docs)['mode'], 'skip')
        for path in ('app.js', 'tests/test.js', 'lock.json', daily.DAILY, ci_docs.POLICY_PATH):
            with self.subTest(path=path):
                self.git('reset', '--hard', docs)
                text = json.dumps({'version': 1, 'documents': ['README.md', 'AGENTS.md']}) if path == ci_docs.POLICY_PATH else 'changed\n'
                self.write(path, text)
                self.assertEqual(self.plan(self.commit())['mode'], 'full')

    def test_documents_cannot_hide_unverified_product(self):
        self.add_run()
        self.write('app.js', 'new product\n')
        self.commit()
        self.write('README.md', '# Updated\n')
        plan = self.plan(self.commit())
        self.assertEqual(plan['mode'], 'full')
        self.assertEqual(plan['last_full_sha'], self.head)

    def test_bad_doc_links_fail_even_when_full_proof_exists(self):
        self.add_run()
        self.write('README.md', '[bad](missing.md)\n')
        with self.assertRaises(ci_docs.ValidationError):
            self.plan(self.commit())

    def test_document_deletion_mode_symlink_and_unknown_md_require_full(self):
        self.add_run()
        for action in ('delete', 'executable', 'symlink', 'unknown'):
            self.git('reset', '--hard', self.head)
            p = self.root / 'README.md'
            if action == 'delete': p.unlink()
            elif action == 'executable': p.chmod(0o755)
            elif action == 'symlink':
                p.unlink()
                p.symlink_to('app.js')
            else: self.write('other.md', '# Unknown\n')
            self.assertEqual(self.plan(self.commit())['mode'], 'full')

    def test_bad_provenance_never_supplies_evidence(self):
        original = copy.deepcopy(self.add_run())
        for field, value in [('event', 'pull_request'), ('head_branch', 'feature'), ('head_sha', 'f' * 40),
                             ('repository', {'full_name': 'other/repo'}), ('head_repository', {'full_name': 'fork/repo'}),
                             ('run_attempt', 0)]:
            self.runs[10] = {**original, field: value}
            self.assertEqual(self.plan()['mode'], 'full')

    def test_nonancestor_and_self_run_are_not_evidence(self):
        self.add_run()
        self.assertEqual(self.plan(current_run=10)['mode'], 'full')
        self.git('checkout', '-qb', 'unrelated', self.head + '^')
        self.write('elsewhere.js', 'other\n')
        self.runs[10]['head_sha'] = self.commit()
        self.assertEqual(self.plan()['mode'], 'full')

    def test_latest_failure_overrides_older_success(self):
        self.add_run()
        self.add_run(20, conclusion='failure')
        self.assertEqual(self.plan()['reason'], 'previous_attempt_not_successful')
        self.runs[20]['conclusion'] = 'cancelled'
        self.assertEqual(self.plan()['mode'], 'full')

    def test_in_progress_waits_but_known_copy_does_not(self):
        run = self.add_run()
        run.update(status='in_progress', conclusion=None)
        self.assertEqual(self.plan()['mode'], 'wait')
        self.jobs[10][0]['steps'].append({'name': 'Test scoped Prompt copy', 'conclusion': 'success'})
        self.assertEqual(self.plan()['mode'], 'full')

    def test_queued_daily_run_cannot_block_its_own_serial_queue(self):
        self.add_run()
        queued = self.add_run(20, workflow=daily.DAILY)
        for status in daily.PENDING:
            queued.update(status=status, conclusion=None)
            with self.subTest(status=status):
                self.assertEqual(self.plan(current_run=99)['mode'], 'skip')
        del self.runs[10]
        self.assertEqual(self.plan(current_run=99)['mode'], 'full')
        self.assertFalse(any('/runs/20/attempts/' in p for p in self.calls))

    def test_api_failure_and_truncation_cannot_skip(self):
        self.add_run()
        def broken(_): raise OSError('offline')
        self.assertEqual(self.plan(api=broken)['mode'], 'full')
        def truncated(path):
            result = self.api(path)
            if '/attempts/' in path: result['total_count'] += 1
            return result
        self.assertEqual(self.plan(api=truncated)['mode'], 'full')
        def partial(path):
            result = self.api(path)
            if '/workflows/' in path: result['total_count'] += 1
            return result
        self.assertEqual(self.plan(api=partial)['mode'], 'full')

    def test_rerun_during_evidence_read_cannot_skip(self):
        self.add_run()
        def changed(path):
            result = self.api(path)
            if '/attempts/' in path: self.runs[10]['run_attempt'] += 1
            return result
        self.assertEqual(self.plan(api=changed)['mode'], 'full')
        self.add_run()
        def wrong_identity(path):
            result = self.api(path)
            if path.endswith('/runs/10'):
                result['id'] = 999
            return result
        self.assertEqual(self.plan(api=wrong_identity)['mode'], 'full')

    def test_older_full_without_companion_only_accepts_empty_ledger(self):
        self.add_run()
        self.jobs[10][0]['steps'] = [s for s in self.jobs[10][0]['steps'] if s['name'] != 'Verify current Prompt copy sources']
        self.assertEqual(self.plan()['mode'], 'skip')
        self.write(daily.LEDGER, json.dumps({'version': 1, 'revisions': [{'unverified': True}]}))
        new = self.commit()
        self.runs[10]['head_sha'] = new
        self.assertEqual(self.plan(new)['mode'], 'full')

    def test_local_dirty_files_and_index_are_never_used(self):
        self.add_run()
        self.write('app.js', 'uncommitted\n')
        before = self.git('status', '--porcelain')
        self.assertEqual(self.plan()['mode'], 'skip')
        self.assertEqual(self.git('status', '--porcelain'), before)

    def test_plan_cli_emits_exact_skip_evidence_and_preserves_checkout(self):
        self.add_run()
        output = self.root / 'outputs.txt'
        env = {'GITHUB_SHA': self.head, 'GITHUB_REF': 'refs/heads/main', 'GITHUB_EVENT_NAME': 'schedule',
               'GITHUB_REPOSITORY': REPOSITORY, 'GITHUB_RUN_ID': '99', 'GITHUB_OUTPUT': str(output)}
        with mock.patch.dict(os.environ, env), mock.patch.object(daily, 'ROOT', self.root), \
                mock.patch.object(daily, 'github_json', self.api), \
                mock.patch.object(daily.sys, 'argv', ['ci_daily.py', 'plan']), \
                mock.patch.object(daily, 'append_summary'):
            self.assertEqual(daily.main(), 0)
        text = output.read_text()
        self.assertIn('mode=skip\n', text)
        self.assertIn('evidence_sha=' + self.head + '\n', text)
        self.assertIn('last_full_sha=' + self.head + '\n', text)
        self.assertEqual(self.git('rev-parse', 'HEAD'), self.head)
        self.assertEqual(self.git('diff', '--cached', '--name-only'), '')

    def test_summary_failure_is_non_green_and_announces_no_deployment(self):
        run = self.add_run(workflow=daily.DAILY)
        needs = full_needs()
        needs['webapp-quality']['result'] = 'failure'
        self.jobs[10][0].update(started_at='2026-11-24T00:00:00Z', completed_at='2026-11-24T00:00:10Z')
        with mock.patch.object(daily, 'append_summary') as output, mock.patch('builtins.print') as printed:
            self.assertFalse(daily.summarize(needs, self.head, REPOSITORY, run['id'], self.api))
            rendered = '\n'.join(c.args[0] for c in output.call_args_list)
            self.assertIn('FAILED / not verified', rendered)
            self.assertIn('Deployment: **none**', rendered)
            self.assertIn('10.0', rendered)
            self.assertIn('::error', printed.call_args.args[0])

    def test_summary_reports_new_main_without_certifying_it(self):
        self.add_run(workflow=daily.DAILY)
        with mock.patch.object(daily, 'append_summary') as output:
            self.assertTrue(daily.summarize(full_needs(), 'a' * 40, REPOSITORY, 10, self.api))
            self.assertIn('superseded', '\n'.join(c.args[0] for c in output.call_args_list))


def full_needs(mode='full'):
    return {'plan': {'result': 'success', 'outputs': {'mode': mode, 'evidence_sha': 'a' * 40, 'evidence_run': '10'}},
            **{name: {'result': 'success' if mode == 'full' else 'skipped'}
               for name in (*daily.QUALITY_STEPS, 'full-evidence')}}


class WaitAndResultTests(unittest.TestCase):
    def test_skip_without_exact_evidence_is_not_success(self):
        for key in ('evidence_sha', 'evidence_run'):
            needs = full_needs('skip')
            needs['plan']['outputs'].pop(key)
            self.assertFalse(daily.result_ok(needs))

    def test_run_and_job_pagination_is_complete(self):
        first = [{'id': i} for i in range(100)]
        seen = []
        def api(path):
            seen.append(path)
            values = first if path.endswith('page=1') else [{'id': 100}]
            return {'total_count': 101, 'workflow_runs': values, 'jobs': values}
        self.assertEqual(len(daily.recent_runs(PREFIX, daily.DAILY, api)), 101)
        self.assertEqual(len(daily.run_jobs(PREFIX, {'id': 10, 'run_attempt': 2}, api)), 101)
        self.assertTrue(any('/attempts/2/jobs' in p for p in seen))

    def test_evidence_api_failure_in_summary_remains_failure(self):
        def unavailable(_): raise OSError('offline')
        with mock.patch.object(daily, 'append_summary'), mock.patch('builtins.print'):
            self.assertFalse(daily.summarize(full_needs(), 'a' * 40, REPOSITORY, 10, unavailable))

    def test_record_and_cli_reject_unapproved_event_or_partial_results(self):
        env = {'GITHUB_REF': 'refs/heads/main', 'GITHUB_SHA': 'a' * 40,
               'GITHUB_EVENT_NAME': 'schedule', 'DAILY_NEEDS_JSON': json.dumps(full_needs())}
        with mock.patch.dict(os.environ, env), mock.patch.object(daily.sys, 'argv', ['ci_daily.py', 'record']), mock.patch.object(daily, 'append_summary'):
            self.assertEqual(daily.main(), 0)
            os.environ['DAILY_NEEDS_JSON'] = json.dumps(full_needs('skip'))
            with self.assertRaises(ci_docs.ValidationError): daily.main()
            os.environ['GITHUB_EVENT_NAME'] = 'pull_request'
            with self.assertRaises(ci_docs.ValidationError): daily.main()

    def test_wait_rechecks_and_stops_at_limit_without_sleeping_in_tests(self):
        now = [0]
        waiting = {'mode': 'wait', 'pending_run': '10'}
        def sleep(seconds): now[0] += seconds
        result = daily.wait_for_plan(lambda: waiting, 60, 30, lambda: now[0], sleep)
        self.assertEqual((result['mode'], now[0]), ('deferred', 60))
        plans = iter([waiting, {'mode': 'skip'}])
        self.assertEqual(daily.wait_for_plan(lambda: next(plans), 60, 30, lambda: now[0], sleep)['mode'], 'skip')
        plans = iter([waiting, {'mode': 'full'}])
        self.assertEqual(daily.wait_for_plan(lambda: next(plans), 60, 30, lambda: now[0], sleep)['mode'], 'full')

    def test_all_summary_states_fail_closed(self):
        for mode in ('full', 'skip'):
            self.assertTrue(daily.result_ok(full_needs(mode)))
            for name in full_needs(mode):
                for status in ('failure', 'cancelled', 'missing'):
                    needs = full_needs(mode)
                    needs[name]['result'] = status
                    self.assertFalse(daily.result_ok(needs))
        for mode in ('deferred', 'wait', 'copy', None):
            self.assertFalse(daily.result_ok(full_needs(mode)))

    def test_schedule_uses_real_parent_not_self_or_bootstrap(self):
        a, b = 'a' * 40, 'b' * 40
        self.assertEqual(select_history('schedule', None, None, None, b, a), (a, b))
        for parent in (None, b, '0' * 40, 'HEAD^'):
            with self.assertRaises(ValueError): select_history('schedule', None, None, None, b, parent)


def workflow_jobs(text):
    return dict(re.findall(r'^  ([\w-]+):\n(.*?)(?=^  [\w-]+:\n|\Z)', text.split('\njobs:\n', 1)[1], re.M | re.S))


def workflow_steps(job):
    return dict(re.findall(r'^      - name: ([^\n]+)\n(.*?)(?=^      - name: |\Z)', job, re.M | re.S))


class WorkflowContractTests(unittest.TestCase):
    def test_all_quality_commands_config_and_versions_match_deploy(self):
        deploy = workflow_jobs((ROOT / daily.DEPLOY).read_text())
        scheduled = workflow_jobs((ROOT / daily.DAILY).read_text())
        self.assertEqual(set(deploy), {'scope', *daily.QUALITY_STEPS, 'deploy', 'ci-result'})
        for job, names in daily.QUALITY_STEPS.items():
            original, current = workflow_steps(deploy[job]), workflow_steps(scheduled[job])
            self.assertEqual(set(current), set(names))
            for name in names:
                # Only the existing full/copy conditional is intentionally different.
                clean = lambda value: re.sub(r'^        if: .*\n', '', value, flags=re.M).strip()
                self.assertEqual(clean(original[name]), clean(current[name]), job + '/' + name)
        # New deploy validation commands cannot silently be omitted from daily CI.
        exclusions = {'Test scoped Prompt copy', 'Validate pull request build', 'Setup Pages', 'Upload artifact'}
        for job in daily.QUALITY_STEPS:
            self.assertEqual(set(workflow_steps(deploy[job])) - exclusions, set(daily.QUALITY_STEPS[job]))

    def test_schedule_manual_main_permissions_queue_and_marker(self):
        text = (ROOT / daily.DAILY).read_text()
        self.assertIn("cron: '17 20 * * *'", text)
        self.assertIn('workflow_dispatch:', text)
        self.assertNotRegex(text, r'(?m)^  (push|pull_request|workflow_run):')
        self.assertNotRegex(text, r'pages:|id-token:|deployments:|issues:|environment:|continue-on-error:')
        self.assertNotIn('deploy-pages', text)
        self.assertNotIn('upload-pages-artifact', text)
        self.assertNotRegex(text, r'\bwrite\b')
        self.assertIn('group: daily-full-validation-${{ github.ref }}', text)
        self.assertIn('cancel-in-progress: false\n  queue: max', text)
        self.assertIn("if: github.ref == 'refs/heads/main'", text)
        jobs = workflow_jobs(text)
        self.assertEqual(set(jobs), {'plan', *daily.QUALITY_STEPS, 'full-evidence', 'daily-result'})
        for name in (*daily.QUALITY_STEPS, 'full-evidence'):
            self.assertIn("if: needs.plan.outputs.mode == 'full'", jobs[name])
        self.assertIn('if: ${{ always() }}', jobs['daily-result'])
        self.assertIn('needs: [plan, webapp-quality, functions-quality, build, full-evidence]', jobs['daily-result'])

    def test_original_deployment_still_rejects_schedule_event(self):
        self.assertFalse(ci_docs.result_ok({}, 'schedule'))
        self.assertNotIn('schedule:', (ROOT / daily.DEPLOY).read_text())


if __name__ == '__main__':
    unittest.main()
