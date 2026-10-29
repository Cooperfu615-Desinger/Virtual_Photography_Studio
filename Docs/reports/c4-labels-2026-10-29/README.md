# C4 第一批中文名稱／說明驗收

2026-10-29，本機驗收通過；未 stage／commit／push。基準 `c5b0d4cdd9189da8bb0524c5a76a0de0a0fdb52c`。

- 正式來源僅三筆 zh／desc 改動。X100V 新名稱、active 托下巴說明、隱藏 legacy 舊版標示；現行 B 區的 support-chin 不動。見規格及決策。
- 修改前固定 90 組基準：修改後所有英文主／衍生輸出、selection、RNG 呼叫數完全相同；收藏序列化讀回公開原文保持。既有收藏不遷移、不回寫。
- 前端全套 2,028／2,028；品質 853／853；聚焦 3／3；Python 43／43；lint、build、sync --check、catalog strict、207 assets 及 production catalog initialization 通過。
- 固定種子 200 筆 strict：0 blocker，輸出報告與前批 B3 保存的同 seed audit 逐字一致。沒有為此改資料或放寬規則。
- 精確 inverse 接回現有回放入口，完整前端包含原歷史鏈；原有歷史基準不修改。新增 before.json.gz 是本批修改前獨立基準，不是重錄舊結果。
- 正式 preview 5175，桌面 1440×1000、手機 390×900：新相機名稱、英文輸出、收藏／回填、舊手勢不重新公開、零水平溢位、零 console/page error。六工作區桌手機另共 12 項通過。截圖已檢視。
- 瀏覽器方法限制：Playwright selectOption 對未 disabled 的原生選項回報「not enabled」，鍵盤途徑也未改值；以檢查 select／option 均未 disabled 後，設定值並觸發標準 change 事件驗證 React 選取流程。收藏及回填使用正常按鈕點擊。未宣稱已驗證作業系統原生下拉彈窗的滑鼠操作，產品 UI 未為測試改寫。
- 本批沒有相容資料庫或生成英文改動，其他未提交工作目錄未操作；正式工作目錄開始時乾淨。保護結果見 protection.json。

證據：各項 .log.gz、before.json.gz、results.json、workspaces.json、桌手機截圖。可重跑 `node scripts/c4_labels_acceptance.mjs`、`node --test webapp/src/lib/engine/c4Labels.test.js`；正式 preview 啟動後 `PLAYWRIGHT_MODULE=<installed-module> node scripts/c4_labels_browser.mjs`。

其他 C 類、PAGE2 舊匯入、J12、P5b 不併入；未提交故沒有本批遠端 CI／部署結果。

交付補記：Cooper 已確認本批驗收通過，授權限定 commit／push；上方未提交為驗收時點紀錄。瀏覽器原生下拉操作限制仍保留，實際 CI／部署結果另行核對。
