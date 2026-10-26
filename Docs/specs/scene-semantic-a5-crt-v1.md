# Phase 4 A5：CRT outdoor 修正 v1

日期：2026-10-26。狀態：Cooper 已確認本機實作與完整驗收通過，授權限定提交／push 本批；實際 Git 與該提交 CI 結果另行核對，不以授權代替交付完成。基準為已核對遠端 main `321404ecd041343f4a764260ef59ffc08a74a199`。

## 核准範圍

只從 `locations:攝影棚與背景-studio-sets:室內-crt-電視牆攝影棚:13` 的 `meta.semantic.tags` 移除 outdoor，保留有序 `indoor, set, controlled, studio, studio_lighting_scene`。正式來源為 [Studio Sets JSON](../../knowledge_base/catalog/Locations/攝影棚與背景-studio-sets.json)，同步生成 database；六份 Markdown、legacyMappings、ID／有序 aliases、zh／en／desc、列序、lyingSurface、schema／registry／index、圖片、引擎與 renderer 不變。

採用現有室內規則，不新增 CRT 特例。缺 semantic 的歷史／自訂資料保留既有推論；不修改 deck 關鍵字或 VCR decks 原文。其他 A5 已修正三筆、11 筆 commercial 及 4 筆保留資料維持。其他 A 項、J12、B3、P5b 均不在本批。

## 核准行為差異

- 場景的室內分類、位置順序與環境光有序候選不變。一般 CRT 全身、環境光隨機／全無時，主體光 22→23，恢復窗格投影光；其他景別／環境光依原規則可能另恢復百葉窗條紋投影光，暗光等排除仍保留。
- 隨機服裝沿用室內相容篩選；泳裝／波希米亞的隨機候選與抽中結果可改變。手動指定的既有比基尼、其他服裝與有效光線鎖值保持，不新增手動禁用。
- 符合原條件的自動外套機率回到室內分支：套裝 0.55→0.30，其他 0.60→0.35；明確外套鎖值不改。隨機消耗及後續選值可因此改變，六輸出包含全身角色照皆依同一 resolved state 產生。
- 舊 Pose Composer 一般候選少 grass／concrete／sand／clear-sea 四項；仰躺表面主導分支保持。這是現有相容路徑，不恢復已退場的 UI 或場景篩選功能。
- 現行正式 style 沒有此次受影響的 studio_bias／set_bias／natural_bias／outdoor_bias，正式風格池不變。不得以修標籤之名更動風格資料。
- UI transition 與直接引擎明確光線鎖值分開驗證。Saved Cards 原文字／ID 不批次重寫；套用重生成可依上述核准規則改變。App 載入儲存資料既有的 none 欄位補齊，以 pre-CRT codec round-trip 為對照，不誤認成此次改寫。

## 基準與歷史保護

修改前保存全部 tracked 及其他 worktree 未提交 SHA、固定種子 audit。A～E、前兩批 A5 報告、原始基準、生成工具、前批 acceptance 與 inverse 不改寫。

新增 test-only 精確 inverse：先還原 CRT 到 321404ec，再由原 commercial inverse 回復 11 筆，最後由原三筆 inverse 回復三筆。拒絕 missing／duplicate ID、額外 tag、錯誤順序與未核准 source 變化，不改傳入資料或正式快取。歷史測試改接新回放入口；commercial 原七項測試以固定 Git 原檔在 current code＋pre-CRT 的隔離根目錄重跑，不刪除原 CRT 保持不變的斷言。現行 15 筆資料保護另由本批回歸直接驗證。

## 驗收方式與順序

1. 先加固定 ID／來源／before／after 案例及回歸，確認未修資料會失敗，再變更唯一來源並同步；完整資料只允許一個 tag 差異。
2. 獨立固定 Git 舊引擎＋僅移除 outdoor 的記憶體資料為 oracle；當前完整 stable prompt、selection、summary、structured、六輸出與 RNG 必須等於 oracle。原版與新版差異逐案例記錄，不要求有意改變的隨機案例零 diff。
3. 覆蓋 11 景別、scene none／indoor、全部環境光、主體光、手動與隨機服裝／外套、單雙人、CRT 全鎖定比基尼案例、舊姿勢及 supine、角色卡／專用主體／固定場景／抓拍、其餘 154 個場景選項及既有匯入 corpus。固定公開文字應逐字保持；非 CRT 案例維持不變。
4. 以固定 Git 舊 codec 建立收藏 JSON／Markdown，驗證原資料不變、解析 ID／鎖值、UI transition 與重新生成；不能把縮短文字可逆當作新保證。隨機用實際控制契約：空字串或該控制合法 random ID，不用通用字面 random 代替。
5. 在 pre-CRT 隔離來源重跑前批 commercial 3,804 案例及第一批 1,740 案例；常駐 A 回放及 E 還原照常執行。所有歷史證據 SHA 保持。
6. sync／schema／歷史 ID／strict、Python、catalog tools、Node 22 前端全套、Prompt Quality、lint／build、同 seed 200 strict audit、公開資產、文件連結及 diff-check 全部驗證。舊不相關失敗只留證不擴修。
7. 桌面 1440×1000、手機 390×900：CRT 光線選單、窗格投影、手動比基尼、隨機服裝、六輸出、收藏重載／套用、整合姿勢／抓拍、匯入與五工作區 smoke；無 console/page error、破圖、頁面橫向溢出。隔離儲存，不送外部生圖。

結果見 [本批報告](../reports/scene-semantic-a5-crt-2026-10-26/README.md)；本機完成、使用者驗收、Git 交付與 CI 各別記錄。
