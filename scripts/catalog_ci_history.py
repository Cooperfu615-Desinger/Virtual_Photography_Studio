"""Select registry history from CI event metadata, never candidate catalog JSON."""
import os
import re
import subprocess


def select_history(event, push_before, pr_base, pr_head, head, parent):
    if event == 'push':
        base, candidate = push_before, head
    elif event == 'pull_request':
        base, candidate = pr_base, pr_head
    elif event == 'workflow_dispatch':
        base, candidate = parent, head
    else:
        raise ValueError('Unsupported CI event; history must be explicitly selected')
    if any(not re.fullmatch(r'[a-f0-9]{40}', s or '') or s == '0'*40 for s in (base, candidate)) or base == candidate:
        raise ValueError('Missing or self-referential CI history')
    return base, candidate


if __name__ == '__main__':
    def git(ref):
        return subprocess.check_output(['git', 'rev-parse', ref], text=True).strip()
    event = os.environ.get('EVENT_NAME')
    base, candidate = select_history(event, os.environ.get('PUSH_BEFORE'), os.environ.get('PR_BASE'), os.environ.get('PR_HEAD'), git('HEAD'), git('HEAD^') if event == 'workflow_dispatch' else None)
    print('REGISTRY_BASE_COMMIT='+base)
    print('REGISTRY_CANDIDATE_COMMIT='+candidate)
