# B3 第一批：角色穿搭共用來源驗收

固定本機與遠端 main：`887b149a42047bbc3bc1adbb45aa0f68c9e5487e`。本批只整理同角色穿搭來源，未 stage／commit／push。本機完整驗收通過。

## 結果與來源責任

33 張角色、134 圖層完成逐筆審閱；118 段同角色原文改成共用引用，16 段用途差異原樣保留。`characterWardrobeSources.js` 集中 layer 原文與 profile 組合配方；`characterProfiles.js` 保留角色身份與原 legacy en，`characterCardLab.js` 保留圖層 metadata／髮型設定與輸出組裝。沒有新增圖層、ID 或 Prompt 文案。

舊 122／12 診斷搜尋所有角色及 legacy en，誤把四筆當成相同來源；現行改為同角色 outfit/accessories 的 118／16。原診斷報告保留。詳見 [逐筆來源表](SOURCE_REVIEW.md)、[規格](../../specs/b3-character-wardrobe-source-v1.md) 與 [決策](../../decisions/2026-10-28-b3-character-wardrobe.md)。

## 固定 Git 與護欄

- PAGE2 2,396 組、PAGE1 815 組，六輸出、選值、RNG 全部與固定 main 一致。
- 66 組 JSON、66 組 Markdown 公開內容及 66 組 ZIP 既有相容結果保持；497 份其他正式來源／程式逐字保護。
- 新來源／消費者 31 項聚焦測試通過；歷史逆轉與組合 8 項通過。缺角色／圖層、跨角色引用、文字漂移、重複 literal、未知引用、錯誤配方等均有回歸。
- 新 strict 入口在正常副本通過；刻意篡改圖層或移除審閱來源均以 CHARACTER_WARDROBE_SOURCE 阻擋。初次隔離副本缺少 source-assets；補齊唯讀連結後三項正式驗收通過，不修改正式資產。

證據：[固定 Git](acceptance/acceptance.json)、[護欄破壞測試](guard/results.json)、`focused.log.gz`、`inverse.log.gz`。

## 完整閘門

| 項目 | 結果 |
| --- | --- |
| 前端測試 | 2,014／2,014 |
| Prompt Quality | 852／852 |
| lint／build | 通過；既有 chunk-size 提示保持 |
| 同 seed 200 strict audit | 修改前後逐字相同，0 blocker／18 既有診斷 |
| JSON sync／schema／歷史 ID | 通過 |
| Python | 43／43 |
| 目錄測試 | 32／32 |
| strict integrity | 通過，2 個既有 J12 允許值、0 blocking／stale |
| 公開資產 | 207 檔通過 |

完整紀錄見 [gates/results.json](gates/results.json)。

## 桌手機驗收

1440×1000／390×900，54 項操作、26 張最終畫面。檢查髮型、眼鏡、純人物、選層、override、六種複製、帶回 PAGE1、收藏原文及重載；另實際選取 Amy／Kaori／Yui，驗證保留差異與純人物切換。巡覽六工作區；無 console／page error、破圖、意外水平溢位或外部 POST。專用 5175 服務已停止。見 [結果](browser/results.json)、[畫面檢視](browser/visual-review.json)。

## 歷史與保護

新 inverse 將六份改動來源精確還原為固定 main，再使用原 PAGE2 acceptance/history 承接 Phase 4、胸上、完整 A2／A1／A5。原 A～E 基準由完整測試與目錄閘門繼續驗證。完整鏈已通過，原 PAGE2／Phase 4／胸上／完整 A2／A1／A5 工具全部成功。見 [回放結果](history/b3-history.json)、[完整紀錄](history/replay.log.gz) 與 [產物索引](history/artifact-index.json)。小型摘要與完整 log 已保存；大份歷史基準衍生副本只記錄 SHA，原件不重錄。

最終保護：3,707 份原追蹤檔僅允許範圍改動，2,217 份歷史檔未變；其他 20 個工作目錄／140 份未提交檔保持。結果見 [保護檢查](protection-final.json)。

## 限制與後續

16 段用途差異不代表本批認定每個視覺細節正確，只是保留既有文字及責任。將來若要修改內容需另訂回歸與新歷史基準。角色完整 legacy en 暫仍保留相容原件。

PAGE2 Markdown／ZIP 匯入與 J12 依 Cooper 指示暫緩；目前舊 PAGE2 ZIP 仍會被解析器拒絕，本批確認錯誤不覆寫收藏，不宣稱成功往返。MJ 名稱與圖片 manifest、C 類與 P5b 不在本批。未呼叫外部生圖模型。

重跑命令與環境見 [規格的正式驗證路徑](../../specs/b3-character-wardrobe-source-v1.md)。
