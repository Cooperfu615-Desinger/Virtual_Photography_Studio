# CRT outdoor 誤標決策（2026-10-26）

Cooper 核准只移除 CRT 的 outdoor，沿用既有室內規則。實作與驗收契約見 [CRT v1](../specs/scene-semantic-a5-crt-v1.md)，固定完整來源及有序 tags 見 [review JSON](../../scripts/lib/a5CrtReview.json)。

## 成因及追溯

2026-03-14 `f538245813c3120839787a7c8e27371f439ee7a6` 的戶外推論關鍵字包含 deck；hasAny 使用 includes。2026-04-22 `98ad785ecc58312a56276f80798c1c1f1b450774` 新增 CRT，來源含 VCR decks（錄影設備），誤中戶外平台關鍵字。pre-D `17074fbe3850e2e9fea300b36697643913f707a1` 的同一來源仍在；D `5e7ed02952ceea4a2f76b81583c5f783748ff308` 依原樣搬移契約保存 outdoor，並非 D 或前兩批 A5 新增錯誤。

記憶體診斷只在移除 semantic 的副本將 VCR decks 改為 VCR units，即失去 outdoor，其餘標籤保持。正式文本仍保留 VCR decks；錄影機不是應刪內容，加入單字邊界也不能完整處理 deck 的語意歧義。

## 取捨

只修 explicit semantic，避免改共用推論影響其他 deck／舊自訂庫。保留 studio_lighting_scene 的棚光能力及藍灰地板 lyingSurface。使用者已接受室內隨機服裝／自動外套、主體光與既有支撐候選的連帶變化；不新增泳裝特例、不推翻手動服裝、不恢復退場 Pose Composer UI。窗格／百葉窗為既有可選主體光，不新增場景窗戶來源。

前兩批 A5 與 A～E 證據保持歷史用途。CRT 新正式狀態由本批測試負責，歷史比較增加精確逆轉層。其他項目及 P5b 未授權；實作輪原先不得 commit／push，後續限定交付授權見下段。

## 本機驗收結果

獨立 oracle 3,834 案例及 836 候選池通過；868 案例公開輸出、871 案例 selection、492 案例 RNG 有核准連帶變化，均等同固定 Git 引擎只移除 outdoor 的結果。手動 CRT 比基尼、非 CRT 場景、舊收藏原文字、前兩批及 A～E 歷史均有專用保護。瀏覽器舊儲存欄位補齊與修正前相同，不視為此次語意變更。完整結果見 [驗收報告](../reports/scene-semantic-a5-crt-2026-10-26/README.md)。Cooper 已確認本批驗收通過，授權限定提交／push 本批；實際 Git 與該提交 CI 結果另行核對。
