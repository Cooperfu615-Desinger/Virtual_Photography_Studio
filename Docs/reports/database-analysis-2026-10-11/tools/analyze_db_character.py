"""Character 分區 (database.json) 量化分析。唯讀。"""
import json, re, statistics, itertools, sys
from collections import Counter
ROOT='/Users/cooperfu/Projects/Virtual_Photography_Studio'
d=json.load(open(f'{ROOT}/webapp/src/data/database.json'))
C=d['Character']
# 指南長度目標 (Docs/specs/character-section-a-authoring-guide.md)
TARGET={'五官特徵 (Facial Features)':(10,20),'膚質特徵 (Skin Details)':(6,14),'體態 (Body Type)':(8,18),
 '髮型 (Hairstyle)':(8,18),'髮色 (Hair Color)':(6,14),'表情 (Facial Expression)':(8,18),
 '姿勢與肢體語言 (Pose & Body Language)':(8,24),'特殊動作 (Special Actions)':(1,55)}
SUBJ=r'\b(beautiful|beauty|pretty|stunning|gorgeous|sexy|seductive|alluring|sensual|captivating|magnetic|cute|charm|elegant|elegance|graceful|romantic|moody|cool|youthful|innocent|intimate|confident|polished|playful|modern|fresh|presence)\b'
YOUNG=r'\b(young|youthful|innocent|childlike|girlish|cute|kawaii|doll)\w*'
INTERNAL=r'\b(guard|fallback|controlled by|model-decided|let the (image )?model|arrangement|random|lock|selection|internal|renderer|projection)\b'
NEG=r'\b(not|without|avoid|no)\b'
SCENE=r'\b(street|room|studio|forest|beach|castle|laboratory|cafe|wall|sofa|armchair|seat|platform|pillow|floor)\b'
LIGHT=r'\b(sunset|neon|softbox|rim light|blue sky|light)\b'
CAM=r'\b(35mm|film grain|cinematic|lens|dutch angle|portrait|close-up|editorial)\b'
GAZE=r'\b(gaze|looking|eye contact|eyes? (up|down)ward|upward eyes|over the shoulder|over-the-shoulder)\b'
out=[]
def p(*a): out.append(' '.join(str(x) for x in a))
p('## 子類條目數與長度 (en 字數，排除 none)')
p('| 子類 | 總數 | 非none | 有stableId | en字數 min/中位/max | 指南目標 | 超出目標條目 |')
p('|---|---|---|---|---|---|---|')
allflags=[]
for k,items in C.items():
    real=[i for i in items if i['en'].strip().lower()!='none']
    wc=[len(i['en'].split()) for i in real]
    lo,hi=TARGET.get(k,(0,999))
    over=[f"{i['zh']}({len(i['en'].split())})" for i in real if not lo<=len(i['en'].split())<=hi]
    sid=sum(1 for i in items if i.get('stableId'))
    p(f"| {k} | {len(items)} | {len(real)} | {sid} | {min(wc)}/{statistics.median(wc)}/{max(wc)} | {lo}-{hi} | {', '.join(over) or '—'} |")
    for i in real:
        en=i['en']
        for name,rx in [('subjective',SUBJ),('young',YOUNG),('internal',INTERNAL),('negation',NEG),('scene',SCENE),('light',LIGHT),('camera',CAM),('gaze',GAZE)]:
            hits=sorted(set(m.group(0).lower() for m in re.finditer(rx,en,re.I)))
            if hits: allflags.append((k,i['zh'],name,hits))
p('\n## 關鍵字旗標 (正則掃描 en；diagnostic，不等於錯誤)')
cnt=Counter((f[0],f[2]) for f in allflags)
p('| 子類 | 類型 | 命中條目數 |'); p('|---|---|---|')
for (k,t),n in sorted(cnt.items()): p(f'| {k} | {t} | {n} |')
p('\n### 明細')
for f in allflags: p(f'- {f[0]} / {f[1]} / {f[2]}: {", ".join(f[3])}')
# 子類內相似度 (Jaccard on word tokens)
def toks(s): return set(re.findall(r'[a-z][a-z\-]+',s.lower()))-{'with','and','a','the','of','hair','pose'}
p('\n## 子類內最相近條目 (Jaccard 字詞相似度 ≥0.40)')
for k,items in C.items():
    real=[i for i in items if i['en'].strip().lower()!='none']
    pairs=[]
    for a,b in itertools.combinations(real,2):
        ta,tb=toks(a['en']),toks(b['en'])
        j=len(ta&tb)/len(ta|tb)
        if j>=0.40: pairs.append((j,a['zh'],b['zh']))
    for j,a,b in sorted(pairs,reverse=True)[:8]: p(f'- {k}: {a} ↔ {b} = {j:.2f}')
# zh 名稱宣稱「濕」但 en 無 wet
p('\n## zh/en 語意不一致檢查 (zh 含「濕」但 en 無 wet/damp)')
for i in C['髮型 (Hairstyle)']:
    if '濕' in i['zh'] and not re.search(r'wet|damp|glossy',i['en'],re.I): p(f"- 髮型 / {i['zh']}: en=`{i['en'][:60]}`")
# desc 長度
p('\n## desc 長度 (字元)')
for k,items in C.items():
    dl=[len(i.get('desc','')) for i in items]
    p(f'- {k}: min {min(dl)} / 中位 {statistics.median(dl)} / max {max(dl)}')
# 特殊動作規則 <=55 words <=360 chars, desc<=100
sa=[i for i in C['特殊動作 (Special Actions)'] if i['en']!='none']
p(f"\n特殊動作: 超過 360 chars: {[i['zh'] for i in sa if len(i['en'])>360]}; desc>100: {[i['zh'] for i in sa if len(i['desc'])>100]}")
# 重複 en
p('\n## 完全重複 en')
for k,items in C.items():
    c=Counter(i['en'] for i in items if i['en']!='none')
    for e,n in c.items():
        if n>1: p(f'- {k}: {n}x `{e[:60]}`')
# 年齡/成人
p('\n## 體態欄位內含服裝詞')
for i in C['體態 (Body Type)']:
    h=re.findall(r'\b(fabric|garment|bikini|swimsuit|dress|top|shirt)\b',i['en'],re.I)
    if h: p(f"- {i['zh']}: {h}")
open(sys.argv[1],'w').write('\n'.join(out)); print('\n'.join(out))
