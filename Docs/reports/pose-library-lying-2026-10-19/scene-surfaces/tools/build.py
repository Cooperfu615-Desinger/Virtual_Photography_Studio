import json, sys
# 用法：python3 tools/build.py（在 scene-surfaces/ 執行）；讀 locations.json，產生 surfaces.json 與 README.md
import os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..') + '/'
locs = json.load(open(P + 'locations.json'))

# 可躺：index -> (surfaceType, surfaceEn, confidence, note)；confidence != high 會自動 needsReview
T = {
 0: ('floor','mirrored floor','high','攝影棚鏡面地板，全身躺下合理。'),
 1: ('ground','white surface','high','無縫純色攝影棚地面，躺姿為常見棚拍。'),
 2: ('ground','black surface','high','無縫純色攝影棚地面，躺姿為常見棚拍。'),
 3: ('ground','grey surface','high','無縫純色攝影棚地面，躺姿為常見棚拍。'),
 4: ('ground','blue surface','high','無縫純色攝影棚地面，躺姿為常見棚拍。'),
 5: ('ground','orange surface','high','無縫純色攝影棚地面，躺姿為常見棚拍。'),
 6: ('ground','red surface','high','無縫純色攝影棚地面，躺姿為常見棚拍。'),
 7: ('ground','yellow surface','high','無縫純色攝影棚地面，躺姿為常見棚拍。'),
 8: ('ground','purple surface','high','無縫純色攝影棚地面，躺姿為常見棚拍。'),
 9: ('ground','green surface','high','無縫純色攝影棚地面，躺姿為常見棚拍。'),
 10: ('ground','color-block surface','high','無縫純色攝影棚地面，躺姿為常見棚拍。'),
 11: ('ground','gradient ground-and-background plane','high','無縫漸層攝影棚地面；描述中 surface 片語為 tonal transition surface，較不直觀，改取 ground-and-background plane。'),
 12: ('floor','desaturated blue-grey floor','medium','攝影棚地面可躺，但地上散落 VHS 與纜線，躺姿與道具關係需確認。'),
 13: ('ground','ground-and-background color surface','high','無縫多色塊攝影棚地面；片語較長但為唯一指地面的片語。'),
 14: ('bed','bed with white sheets','high','飯店房間有床。'),
 15: ('rug','rug','medium','只有 sofa edge（非整張沙發），改取地毯；片語取自 rug texture 中的 rug，是否接受需確認。'),
 18: ('rug','floor rug','high','Y2K 臥室地毯，躺地拍攝合理（bed edge 僅床緣）。'),
 20: ('bed','linen bedding','high','臥室窗邊床鋪寢具。'),
 21: ('bed','white bedding surface','high','臥室白色床鋪。'),
 32: ('bed','floral bedding','high','旅館房間碎花床鋪。'),
 36: ('floor','worn wood floor','medium','鋼琴房木地板可躺，但場景主體是鋼琴，躺地是否符合預期需確認。'),
 38: ('bed','compact single bed','high','學生房單人床。'),
 39: ('tatami','tatami flooring','high','和室榻榻米。'),
 50: ('floor','raised wooden deck','medium','緣側木廊可躺，但描述強調邊緣與門檻構圖，且片語原為 raised wooden deck edge（去掉 edge）。'),
 52: ('bed','compact bedding','high','小旅館房間床鋪。'),
 63: ('bed','medical bed','medium','廢棄診療室診療床，躺上合理但屬廢墟情境。'),
 66: ('bed','examination bed','medium','廢棄保健室診療床，躺上合理但屬廢墟情境。'),
 67: ('other','gym mats','medium','體育器材室有疊放體操墊可躺；片語取自 stacked gym mats，躺在疊墊上的高度與構圖需確認。'),
 101: ('grass','lawn','medium','孚日廣場草坪可躺，但描述為 lawn edge／clipped grass border，片語取自 lawn edge 中的 lawn。'),
 135: ('floor','wet stone deck','medium','泳池濕石地面可躺，但緊鄰泳池邊；lounge chair 只有一角不採用。'),
 137: ('sand','wet sand','high','金色沙灘濕沙，人不在水中。'),
 140: ('grass','lawn','high','公園草地；片語取自 uneven lawn texture 中的 lawn。'),
 141: ('grass','grassland plain','high','開闊草原平地。'),
 144: ('ground','leaf-litter ground','medium','森林營地空地落葉地面，可躺但旁有營火與帳篷，需確認。'),
 145: ('floor','wooden deck','medium','湖邊木棧道可躺，但描述為 deck edge 且緊鄰水面；片語取自 lakeside wooden deck edge 中的 wooden deck。'),
 147: ('sand','sandy ground plane','high','沙丘沙地。'),
 148: ('ground','salt crust ground','high','鹽湖乾裂鹽殼地面，躺地為常見拍法。'),
 149: ('grass','green lawn','high','近景草地場景底。'),
 150: ('bed','white bed surface','high','白色床鋪場景底。'),
 151: ('tatami','tatami ground plane','high','榻榻米場景底。'),
 152: ('grass','green lawn','high','樹下草地場景底。'),
 153: ('sand','fine sand surface','high','沙灘細沙場景底，人不在水中。'),
 # Cooper 2026-10-19：開放廢墟／頹廢風場景躺姿（時尚攝影常見）
 69: ('floor','dusty wooden floor','high','Cooper 開放廢墟場景（2026-10-19）。'),
 65: ('floor','wooden floor','high','Cooper 開放廢墟場景（2026-10-19）；片語取自 dust on the wooden floor。'),
 68: ('floor','concrete floor','high','Cooper 開放廢墟場景（2026-10-19）。'),
 34: ('floor','stone floor','high','Cooper 開放廢墟／頹廢風場景（2026-10-19）；片語取自 tiled or stone floor。'),
 76: ('floor','exposed high-rise floor slab','high','Cooper 開放廢墟／頹廢風場景（2026-10-19）。'),
}

