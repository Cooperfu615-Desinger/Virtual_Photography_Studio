import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location('ci_docs', ROOT / 'scripts/ci_docs.py')
ci = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ci)


class RepositoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.git('init', '-q', '-b', 'main')
        self.git('config', 'user.name', 'CI fixture')
        self.git('config', 'user.email', 'ci@example.invalid')
        self.policy = {'version': 1, 'documents': ['AGENTS.md', 'README.md', 'Docs/specs/guide.md']}
        self.write('README.md', '# Project\n')
        self.write('AGENTS.md', '# Rules\n\n[Readme](README.md)\n')
        self.write('Docs/specs/guide.md', '# Guide\n')
        self.write('app.js', 'export const value = 1;\n')
        self.base = self.commit()
        self.repo = ci.Repository(self.root)

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.root), *args], stderr=subprocess.PIPE).decode().strip()

    def write(self, path, content):
        target = self.root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)

    def commit(self):
        # These are disposable fixture repositories, never the user's checkout.
        self.git('add', '.')
        self.git('commit', '-qm', 'fixture')
        return self.git('rev-parse', 'HEAD')

    def documentation_commit(self):
        self.write('AGENTS.md', '# Updated rules\n\n[Readme](README.md)\n')
        return self.commit()

    def evidence(self, sha=None):
        return {'sha': sha or self.base, 'run_id': 10, 'deployment_id': 20}

    def plan(self, head, base=None, event='push', evidence=True):
        proof = self.evidence() if evidence is True else evidence
        return ci.make_plan(self.repo, self.policy, event, base or self.base, head, proof)

    def test_docs_require_verified_deployed_ancestor(self):
        plan = self.plan(self.documentation_commit())
        self.assertEqual(plan['mode'], 'docs')
        self.assertFalse(plan['deploy'])
        self.assertEqual(plan['deployed_sha'], self.base)
        self.assertEqual(plan['checked_documents'], ['AGENTS.md'])

    def test_previous_product_change_not_hidden_by_document_push(self):
        self.write('app.js', 'export const value = 2;\n')
        product = self.commit()
        docs = self.documentation_commit()
        plan = self.plan(docs, base=product)
        self.assertEqual(plan['mode'], 'full')
        self.assertEqual(plan['reason'], 'undeployed_changes')
        self.assertTrue(plan['deploy'])

    def test_pending_failed_or_unknown_deployment_cannot_skip(self):
        head = self.documentation_commit()
        for proof in [None, {}]:
            with self.subTest(proof=proof):
                self.assertEqual(self.plan(head, evidence=proof)['mode'], 'full')

    def test_multiple_document_commits_since_deployment(self):
        first = self.documentation_commit()
        self.write('README.md', '# Updated project\n')
        head = self.commit()
        self.assertEqual(self.plan(head, base=first)['mode'], 'docs')

    def test_unknown_markdown_and_executable_inputs_are_full(self):
        for path in ['Docs/specs/new.md', 'Docs/reports/old.md', 'knowledge_base/wardrobe_and_styling.md',
                     'Docs/specs/z-image-on-location-v1-test-prompts.md', 'data.json', '.github/workflows/deploy.yml']:
            with self.subTest(path=path):
                # Isolate each candidate so an earlier unknown path cannot mask a regression.
                self.git('reset', '--hard', self.base)
                self.write(path, '# Not an approved narrative document\n')
                plan = self.plan(self.commit())
                self.assertEqual(plan['mode'], 'full')
                self.assertEqual(plan['reason'], 'non_document_or_unknown_changes')

    def test_mixed_changes_and_policy_changes_are_full(self):
        self.documentation_commit()
        self.write('scripts/lib/ciDocsPolicy.json', json.dumps(self.policy))
        self.assertEqual(self.plan(self.commit())['mode'], 'full')

    def test_deletion_rename_symlink_and_mode_changes_are_full(self):
        for operation in ['delete', 'rename', 'symlink', 'executable']:
            with self.subTest(operation=operation):
                # Reset only this test's disposable fixture.
                self.git('reset', '--hard', self.base)
                target = self.root / 'AGENTS.md'
                if operation == 'delete':
                    target.unlink()
                elif operation == 'rename':
                    target.rename(self.root / 'other.md')
                elif operation == 'symlink':
                    target.unlink()
                    target.symlink_to('README.md')
                else:
                    target.chmod(0o755)
                self.assertEqual(self.plan(self.commit())['mode'], 'full')

    def test_manual_run_is_always_full_and_pr_never_deploys(self):
        head = self.documentation_commit()
        self.assertEqual(self.plan(head, event='workflow_dispatch')['mode'], 'full')
        self.assertFalse(self.plan(head, event='pull_request')['deploy'])
        self.write('app.js', 'changed\n')
        self.assertFalse(self.plan(self.commit(), event='pull_request')['deploy'])

    def test_missing_nonancestor_and_empty_bases_cannot_skip(self):
        head = self.documentation_commit()
        for base in ['0' * 40, 'f' * 40, 'HEAD; echo unsafe', head]:
            with self.subTest(base=base):
                self.assertEqual(self.plan(head, base=base)['mode'], 'full')
        self.git('checkout', '-qb', 'unrelated', self.base)
        self.write('other.js', 'x\n')
        unrelated = self.commit()
        self.assertEqual(self.plan(head, evidence=self.evidence(unrelated))['mode'], 'full')

    def test_no_change_manual_run_is_still_full(self):
        self.assertEqual(self.plan(self.base, event='workflow_dispatch')['mode'], 'full')

    def test_links_unicode_reference_links_and_fenced_examples(self):
        self.write('Docs/說明.md', '# 說明\n')
        self.write('AGENTS.md', '# Rules\n\n[中文](Docs/%E8%AA%AA%E6%98%8E.md)\n[Guide][guide]\n\n[guide]: Docs/specs/guide.md\n\n```md\n[example](missing.md)\n```\n')
        head = self.commit()
        self.assertEqual(ci.check_documents(self.repo, self.policy, self.base, head), ['AGENTS.md'])

    def test_broken_reference_inline_link_and_outside_path_fail(self):
        for content in ['[bad](missing.md)', '[bad][ref]\n\n[ref]: missing.md', '[bad](../outside.md)']:
            with self.subTest(content=content):
                self.write('AGENTS.md', '# Rules\n\n' + content + '\n')
                with self.assertRaises(ci.ValidationError):
                    self.plan(self.commit())

    def test_whitespace_and_missing_final_newline_fail(self):
        for content in ['# Rules  \n', '# Rules']:
            self.write('AGENTS.md', content)
            with self.assertRaises(ci.ValidationError):
                self.plan(self.commit())

    def test_unclosed_fence_and_undefined_reference_fail(self):
        for content in ['# Rules\n```md\nunfinished\n', '# Rules\n[missing][unknown]\n']:
            self.write('AGENTS.md', content)
            with self.assertRaises(ci.ValidationError):
                self.plan(self.commit())

    def test_cli_full_plan_emits_outputs_and_summary_without_external_requests(self):
        self.write('scripts/ci_docs.py', (ROOT / 'scripts/ci_docs.py').read_text())
        self.write('scripts/lib/ciDocsPolicy.json', json.dumps(self.policy))
        head = self.commit()
        output, summary = self.root / 'outputs.txt', self.root / 'summary.txt'
        environment = dict(os.environ, GITHUB_SHA=head, GITHUB_EVENT_NAME='push',
                           PUSH_BEFORE=self.base, GITHUB_OUTPUT=str(output), GITHUB_STEP_SUMMARY=str(summary),
                           GITHUB_REPOSITORY='invalid-repository')
        result = subprocess.run([sys.executable, str(self.root / 'scripts/ci_docs.py'), 'plan'],
                                env=environment, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        self.assertIn('mode=full\n', output.read_text())
        self.assertIn('non_document_or_unknown_changes', summary.read_text())

    def test_dangling_deleted_link_is_blocked(self):
        (self.root / 'README.md').unlink()
        self.write('AGENTS.md', '# Rules changed\n\n[Readme](README.md)\n')
        with self.assertRaises(ci.ValidationError):
            self.plan(self.commit())

    def test_checks_read_committed_objects_and_do_not_change_worktree(self):
        head = self.documentation_commit()
        self.write('AGENTS.md', 'uncommitted text\n')
        status = self.git('status', '--porcelain')
        self.assertEqual(self.plan(head)['mode'], 'docs')
        self.assertEqual((self.root / 'AGENTS.md').read_text(), 'uncommitted text\n')
        self.assertEqual(self.git('status', '--porcelain'), status)

    def test_deploy_allows_newer_docs_but_rejects_newer_product(self):
        docs = self.documentation_commit()
        ci.check_deploy_revision(self.repo, self.policy, self.base, docs)
        self.write('app.js', 'new product\n')
        product = self.commit()
        with self.assertRaises(ci.ValidationError):
            ci.check_deploy_revision(self.repo, self.policy, docs, product)


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 40
        self.repo = 'owner/project'
        self.data = {
            'repos/owner/project/deployments?environment=github-pages&per_page=1':
                [{'id': 20, 'sha': self.sha, 'environment': 'github-pages'}],
            'repos/owner/project/deployments/20/statuses?per_page=1':
                [{'state': 'success', 'log_url': 'https://github.com/owner/project/actions/runs/10/job/30'}],
            'repos/owner/project/actions/runs/10':
                {'id': 10, 'head_sha': self.sha, 'head_branch': 'main', 'event': 'push',
                 'status': 'completed', 'conclusion': 'success', 'path': '.github/workflows/deploy.yml'},
            'repos/owner/project/actions/runs/10/jobs?filter=latest&per_page=100':
                {'total_count': 4, 'jobs': [
                    {'name': name, 'status': 'completed', 'conclusion': 'success',
                     'steps': [{'name': step, 'conclusion': 'success'} for step in steps]}
                    for name, steps in ci.REQUIRED_PRODUCT_STEPS.items()]},
        }

    def proof(self):
        return ci.deployment_evidence(self.repo, lambda path: self.data[path])

    def test_success_requires_deployment_and_same_commit_full_run(self):
        self.assertEqual(self.proof()['sha'], self.sha)

    def test_all_other_deployment_states_and_missing_records_are_untrusted(self):
        for state in ['pending', 'queued', 'in_progress', 'failure', 'error', 'inactive', None]:
            self.data['repos/owner/project/deployments/20/statuses?per_page=1'][0]['state'] = state
            with self.subTest(state=state):
                self.assertIsNone(self.proof())
        self.data['repos/owner/project/deployments?environment=github-pages&per_page=1'] = []
        self.assertIsNone(self.proof())

    def test_mismatched_sha_branch_workflow_event_or_failed_run_is_untrusted(self):
        path = 'repos/owner/project/actions/runs/10'
        good = copy.deepcopy(self.data[path])
        for key, value in [('head_sha', 'b' * 40), ('head_branch', 'other'), ('path', 'other.yml'),
                           ('event', 'pull_request'), ('conclusion', 'failure'), ('status', 'in_progress')]:
            self.data[path] = dict(good, **{key: value})
            with self.subTest(key=key):
                self.assertIsNone(self.proof())

    def test_missing_skipped_or_failed_required_steps_are_untrusted(self):
        path = 'repos/owner/project/actions/runs/10/jobs?filter=latest&per_page=100'
        good = copy.deepcopy(self.data[path])
        for state in ['skipped', 'failure', 'cancelled', None]:
            self.data[path] = copy.deepcopy(good)
            self.data[path]['jobs'][0]['steps'][0]['conclusion'] = state
            with self.subTest(state=state):
                self.assertIsNone(self.proof())
        self.data[path] = copy.deepcopy(good)
        self.data[path]['jobs'].pop()
        self.assertIsNone(self.proof())

    def test_missing_permission_api_error_or_truncated_jobs_falls_back(self):
        def unavailable(_):
            raise OSError('403 forbidden')
        self.assertIsNone(ci.deployment_evidence(self.repo, unavailable))
        self.data['repos/owner/project/actions/runs/10/jobs?filter=latest&per_page=100']['total_count'] = 105
        self.assertIsNone(self.proof())

    def test_malformed_api_responses_cannot_authorize_skip(self):
        for malformed in [None, {}, {'bad': True}, 'unexpected', [None], [{}]]:
            with self.subTest(value=malformed):
                self.assertIsNone(ci.deployment_evidence(self.repo, lambda _: malformed))

    def test_foreign_log_url_and_noninteger_id_are_rejected(self):
        for url in ['https://evil.test/owner/project/actions/runs/10',
                    'https://github.com/other/project/actions/runs/10',
                    'https://github.com/owner/project/actions/runs/not-a-number']:
            self.data['repos/owner/project/deployments/20/statuses?per_page=1'][0]['log_url'] = url
            self.assertIsNone(self.proof())


class ResultTests(unittest.TestCase):
    def needs(self, mode='docs', event='push'):
        result = {'scope': {'result': 'success', 'outputs': {'mode': mode}}}
        for name in ['webapp-quality', 'functions-quality', 'build', 'deploy']:
            result[name] = {'result': 'success' if mode == 'full' and (event != 'pull_request' or name not in ['build', 'deploy']) else 'skipped'}
        return result

    def test_intended_skips_are_explicit_and_full_jobs_must_succeed(self):
        for event in ['push', 'pull_request', 'workflow_dispatch']:
            self.assertTrue(ci.result_ok(self.needs('full', event), event))
        self.assertTrue(ci.result_ok(self.needs(), 'push'))

    def test_failure_cancellation_missing_or_unexpected_skips_never_pass(self):
        for name in ['scope', 'webapp-quality', 'functions-quality', 'build', 'deploy']:
            for state in ['failure', 'cancelled', 'skipped']:
                needs = self.needs('full')
                needs[name]['result'] = state
                self.assertFalse(ci.result_ok(needs, 'push'), (name, state))
        self.assertFalse(ci.result_ok({}, 'push'))
        self.assertFalse(ci.result_ok(self.needs('unknown'), 'push'))
        self.assertFalse(ci.result_ok(self.needs('docs'), 'workflow_dispatch'))
        self.assertFalse(ci.result_ok(self.needs('full'), 'unknown-event'))

    def test_workflow_keeps_full_commands_and_serializes_without_cancellation(self):
        workflow = (ROOT / '.github/workflows/deploy.yml').read_text()
        self.assertIn('cancel-in-progress: false', workflow)
        self.assertIn('queue: max', workflow)
        self.assertNotIn('paths-ignore:', workflow)
        for command in ['npm test', 'npm run lint', 'npm run build', 'check_prompt_bundle.mjs',
                        'sync_to_json.py --check', 'check_catalog_integrity.mjs --strict', 'ci_docs.py summarize']:
            self.assertIn(command, workflow)
        self.assertIn('ci_docs.py preflight', workflow)
        self.assertIn('always()', workflow)


if __name__ == '__main__':
    unittest.main()
