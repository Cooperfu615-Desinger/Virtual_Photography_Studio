"""Read-only C dual-parser comparison against reviewed pre-C Markdown."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts import sync_to_json as sync, prompt_generator


def compare(source_sha):
    if source_sha != '64870460e8a153a07baf953df0d6cf784ce2aca4':
        raise ValueError('Expected fixed pre-C SHA')
    root=Path(__file__).resolve().parent.parent
    comparisons=0
    with tempfile.TemporaryDirectory() as directory:
        for filename in sync.FILES_TO_SYNC:
            old=Path(directory)/filename
            old.write_bytes(subprocess.check_output(['git','-C',str(root),'show',source_sha+':knowledge_base/'+filename]))
            new=root/'knowledge_base'/filename
            if sync.parse_markdown_table(str(old)) != sync.parse_markdown_table(str(new)):
                raise ValueError(filename+': sync parser differs')
            previous=prompt_generator.KNOWLEDGE_BASE_DIR
            try:
                prompt_generator.KNOWLEDGE_BASE_DIR=directory; a=prompt_generator.load_dictionary(filename)
                prompt_generator.KNOWLEDGE_BASE_DIR=str(root/'knowledge_base'); b=prompt_generator.load_dictionary(filename)
            finally:prompt_generator.KNOWLEDGE_BASE_DIR=previous
            if a != b:raise ValueError(filename+': legacy parser differs')
            comparisons+=2
    return {'markdownParserComparisons':comparisons,'markdownDifferences':0}


if __name__=='__main__':print(json.dumps(compare(sys.argv[1])))