# 不可躺：index -> (confidence, needsReview, note)
NS = '描述中沒有表面片語'
F = {
 16: ('high',False,'人群派對室內，躺地不合理且無表面片語。'),
 17: ('high',False,'書店走道與書桌，'+NS+'。'),
 19: ('high',False,'只有窗、梳妝台、邊桌等，'+NS+'。'),
 22: ('high',False,'浴室洗手台，無可躺平面。'),
 23: ('high',False,'廚房流理台，無可躺平面。'),
 24: ('high',False,'試衣間狹窄，只有小凳。'),
 25: ('high',False,'電梯內，不可躺。'),
 26: ('high',False,'Diner 卡座長椅與地板，餐廳地面躺姿不合理。'),
 27: ('medium',False,'圖書館閱讀桌場景，雖有 worn floor surface，但躺圖書館地面不合理。'),
 28: ('high',False,'窗邊閱讀角，'+NS+'。'),
 29: ('medium',False,'書車旁，雖有 worn carpet／wood floor，但躺圖書館地面不合理。'),
 30: ('high',False,'借書櫃台，不可躺。'),
 31: ('high',False,'咖啡館桌角，'+NS+'。'),
 33: ('high',False,'酒吧包廂長椅與小桌，非全身可躺平面。'),
 35: ('high',False,'唱片角，'+NS+'。'),
 37: ('high',False,'後台地面有纜線與膠帶，躺地不合理。'),
 40: ('high',False,'教室課桌椅，'+NS+'。'),
 41: ('high',False,'茶水間流理台，不可躺。'),
 42: ('high',False,'洗衣店磁磚地，不合理。'),
 43: ('high',False,'洗衣店摺衣台，不可躺。'),
 44: ('high',False,'洗衣店貨架前，不可躺。'),
 45: ('high',False,'洗衣店塑膠椅角落，不可躺。'),
 46: ('high',False,'陽台地板只有 floor edge，空間狹小不合理。'),
 47: ('high',False,'外樓梯間，不可躺。'),
 48: ('high',False,'路邊販賣機，柏油路面不合理。'),
 49: ('high',False,'辦公區人行道，不可躺。'),
 51: ('high',False,'歌劇院座位與走道，不可躺。'),
 53: ('high',False,'廢棄工廠碎石與水泥粉塵，不可躺。'),
 54: ('high',False,'控制室，'+NS+'。'),
 55: ('high',False,'攪拌槽旁不平台面，不可躺。'),
 56: ('high',False,'機具堆放區，地面雜物多，不可躺。'),
 57: ('high',False,'地面積水，水中／水面另案處理。'),
 58: ('high',False,'排水閘門旁濕地面與水溝，不可躺。'),
 59: ('high',False,'機房通道口格柵地板，不可躺。'),
 60: ('high',False,'手術台已損壞，地磚破裂，不可躺。'),
 61: ('medium',True,'只有金屬床架與殘破寢具（old metal bed frame / loose bedding remnants），是否可躺需確認。'),
 62: ('high',False,'藥品室貨架，不可躺。'),
 64: ('high',False,'廢棄教室課桌散亂，'+NS+'（只有 dusty schoolroom floor）。'),
 70: ('high',False,'廢棄商場手扶梯旁，不可躺。'),
 71: ('high',False,'地上碎玻璃，不可躺。'),
 72: ('high',False,'美食街桌椅區，不可躺。'),
 73: ('high',False,'服務台殘骸與碎玻璃，不可躺。'),
 74: ('high',False,'廢棄公園破裂鋪面，不可躺。'),
 75: ('high',False,'鐵道碎石道床，不可躺。'),
 77: ('high',False,'鷹架旁，不可躺。'),
 78: ('high',False,'開放樓層邊緣，危險不可躺。'),
 79: ('high',False,'建材堆放角落，不可躺。'),
 80: ('high',False,'城寨狹窄走道，不可躺。'),
 81: ('high',False,'樓梯井，不可躺。'),
 82: ('high',False,'餐廳桌椅區，不可躺。'),
 83: ('high',False,'地鐵月台，不可躺。'),
 84: ('high',False,'月台長椅區，不可躺。'),
 85: ('high',False,'月台邊列車進站，危險不可躺。'),
 86: ('high',False,'地鐵磁磚牆旁站立區，不可躺。'),
 87: ('high',False,'地鐵月台，不可躺。'),
 88: ('high',False,'電車車廂座位，不可躺。'),
 89: ('high',False,'電車車廂走道，不可躺。'),
 90: ('high',False,'擁擠車廂，不可躺。'),
 91: ('high',False,'澀谷人潮廣場，不可躺。'),
 92: ('high',False,'八公像人潮區，不可躺。'),
 93: ('high',False,'斑馬線路口，不可躺。'),
 94: ('high',False,'橋上欄杆視角，不可躺。'),
 95: ('high',False,'道頓堀橋邊人行道，不可躺。'),
 96: ('high',False,'雜貨店門口，不可躺。'),
 97: ('high',False,'城寨巷弄牆面，不可躺。'),
 98: ('high',False,'騎樓店門口，不可躺。'),
 99: ('high',False,'路邊餐桌，不可躺。'),
 100: ('high',False,'拱廊石地走道，不可躺。'),
 102: ('high',False,'住宅門口人行道，不可躺。'),
 103: ('high',False,'櫥窗前人行道，不可躺。'),
 104: ('high',False,'街角人行道，不可躺。'),
 105: ('high',False,'街角櫥窗，不可躺。'),
 106: ('high',False,'街區店面，不可躺。'),
 107: ('high',False,'街頭店面，不可躺。'),
 108: ('high',False,'街頭店面，不可躺。'),
 109: ('high',False,'大道人行道，不可躺。'),
 110: ('high',False,'歌舞伎町街道，不可躺。'),
 111: ('high',False,'販賣機旁人行道，不可躺。'),
 112: ('high',False,'酒吧門口，不可躺。'),
 113: ('high',False,'濕地反光街角，不可躺。'),
 114: ('high',False,'酒吧門口，不可躺。'),
 115: ('high',False,'櫥窗邊人行道，不可躺。'),
 116: ('high',False,'招牌下街角，不可躺。'),
 117: ('high',False,'濕地反光街角，不可躺。'),
 118: ('high',False,'海報牆巷口，不可躺。'),
 119: ('high',False,'塗鴉牆人行道，不可躺。'),
 120: ('high',False,'龐克街角，不可躺。'),
 121: ('high',False,'排屋人行道與台階，不可躺。'),
 122: ('high',False,'石板巷弄，不可躺。'),
 123: ('high',False,'老洋房門口，不可躺。'),
 124: ('high',False,'咖啡館窗邊座位，不可躺。'),
 125: ('high',False,'露台座位，不可躺。'),
 126: ('high',False,'街角牆面，不可躺。'),
 127: ('high',False,'鐵欄杆前人行道，不可躺。'),
 128: ('high',False,'石牆轉角石板路，不可躺。'),
 129: ('high',False,'咖啡館外桌旁，不可躺。'),
 130: ('high',False,'木門前門檻，不可躺。'),
 131: ('high',False,'窗台邊人行道，不可躺。'),
 132: ('medium',False,'碼頭欄杆步道，雖有 timber pier decking，但場景為欄杆旁步道，躺地不合理。'),
 133: ('high',False,'觀景欄杆，不可躺。'),
 134: ('high',False,'頂樓護欄邊緣，危險不可躺。'),
 136: ('high',False,'飯店陽台欄杆，'+NS+'。'),
 138: ('high',False,'岩岸與淺海水，水中／水面另案處理，岩石不平。'),
 139: ('high',False,'岩洞淺灘，水中／水面另案處理。'),
 142: ('medium',False,'向日葵花田莖葉密集，只有 soil path fragment，不適合躺。'),
 143: ('medium',True,'森林步道 uneven ground／leaf litter／mossy roots，地面不平，是否可躺需確認。'),
 146: ('high',False,'岩岸不平且緊鄰海水，水面另案處理。'),
}

