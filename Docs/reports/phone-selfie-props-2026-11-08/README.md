# 手機自拍道具與男友／閨蜜環繞視角驗證

日期：2026-11-08。隔離 main 副本基準：`e43d7d5df6512571a318cf8b18cbb567f6278232`。功能契約 `1.65.0`，規格見 [phone-selfie-props-v1](../../specs/phone-selfie-props-v1.md)。

## 驗證範圍

- 27 個一般站／坐／跪姿 × 2 手機道具 × 6 景別，共 324 組，保留姿勢 ID、手機 ID 與 Grok Imagine 完整來源。
- 六景別檢查主 Z 手機來源只出現一次；Gpt、Nano 與 Grok Imagine 共用來源；全身角色照沿用自然站姿 9:16。
- 固定手部暫停、手機與 companion 衝突、手勢暫停／取消恢復、兩種手機不加入道具隨機池、companion 不加入一般環繞隨機池。
- 新／舊 captureStyle、退役 hand／prop、舊自拍＋其他道具衝突、結構化收藏序列化／還原、接管模式保存後退出恢復 companion。
- 49 組與未修改基準對照：40 個固定種子一般案例、9 個站／坐／跪及既有道具案例，七輸出／選值／structured／summary 完全一致。
- 200 筆 `prompt-quality-baseline` 嚴格稽核前後逐位元一致，0 blocking、24 個既有 diagnostic。
- schema／registry／sync、60 Python tests、32 catalog 工具測試、207 公開資產檢查、歷史精確逆轉、lint、build、完整前端及 Prompt Quality 驗證。

舊凍結 JSON／seals 未重建；新增本批精確雜湊逆轉在隔離測試副本還原原來源。

## 最終檢查

| 檢查 | 結果 |
| --- | --- |
| 完整前端（並行度 2） | 2,238／2,238 通過，無跳過 |
| Prompt Quality（並行度 2） | 925／925 通過，無跳過 |
| lint／build | 通過；建置仍有既有大 chunk 提示 |
| sync --check／catalog strict | 通過；基準 `REGISTRY_BASE_COMMIT=e43d7d5df6512571a318cf8b18cbb567f6278232` |
| Python catalog／sync | 60／60 通過 |
| catalog 工具 | 32／32 通過 |
| 公開資產 | 207 檔通過 |
| strict prompt audit | 200 筆，seed `prompt-quality-baseline`，0 blocking；24 既有 diagnostic；與修改前報告逐位元一致 |
| 歷史來源 seal | 32／32 tracked 來源精確 before／after hash 通過，原歷史 baseline 不變 |
| Markdown／ZIP 往返 | 15 張合成卡 × 2 格式，30／30 通過；206 份公開輸出原文相同 |
| git diff --check | 通過 |

完整前端／品質／瀏覽器在乾淨的 main 隔離副本驗證；不把其他 session 尚未完成的 Saved Cards C／D 實驗併入本批驗收。修改依明確清單交回現行 main，寫入前逐檔確認目的來源仍等於基準，保留目的工作樹其餘未提交內容。

Markdown／ZIP 使用純記憶體合成資料，涵蓋兩手機 × 站坐跪、companion × 站坐跪、兩手機與 companion 衝突、companion 在雙人／固定場景暫停，以及舊自拍／鏡子自拍與咖啡道具衝突。比較現行正規化完整選值，確認公開輸出原文保持；解析器可依既有契約補回缺省欄位。ZIP 未做瀏覽器檔案選擇流程，瀏覽器另完成收藏新增／套用。

- [匯出／匯入驗證日誌](archive-roundtrip.log)
- [最終 49 組既有行為對照](unaffected-comparison.json)：343 份公開輸出與選值／structured／summary 相同，執行前後確認基準來源仍為 e43 原文。
- [修改前嚴格稽核](audit-before.txt)／[修改後嚴格稽核](audit-after.txt)

## 瀏覽器

依程序於 `127.0.0.1:5175` 啟動隔離版本；因既有 origin 已保存其他測試設定，實際互動使用新測試 origin `127.0.0.1:39881`，不讀寫私人收藏。

Chrome 實際 viewport 1440×1000、390×900；另檢視 1152px 桌面狀態。測試自然站姿、自然坐姿、跪坐、四足必要支撐、兩手機、companion 選項、手機／companion 互斥提示、移除拍攝方式、收藏新增與重新套用。六工作區在桌手機逐一巡覽，無 document 橫向溢位，無 console error。

原生下拉的 Playwright selectOption 逾時；改以 CUA 原生 AX setValue 操作並讀回已選值與新 Prompt，未使用 DOM 注入 change。桌手機截圖已目視檢查。未登入帳號、未呼叫付費生成、未部署。

- [桌面手機自拍](phone-selfie-desktop.jpg)
- [桌面 companion 環繞](phone-companion-desktop.jpg)
- [手機衝突提示](phone-selfie-mobile.jpg)

## 限制

文字／相容／介面驗證不代表外部圖像模型已通過姿勢或鏡面幾何驗收。一般手機自拍沿用手機位於畫面外的原設定；固定承重姿勢暫停。純 GPT 敘述回填仍有既有複合姿勢辨識限制；完整選值以結構化收藏與 Markdown／ZIP 選值資料還原，舊卡公開原文不被改寫。
