## 角色卡總數: 33 (選項總數含 none: 34)

## 逐欄覆蓋率與字數 (words)
| 欄位 | 覆蓋 | min | 中位 | max | 最短卡 | 最長卡 |
|---|---|---|---|---|---|---|
| facialGeometry | 33/33 | 13 | 15 | 17 | 09_Amy | 48_G |
| eyeSignature | 33/33 | 13 | 15 | 19 | 09_Amy | 36_Miku |
| noseSignature | 33/33 | 8 | 13 | 14 | 14_Nana | 00_Mei |
| mouthSignature | 33/33 | 13 | 14 | 17 | 38_Rin | 12_Sakura |
| skinSignature | 33/33 | 8 | 9 | 13 | 48_G | 03_Sui |
| makeup | 33/33 | 7 | 13 | 16 | 07_Lily | 34_Seulgi |
| body | 33/33 | 4 | 13 | 19 | 12_Sakura | 25_Grace |
| distinctiveFeatures | 33/33 | 20 | 26 | 35 | 22_Olivia | 10_Ji-Yoo |
| identityAndBody | 33/33 | 40 | 93 | 153 | 29_Philippa | 41_Eleanor |
| legacyIdentityAndBody | 33/33 | 40 | 93 | 153 | 29_Philippa | 41_Eleanor |
| hair | 33/33 | 14 | 23 | 83 | 48_G | 08_Jiwoo |
| outfit | 33/33 | 11 | 30 | 64 | 19_Minji | 12_Sakura |
| accessories | 19/33 | 4 | 8 | 26 | 05_Chihiro | 38_Rin |
| photographicDirection | 33/33 | 13 | 18 | 27 | 48_G | 08_Jiwoo |
| bodyProjection | 33/33 | - | - | - | - | - |
| option.en | 33/33 | | | | | |
| meta.referenceImage | 33/33 | | | | | |
| referenceImages(meta 或 option) | 0/33 | | | | | |

option.en 字數: min 123 (09_Amy) / 中位 163 / max 237 (08_Jiwoo)
identityAndBody === legacyIdentityAndBody: 33/33

## distinctiveFeatures 四錨點檢查
- 錨點數 ≠4 或含可替換造型詞: 無
- 含「非幾何」永久標記 (痣/雀斑/角/紋/疤等) 的卡: 2/33；其餘僅以臉/眼/鼻/唇幾何作錨點

## 角色卡五官結構相似度 (TF-IDF cosine；facial+eye+nose+mouth+skin；528 對)
平均 0.287，中位 0.281，最高 0.757
| 排名 | 卡 A | 卡 B | cosine | 各欄 cosine (face/eye/nose/mouth/skin) |
|---|---|---|---|---|
| 1 | 18_Natsuki | 36_Miku | 0.757 | 0.94 / 0.84 / 0.55 / 0.45 / 1.00 |
| 2 | 09_Amy | 18_Natsuki | 0.579 | 0.49 / 0.56 / 0.80 / 0.09 / 0.48 |
| 3 | 48_G | 13_Yui | 0.544 | 0.92 / 0.23 / 0.63 / 0.47 / 0.03 |
| 4 | 15_Emily | 33_Bora | 0.519 | 0.54 / 0.17 / 0.86 / 0.18 / 0.61 |
| 5 | 48_G | 36_Miku | 0.512 | 0.59 / 0.46 / 0.27 / 0.48 / 0.13 |
| 6 | 01_Rei | 15_Emily | 0.508 | 0.38 / 0.18 / 0.21 / 0.33 / 0.67 |
| 7 | 48_G | 26_Yuna | 0.505 | 0.59 / 0.47 / 0.37 / 0.19 / 0.35 |
| 8 | 14_Nana | 18_Natsuki | 0.505 | 0.58 / 0.59 / 0.45 / 0.18 / 0.39 |
| 9 | 29_Philippa | 10_Ji-Yoo | 0.500 | 0.73 / 0.14 / 0.43 / 0.13 / 0.22 |
| 10 | 32_Soyeon | 36_Miku | 0.499 | 0.68 / 0.62 / 0.40 / 0.40 / 0.24 |
| 11 | 10_Ji-Yoo | 15_Emily | 0.499 | 0.59 / 0.45 / 0.20 / 0.31 / 0.36 |
| 12 | 01_Rei | 18_Natsuki | 0.499 | 0.45 / 0.46 / 0.21 / 0.51 / 0.62 |