assert set(T) & set(F) == set(), set(T) & set(F)
assert set(T) | set(F) == set(range(len(locs))), sorted(set(range(len(locs))) - set(T) - set(F))

out = []
for i, x in enumerate(locs):
    en = x['en']
    if i in T:
        st, s, conf, note = T[i]
        k = en.lower().find(s.lower())
        snip = None
        if k >= 0:
            a, b = max(0, k - 30), min(len(en), k + len(s) + 30)
            snip = ('…' if a > 0 else '') + en[a:b] + ('…' if b < len(en) else '')
        out.append(dict(id=x['id'], zh=x['zh'], lyingAllowed=True, surfaceType=st, surfaceEn=s,
                        sourceSnippet=snip, confidence=conf, needsReview=(conf != 'high'), note=note))
    else:
        conf, nr, note = F[i]
        out.append(dict(id=x['id'], zh=x['zh'], lyingAllowed=False, surfaceType=None, surfaceEn=None,
                        sourceSnippet=None, confidence=conf, needsReview=nr, note=note))

# Cooper 2026-10-19：待審核場景全部「照目前判定」；保留 reviewedByCooper 供追溯。
for o in out:
    if o['needsReview']:
        o['needsReview'] = False
        o['reviewedByCooper'] = '2026-10-19 照目前判定'
