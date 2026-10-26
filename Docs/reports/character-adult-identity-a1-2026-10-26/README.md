# Phase 4 A1：PAGE1 角色卡成年身份

基準 main：`ffb2e91e61787159d7dbc724dc0129e87537dfcb`。日期：2026-10-26。A1 本機實作與驗證完成，使用者已授權限定提交／push；實際 Git 與 CI 結果另行核對。

A5 收尾已按使用者授權推送；[CI 40294656608](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40294656608) 的品質、建置、部署均成功。A1 是另一批，不能使用 A5 的成功 CI 代替 A1 驗收。

## 產品結果與差異

33 張正式角色卡的 PAGE1 主 GPT、胸上及全身角色照都補回來源成年身份，0/99 → 99/99。只改 engine 兩個結構化分支；每個適用輸出只增加一個原身份句。32 張 East Asian、Eleanor demonic 保持各自來源。既有句首格式、四錨點、body、頭髮、穿搭、場景、攝影與所有 ID／資料不變。

固定 Git oracle 依卡名和 Facial geometry 間的精確位置加入原來源句，逐欄比較完整 prompt（只排除頂層 id／date）與 RNG。1,273 個案例包含所有 33 卡／兩種衣著模式／11 景別、固定構圖、抓拍、舊收藏重生與一般／雙人／專用主體；0 超出核准差異。66 組 PAGE2 bundle、66 份舊 JSON／Markdown、五種一般人物匯入／重抽／明確重匯入流程不變。

角色卡抓拍與一般全身匯入分開驗證；本批不擴充匯入資格。PAGE2 自有 GPT／Z 的成年身份覆蓋另列待評估，不宣稱全站輸出都已處理。

## 可重跑驗收

於專案根目錄、Node 22：

```sh
node --test webapp/src/lib/engine/characterAdultIdentity.test.js
node scripts/character_adult_identity_acceptance.mjs /tmp/a1-review
node scripts/character_adult_identity_history.mjs /tmp/a1-history-review
node scripts/validate_prompt_logic.mjs 200 prompt-quality-baseline --strict --json
```

於 webapp：`npm test`、`npm run test:prompt-quality`、`npm run lint`、`npm run build`。

桌手機先依既有規範啟動 5175，本機獨立瀏覽器：

```sh
node scripts/character_adult_identity_browser.mjs /tmp/a1-browser
node scripts/catalog_baseline_browser.mjs 'http://127.0.0.1:5175/Virtual_Photography_Studio/?dllAcceptance=1' /tmp/a1-browser-general
```

使用現有 Playwright，可用 `PLAYWRIGHT_MODULE` 指定；不得把本機驗收工具用於外部模型提交。這些命令的預設／建議輸出均為暫存路徑，不覆寫本報告。

## 證據

- `baseline-and-saved.json.gz`：固定 Git 修正前／後 33 卡與舊收藏原文。
- `acceptance.json`：1,273 案例的完整差異檢查、來源／結果雜湊、RNG 與相容統計。
- `audit-before.json`／`audit-after.json`／`audit-comparison.json`：同 seed 200，比較只排除 findings 的 runtime promptId。
- `history/`：原四批 A5 工具隔離重播結果；A～E corpus 仍由原驗收套件核對。
- `before-protection.json`、後續完整性清單：既有檔案及其他工作目錄的保護證據。
- `logs/`：先失敗回歸、完整與聚焦驗收紀錄。第一次全套中舊快照因 A1 增句失敗；最終結果另檔保存，不重錄原 snapshot。

## 最終驗證結果

| 閘門 | 結果 |
| --- | --- |
| A1 聚焦／先失敗反證 | 5/5 通過；精確 pre-A1 版本的三個身份回歸均失敗 |
| 完整前端 | 1,851/1,851 通過 |
| Prompt Quality | 759/759 通過，含 A1 回歸 |
| Lint／正式 build | 通過 |
| 同步／歷史 ID／strict 完整性 | 通過，資料保持原樣 |
| 同 seed 200 audit | 排除 findings[].promptId 後相等；0 blocker、18 既有診斷 |
| 原四批 A5 回放 | 西門町 3,834／CRT 3,834／commercial 3,804／首批 1,740，0 oracle mismatch；另兩批各 2 個匯入案例 |
| 三份共用歷史矩陣 | 6,373 次生成、12,058 次重用；保留原 6,370／11,934 門檻 |
| 瀏覽器 | 1440×1000、390×900；36 項檢查、16 張已檢視畫面；0 錯誤／外部 POST／意外橫向溢出 |
| 其他工作 | 20 個工作目錄的 140 份未提交檔案及狀態不變 |

`validation.json` 與 `browser-review.json` 為結果索引；`change-inventory.json` 限定本批範圍，`protection.json` 與 `evidence-sha256.json` 保護歷史及本批證據。

歷史測試轉接一度將三份共用矩陣拆開，原案例／重用數護欄正確擋下；已改為同一隔離模組圖、在非同步註冊測試前啟用快取，原門檻保持，最終全套通過。早期失敗 log 留作診斷，完成狀態只依 `*-passed.txt`／`*-final.txt` 中 validation.json 指定的檔案。

本機 5175 驗收服務已關閉。未進行外部模型生圖，使用者後續已授權僅提交並 push A1；Git 及該提交 CI 結果另行核對，其他項目及 P5b 未開始。

提交前僅清除文字 log 的行尾空白與多餘檔尾空行，原始位元組保留於 `delivery-raw-logs.json.gz`；前後 SHA 見 `delivery-checks.json`，不改驗收結果或歷史基準。
