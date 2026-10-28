# PAGE2 GPT／Z 成年身份補齊：本機驗收

2026-10-28。可信本機／遠端 main 基準 `bfc2d5baafc8aaede8f774527d0f1aaa187da27f`。僅本機實作，未 stage／commit／push；J12、B3、C 類與 P5b 未進入。本機完整驗收已通過，待使用者驗收；尚未產生本批 CI。

## 產品結果與範圍

33 張角色的 PAGE2 GPT／Z 新生成內容保留原 `identityAndBody` 成年身份；32 張 East Asian、Eleanor demonic，不從卡名推測。GPT 完整 legacy fallback 不重複；缺來源不猜。其他四個 PAGE2 輸出、PAGE1 六輸出、穿搭圖層、角色來源、原儲存文字與選值保持。

[規格](../../specs/page2-adult-identity-v1.md) · [決策](../../decisions/2026-10-28-page2-adult-identity.md) · [固定 Git 對照](acceptance/acceptance.json) · [閘門](gates/results.json) · [桌手機](browser/results.json)

## 固定 Git 對照

- 2,396 組 PAGE2：33 卡、全部相容髮型、三種眼鏡、全套／純人物／選層、每個單獨圖層及臨時文字。兩種輸出只允許來源身份插入；其他四個輸出逐字保持，0 核准外差異。
- 452 組 PAGE1：角色變體套用、所有景別、普通單／雙人、角色抓拍／重抽與全身來源匯入。完整六輸出、選值及 RNG 不變。
- 66 組舊／新 JSON 公開原文與結構化變體保持；66 份 Markdown 下載內容保持；66 組 ZIP 匯入失敗結果與固定 Git 相同。
- 496 份其他正式資料／程式逐字等於固定 Git。`acceptance/baseline.json.gz` 保存來源、修改前後結果、舊收藏及案例雜湊。
- 先新增失敗回歸：6 項中 4 項重現缺口；修正後聚焦 36／36。新增 inverse 與既有兩層共 6 項拒絕竄改／缺檔／混合／Git 目錄測試通過。

## 完整閘門

| 檢查 | 結果 |
| --- | --- |
| 前端 | 2,009／2,009 |
| Prompt Quality | 849／849 |
| lint／build | 通過；既有 Vite chunk-size 提示保持 |
| 同 seed 200 strict audit | 與修改前逐字相同，0 blocker／18 既有診斷 |
| JSON sync／schema／歷史 ID | 通過；以本批固定 main 作 REGISTRY_BASE_COMMIT |
| Python | 43／43 |
| 目錄工具 | 32／32 |
| strict integrity | 2 個既有 J12 允許值，0 blocking／0 stale |
| 公開資產 | 207 檔通過 |

第一次全套暴露新 inverse 未銜接舊純來源與部分副本測試；已修正新回放層並重跑完整 2,009 項。沒有放寬舊斷言或改寫基準，失敗摘要保留於 `gates/initial-failure.json`。

## 瀏覽器驗收

1440×1000／390×900，42 項操作、20 張最終畫面；檢查預設／髮型／眼鏡／純人物／單層／override、六種複製、匯回 PAGE1、收藏新舊文字、單張下載、ZIP 既有錯誤、重載及 Eleanor。巡覽 Prompt、角色、場景、DLL_PIC、DLL_VIDEO、Saved Cards 六工作區；沒有 console／page error、破圖、意外水平溢位或外部 POST。關鍵桌手機與收藏畫面已人工檢視，見 `browser/visual-review.json`。

## 保留限制

PAGE2 Markdown 使用 `GPT Prompt`，既有 PAGE1 解析器不接受；ZIP 也走該解析器。固定 Git 與本批均回報 `missing required markdown sections`，介面顯示「ZIP 格式錯誤，無法匯入 Favorites」。本批確認錯誤處理不覆寫收藏、JSON 原文／重載與單張下載正常；不宣稱 PAGE2 Markdown／ZIP 能成功往返。單張下載與 ZIP 排版本來不同，六份公開內容各自保持。此格式相容問題另批，不在成年身份修正中實作。

未呼叫外部圖像模型，文字／瀏覽器驗收不代表實際出圖評估。既有 PAGE2 攝影方向與穿搭文案保持。

## 重跑

在本批 main 工作目錄，使用 Node 22，先確保 Node／npm 在 PATH：

```sh
node scripts/page2_adult_identity_acceptance.mjs /tmp/page2-adult-acceptance
node scripts/page2_adult_identity_history.mjs /tmp/page2-adult-history
python3 -B scripts/page2_adult_identity_gates.py /tmp/page2-adult-gates
python3 -B scripts/page2_adult_identity_protection.py Docs/reports/page2-adult-identity-2026-10-28/protection-before.json /tmp/page2-adult-protection.json
```

瀏覽器：在 webapp 執行 `npm run dev -- --host 127.0.0.1 --port 5175 --strictPort`，再由 root 執行 `node scripts/page2_adult_identity_browser.mjs /tmp/page2-adult-browser /tmp/page2-adult-acceptance/baseline.json.gz`；若 playwright 不在預設解析位置，設定 `PLAYWRIGHT_MODULE` 為已安裝套件的 `index.mjs`。此工具使用隔離瀏覽器及本機資料，結束後停止自己的服務。

## 歷史回放與保護

本批新 inverse 還原 `characterCardLab.js`、品質入口與回放接線，逐檔對照固定 Git；再由原 `phase4_history.mjs` 續跑胸上、完整 A2／A1／A5 歷史鏈。A～E corpus／有序快照／22 表＋2 常數與 1,098 還原由完整前端及目錄閘門檢查。原 `phase4Patches.json` 及所有歷史報告不改。

完整隔離歷史鏈已通過，新 inverse 三份來源精確等於固定 main，原 Phase 4、胸上、完整 A2／A1／四批 A5 工具皆成功。見 [本批回放](history/page2-history.json)、[Phase 4 回放](history/history.json)、[完整回放紀錄](history/replay.log.gz) 及 [產物索引](history/artifact-index.json)。保留所有小型摘要與完整 log；較大的既有基準衍生副本僅記錄 SHA，不重複加入 repository。完整本機輸出位於 `/tmp/vps-page2-adult/history`，可由原指令重建。

最終保護檢查：3,625 份原追蹤檔僅本批五份允許變動，2,145 份歷史檔未變；其他 20 個工作目錄／140 份未提交檔與既有失效工作目錄登記保持。未 stage、commit 或 push，詳見 [保護結果](protection-final.json)。本批 5175 服務已停止；最後唯讀核對遠端 main 仍為本批固定基準，見 [清理紀錄](service-cleanup.json)。