json.dump(out, open(P + 'surfaces.json', 'w'), ensure_ascii=False, indent=2)

def esc(t): return (t or '').replace('|', '\\|')
ok = [o for o in out if o['lyingAllowed'] and not o['needsReview']]
rv = [o for o in out if o['needsReview']]
no = [o for o in out if not o['lyingAllowed'] and not o['needsReview']]
L = ['# 躺姿表面清單審核', '',
     '來源：`locations.json`（%d 個場景）。表面片語皆逐字擷取自場景英文描述，會接在 `on the ` 後面，例如 `She lies on her stomach on the white bed surface`。' % len(out), '',
     '統計：可躺（高信心）%d、需要審核 %d、不可躺 %d。' % (len(ok), len(rv), len(no)), '',
     '## 可躺（高信心）', '', '| 中文場景名 | 表面類型 | 擷取片語 | 理由 |', '| --- | --- | --- | --- |']
L += ['| %s | %s | `%s` | %s |' % (esc(o['zh']), o['surfaceType'], o['surfaceEn'], esc(o['note'])) for o in ok]
L += ['', '## 需要審核（Cooper 2026-10-19 已全部照目前判定，本段保留空白）', '', '| 中文場景名 | 表面類型 | 擷取片語 | 理由 |', '| --- | --- | --- | --- |']
L += ['| %s | %s | %s | %s（目前判定：%s） |' % (esc(o['zh']), o['surfaceType'] or '—', ('`%s`' % o['surfaceEn']) if o['surfaceEn'] else '—', esc(o['note']), '可躺' if o['lyingAllowed'] else '不可躺') for o in rv]
L += ['', '## 不可躺', '', '| 中文場景名 | 理由 |', '| --- | --- |']
L += ['| %s | %s |' % (esc(o['zh']), esc(o['note'])) for o in no]
open(P + 'README.md', 'w').write('\n'.join(L) + '\n')
print('written', len(out))