### 每張卡的最近鄰 (cosine)
18_Natsuki→36_Miku 0.76；36_Miku→18_Natsuki 0.76；09_Amy→18_Natsuki 0.58；48_G→13_Yui 0.54；13_Yui→48_G 0.54；15_Emily→33_Bora 0.52；33_Bora→15_Emily 0.52；01_Rei→15_Emily 0.51；26_Yuna→48_G 0.51；14_Nana→18_Natsuki 0.50；10_Ji-Yoo→29_Philippa 0.50；29_Philippa→10_Ji-Yoo 0.50；32_Soyeon→36_Miku 0.50；20_Manami→15_Emily 0.49；37_Hina→18_Natsuki 0.48；34_Seulgi→48_G 0.47；02_Yuri→14_Nana 0.47；08_Jiwoo→01_Rei 0.46；07_Lily→00_Mei 0.45；00_Mei→07_Lily 0.45；19_Minji→15_Emily 0.45；16_Shiori→07_Lily 0.45；12_Sakura→32_Soyeon 0.44；30_Kaori→00_Mei 0.43；06_Hinata→18_Natsuki 0.43；11_Rika→02_Yuri 0.43；41_Eleanor→00_Mei 0.42；25_Grace→01_Rei 0.41；38_Rin→33_Bora 0.41；05_Chihiro→16_Shiori 0.40；22_Olivia→06_Hinata 0.40；04_Koto→18_Natsuki 0.39；03_Sui→15_Emily 0.32

### legacy identityAndBody 最相似前 5: 18_Natsuki↔36_Miku 0.62；09_Amy↔18_Natsuki 0.59；15_Emily↔33_Bora 0.59；01_Rei↔19_Minji 0.58；01_Rei↔15_Emily 0.57

## 屬性分佈 (從結構化欄位抽取關鍵詞)
- 臉型 (facialGeometry 首個命中): oval:16, heart-oval:8, oval-heart:8, near-round:1
- 眼色: brown:13, gray:8, hazel:6, green:2, blue:1, olive:1, amber:1, crimson:1
- 眼型: almond:19, round-almond:9, round:5
- 鼻梁: low:12, medium:8, high:8, narrow:5
- 膚色: porcelain:12, fair:12, ivory:4, olive:2, beige:2, pale:1
- 下巴: pointed:21, rounded:12

## identityAndBody vs 結構化欄位 一致性 (自動比對)
- 無自動偵測到的矛盾

## 規格禁止的模糊片語命中 (character-card-facial-identity.md Writing rules)
依欄位命中卡數: {"en":13,"identityAndBody":12,"distinctiveFeatures":1}
- 11_Rika / distinctiveFeatures: beauty

## option.en / identityAndBody 內的表情、視線字詞 (身份欄位責任外)
- 29_Philippa: en=gaze identityAndBody=-
- 06_Hinata: en=expression identityAndBody=-
- 11_Rika: en=pout identityAndBody=-
- 38_Rin: en=gaze identityAndBody=-
- 07_Lily: en=pout identityAndBody=-
- 02_Yuri: en=gaze identityAndBody=-
- 03_Sui: en=pout identityAndBody=-
- 37_Hina: en=gaze identityAndBody=-
- 26_Yuna: en=expression identityAndBody=-
- 41_Eleanor: en=gaze identityAndBody=gaze
- 22_Olivia: en=expression identityAndBody=-
- 08_Jiwoo: en=expression identityAndBody=-
- 05_Chihiro: en=expression identityAndBody=-
- 04_Koto: en=expression identityAndBody=-
- 00_Mei: en=gaze identityAndBody=gaze
- 30_Kaori: en=gaze identityAndBody=gaze

## 成年身份字串
- option.en 含 "20-year-old adult": 33/33
- identityAndBody 含: 33/33
- 結構化欄位(含 distinctiveFeatures) 含 adult/年齡: 0/33
- 年齡值種類: 20
- 含年輕化/娃娃感詞的卡: 10/33 → 48_G(doll-like)；12_Sakura(doll-like/kawaii/girl)；11_Rika(doll-like/girl/baby)；07_Lily(doll-like)；02_Yuri(doll-like)；03_Sui(girl)；37_Hina(doll-like/youthful)；26_Yuna(doll-like)；08_Jiwoo(doll-like)；04_Koto(doll-like)

## 參考圖 manifest / 檔案
- manifest 項目 33；卡片不在 manifest: 無；manifest 多餘: 無
- meta.referenceImage 對應 public 檔不存在: 無
- manifest source 原圖不存在: 0 筆
- source-assets 每卡原圖數: 48g:1, philippa:1, sakura:1, hinata:4, rika:1, rin:1, lily:1, yuri:3, sui:4, hina:3, yuna:3, eleanor:3, olivia:4, jiwoo:3, chihiro:4, koto:3, mei:4, rei:3, amy:4, jiyoo:4, yui:3, nana:3, emily:3, shiori:3, natsuki:3, minji:3, manami:3, grace:4, kaori:3, soyeon:3, bora:4, seulgi:4, miku:3

## body 欄位類型分佈
petite:17, tall:11, slim:2, curvy:2, slender:1

## 卡片 zh 編號: 48_G, 29_Philippa, 12_Sakura, 06_Hinata, 11_Rika, 38_Rin, 07_Lily, 02_Yuri, 03_Sui, 37_Hina, 26_Yuna, 41_Eleanor, 22_Olivia, 08_Jiwoo, 05_Chihiro, 04_Koto, 00_Mei, 01_Rei, 09_Amy, 10_Ji-Yoo, 13_Yui, 14_Nana, 15_Emily, 16_Shiori, 18_Natsuki, 19_Minji, 20_Manami, 25_Grace, 30_Kaori, 32_Soyeon, 33_Bora, 34_Seulgi, 36_Miku