"""髮型長度/綁法、髮色色系、表情情緒價性分佈（關鍵字分類）。唯讀。"""
import json, re
from collections import Counter
d=json.load(open('/Users/cooperfu/Projects/Virtual_Photography_Studio/webapp/src/data/database.json'))['Character']
def cls_hair(en):
    e=en.lower()
    if re.search(r'ponytail|pigtail|twin|bun|chignon|half-up|braid',e): return '綁髮/盤髮'
    if re.search(r'short|bob|slicked',e): return '短髮/鮑伯'
    if re.search(r'medium-length|collarbone|medium soft|medium-to-long',e) and not e.startswith('long'): return '中長'
    if re.search(r'\blong\b',e): return '長髮'
    return '其他'
hs=[i for i in d['髮型 (Hairstyle)'] if i['en']!='none']
c=Counter(cls_hair(i['en']) for i in hs); print('髮型分佈', dict(c), '合計', len(hs))
for k in c: print(' ',k, [i['zh'] for i in hs if cls_hair(i['en'])==k])
def cls_color(en):
    e=en.lower()
    if re.search(r'pink|blue|green',e): return '鮮豔特殊色'
    if re.search(r'blonde|silver|gray',e): return '淺色/漂色'
    if re.search(r'black',e): return '黑'
    return '棕系'
hc=[i for i in d['髮色 (Hair Color)'] if i['en']!='none']
print('髮色分佈', dict(Counter(cls_color(i['en']) for i in hc)))
def val(zh):
    if re.search(r'微笑|喜悅|忍笑|吐舌',zh): return '正向'
    if re.search(r'悲傷|憤怒|生氣|不安|驚訝',zh): return '負向/激動'
    return '中性/平靜'
ex=[i for i in d['表情 (Facial Expression)'] if i['en']!='none']
print('表情價性', dict(Counter(val(i['zh']) for i in ex)))
pb=[i for i in d['姿勢與肢體語言 (Pose & Body Language)'] if i['en']!='none']
print('legacy 姿勢家族', dict(Counter(i['zh'].split('｜')[0] for i in pb)))
