# adidas 三線外套與長褲 v1

日期：2026-10-05。使用者核准兩件獨立單品、各 20 詞英文，以及抽繩長褲的腰頭相容規則。Public output contract `1.44.0`。

## 來源與選項

- 外套分類尾端追加「愛迪達立領三線外套」，ID `wardrobe:外套-outerwear:愛迪達立領三線外套:22`。
  - `adidas zip-front track jacket, stand-up collar, smooth tricot fabric, three parallel contrast stripes from shoulders to cuffs on both sleeves`
  - 外套 metadata：同一 `baseEn`、`fasteners: [zip]`、`rollableSleeves: true`；使用既有版型、開合、穿法、配色、圖案及不透明外套閉合遮蔽內搭規則。
- 褲裝分類尾端追加「愛迪達三線運動長褲」，ID `wardrobe:褲裝-pants:愛迪達三線運動長褲:33`。
  - `adidas full-length smooth tricot track pants with an elastic drawstring waist and three parallel contrast stripes down both outer legs`
  - `bottomWaist.supportsUnfastenedFly: false`，只對這件停用「扣子解開拉鏈微開」。其他腰線及下身版型照常生效。
- 材質、品牌及三線是單品自身來源；配色控制底色，三線使用撞色，不固定色碼。兩件可以獨立搭配，沒有自動成套關係。
- 追加至既有隨機池；新增候選可能改變抽樣，明確選定的舊單品及既有 ID、索引、來源、Saved Cards schema 不變。

## 六輸出與相容性

- 沿用現有六輸出組裝與景別投影，不增加品牌專用 renderer。外套片語與褲裝單句保留可見的品牌、材質及三線；兩組胸上衍生省略長褲，全身衍生恢復。
- 同一人物的褲裝與腰線先共用解析；不相容腰線只清空有效英文，保留來源 ID 和 selection。單人與雙人 A/B 分開處理。
- UI 停用不相容選項；已有選值時暫顯全無及既有恢復提示。切換相容褲款恢復原選值。工作台與生成摘要省略無效腰線。
- 標準 Prompt 回填辨識兩件及外套版型／開合。完整 Saved Card 可還原被抑制的腰線；純文字無法還原未輸出的選值。

## 驗證

- `adidasTrackwear.test.js`：六輸出、胸上裁切、外套版型／拉鏈／捲袖、關閉內搭、腰線停用／恢復、雙人隔離、文字回填與收藏還原。
- `representativePromptFixtures.js` 加入兩件同穿且腰線不相容的案例；納入 Prompt Quality。
- 舊款比較：165 組明確選項／景別，selection 與六輸出雜湊、舊 ID／名稱應一致。
- 依 AGENTS 執行資料同步檢查、Python、公開資產、完整前端 gates、200／prompt-quality-baseline 前後 strict audit，以及 1440×1000／390×900 六輸出與五工作區瀏覽器驗證。
- 外部圖像模型呈現另由使用者實測；本次驗證涵蓋文字與介面。
