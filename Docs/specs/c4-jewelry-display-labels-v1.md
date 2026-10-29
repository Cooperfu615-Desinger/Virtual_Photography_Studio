# C4 第三批：項鍊／腰鍊用字與收尾 v1

2026-10-29，可信基準 main `a1cf63ec66b04d74bba514a64937039cdd4e7da5`。Cooper 授權實作、必要歷史回放銜接及完整驗收，未授權 stage／commit／push。驗收狀態見 [本批報告](../reports/c4-jewelry-labels-2026-10-29/README.md)。

## 限定變更

正式分類三檔：頸部、腰部配件、套裝。名稱「多條層疊的金項鏈」「街頭風格金項鏈」「銀色水鑽蝴蝶腰鏈」「垂墜背心腰鏈短裙」中的項鏈／腰鏈改為項鍊／腰鍊；套裝說明的多層腰鏈、銀色粗鏈項鍊說明的金色街頭項鏈同步改字，共五筆、四名稱、兩說明。英文、meta.semantic、ID、legacyIds、順序、配色及可見性不變。鏈條、鏈節、細鏈、銀鏈、頸鏈、褲鏈、身體鏈不在統一範圍。

必要相依：

- WARDROBE_LEGACY_OPTION_MAP 與 WARDROBE_LEGACY_PROMPT_ALIASES 各一個 targetZh 跟隨街頭風格金項鍊新名；舊 tuples、索引、英文 prompts、first-match 均保留。「雙層金屬腰鏈」為歷史輸入鍵，禁止改字。
- 舊 jewelryId／jewelryIds 依目前資料的 zh 找目標欄位；只增加兩個新名稱鍵，保留兩個舊鍵及明確 neckAccessoryId 優先權。不擴充既有不支援的還原情境。
- wardrobe_reference_manifest.json 只改套裝 name；圖片 ID、source、preview 與實體檔保持。
- ID 與 MJ 表鍵中的舊字、舊收藏原文、歷史文檔／基準保留。新中文只作用於現行選單、解析提示及新摘要。
- 正式 JSON 由 sync 生成 Markdown／database／legacyMappings，禁止手改生成物。

## 驗收

修改前固定 216 組（四選項 × 單人／雙人 A／B × 六景別 × 三組穿搭條件），比較英文六輸出、selection、RNG 與舊收藏公開原文／原有反序列化補預設結果。1,098 組舊還原逐條對照；解析提示 matchedControls.option.zh 只依精確 ID 與核准新名稱反轉顯示字，再比舊雜湊，鎖值／英文／meta 不正規化。舊英文字句仍解析成同 ID。

新增 scalar／array jewelry、明確欄位優先、first-match、A／B 舊 ID、圖片 name-only、精確 inverse 拒絕正式 checkout／未知來源案例。基準 before.json.gz 使用排他建立，不得重錄。C4 第三批 inverse 先準備，再傳遞第二批／第一批／其他歷史鏈；新增回放銜接已包含在本次授權，不改 PAGE2 產品功能或舊封存。

完整門檻為前端全套、Prompt Quality、lint／build、正式產物初始化、同 seed 200／prompt-quality-baseline strict、sync/check、schema／歷史 ID／strict、Python／工具／公開資產及桌手機六工作區。互動需驗證新名稱、原圖片、新收藏與舊收藏套用。原生選單限制如未另證實解除，保留原紀錄。

## C4 收尾邊界

第一批為相機與托下巴顯示；第二批為六髮型與森林名稱；第三批為本文件用字。收尾要求現行範圍完成並逐項列出相容保留，不能要求 repository 全域不再出現舊字。其他 C 類另批，PAGE2 舊匯入／J12／P5b 繼續暫緩。
