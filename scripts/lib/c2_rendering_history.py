"""Run unchanged historical policy assertions on a sealed pre-classification copy."""
from contextlib import contextmanager
from functools import wraps
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from scripts import check_authoring_lengths as diagnostic


@contextmanager
def historical_policy_context():
    root = diagnostic.ROOT
    patches = json.loads((root/'scripts/lib/c2RenderingClassificationPatches.json').read_text())
    for item in patches['files']:
        current = hashlib.sha256((root/item['path']).read_bytes()).hexdigest()
        if current not in (item['beforeHash'], item['afterHash']):
            raise ValueError('Unknown or mixed classification history: '+item['path'])
        original = subprocess.check_output(['git', '-C', str(root), 'show', patches['base']+':'+item['path']])
        if original != item['beforeSource'].encode():
            raise ValueError('Classification history differs from fixed Git source')
    with tempfile.TemporaryDirectory(prefix='c2-rendering-policy-') as temp:
        directory = Path(temp)
        for path in ['knowledge_base', 'Docs/specs', 'scripts/lib']:
            shutil.copytree(root/path, directory/path)
        for item in patches['files']:
            target = directory/item['path']
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(item['beforeSource'])
        previous_git = os.environ.get('GIT_DIR')
        os.environ['GIT_DIR'] = subprocess.check_output(['git','-C',str(root),'rev-parse','--absolute-git-dir'],text=True).strip()
        previous_inspect = diagnostic.inspect
        diagnostic.ROOT = directory
        diagnostic.inspect = lambda root=directory: previous_inspect(root)
        try:
            yield directory
        finally:
            diagnostic.ROOT = root
            diagnostic.inspect = previous_inspect
            if previous_git is None:
                os.environ.pop('GIT_DIR', None)
            else:
                os.environ['GIT_DIR'] = previous_git


def historical_policy_test(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        with historical_policy_context():
            return function(*args, **kwargs)
    return wrapped
