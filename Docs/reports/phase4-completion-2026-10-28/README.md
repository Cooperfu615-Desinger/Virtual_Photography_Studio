# Phase 4 整體結案與交付

2026-10-28。原分析報告 A1–A7 與已核准的 A2 相依功能均已完成實作及逐批驗收。本頁為現行狀態入口；22 筆實作提交的 CI 全數成功，最終歷史鏈與保護檢查已通過，收尾依授權提交／push。使用者已授權全部順序交付，不另設逐批確認門檻。原始問題報告、各批基準與當時驗收紀錄保持。

## 已完成內容

| 項目 | 現行結果 | 規格／證據 |
| --- | --- | --- |
| A1 成年身份 | PAGE1 33 卡的主 GPT、胸上、全身保留來源成年身份；PAGE2 不在原 A1 範圍 | [規格](../../specs/character-adult-identity-a1-v1.md) |
| A2 穿搭控制語與相容 | 24 連身、40 套裝、一筆膠帶控制語；三種 runtime 色句；舊 Markdown 配色、完整快照、特殊穿搭色系、抓拍上下配色、舊連身結構化／純文字還原、胸上／主工作台近景均完成 | [近景決策](../../decisions/2026-10-28-phase4-a2-main.md)、[主工作台驗收](a2-main/README.md)、[胸上驗收](../chest-dress-region-a2-2026-10-28/README.md) |
| A3 其他控制語 | 三筆棚光、PAGE3 匯入來源標籤、赤腳鎖定語只保留可視描述 | [規格](../../specs/phase4-a3-public-language-v1.md)、[驗收](a3/README.md) |
| A4 固定配色 | 十二套保留作者固定色；UI／摘要／輸出採一致有效配色 | [規格](../../specs/phase4-a4-fixed-palettes-v1.md)、[驗收](a4/README.md) |
| A5 場景語意 | 原 31 筆為 27 修正、4 核准保留、0 待決；位置與背景／遮蔽分工明確 | [狀態表](../../decisions/2026-10-26-a5-closure-review.md)、[十一筆驗收](a5/README.md) |
| A6 光線相容 | 14 棚、6 地下、兩背景棚光及固定構圖候選修正；明確 lock／運輸手動例外保留 | [規格](../../specs/phase4-a6-lighting-compatibility-v1.md)、[驗收](a6/README.md) |
| A7 角色方向 | 33 卡逐筆重審，21 公開投影、12 保留；角色原件不變 | [規格](../../specs/phase4-a7-character-direction-v1.md)、[驗收](a7/README.md) |

A2 各階段逐一交付的對應規格可從 [現行狀態](../../current_project_state.md) 歷史段落追溯；下列 SHA／CI 是實際交付證據。原規格中的「另批／未提交」均指當時狀態，不是現在尚未完成。

## Git 與 CI

所有下列提交均為目前 main 祖先；核對資料見 [deliveries.json](closure/deliveries.json)。每批 CI 全數成功後才推送下一批；Git push、CI、原流程 GitHub Pages deploy 分開確認。收尾提交自己的 CI 在交付後另行回報，不預先宣稱成功。

| 批次 | main 提交 | CI |
| --- | --- | --- |
| A1 成年身份 | `4e35912f` | [40333305307: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40333305307) |
| A2 24 連身 | `048a2348` | [40428865890: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40428865890) |
| A2 40 套裝 | `471115c0` | [40435739534: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40435739534) |
| A2 舊 Markdown 配色 | `943ab65f` | [40447550558: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40447550558) |
| A2 PAGE1 完整快照 | `3a18fc2c` | [40459578297: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40459578297) |
| A2 膠帶特殊穿搭 | `bd31bd34` | [40473824417: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40473824417) |
| A2 runtime 色句 | `15580949` | [40488482139: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40488482139) |
| A2 特殊穿搭保留色系 | `58516b20` | [40503539655: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40503539655) |
| A2 抓拍上下配色 | `0babbebb` | [40510094999: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40510094999) |
| A2 舊連身結構化 | `2caa6fdc` | [40522113721: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40522113721) |
| A2 舊連身純文字 | `9a0c4f2d` | [40620617902: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40620617902) |
| A2 胸上投影 | `ae57e343` | [40632928103: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40632928103) |
| A2 主工作台投影 | `8bbc6056` | [40634606533: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40634606533) |
| A3 公開控制語 | `37f24aa8` | [40635766241: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40635766241) |
| A4 固定配色 | `74316be0` | [40636880280: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40636880280) |
| A5 三筆 | `22d1103e` | [40259955650: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40259955650) |
| A5 commercial | `321404ec` | [40265867218: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40265867218) |
| A5 CRT | `5110401f` | [40275779631: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40275779631) |
| A5 西門町 | `ffb2e91e` | [40294656608: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40294656608) |
| A5 十一筆位置 | `6fc0517e` | [40638180863: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40638180863) |
| A6 光線相容 | `1361dd21` | [40639915392: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40639915392) |
| A7 角色方向 | `4ad709f1` | [40641115076: success](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/40641115076) |

## 現行驗收與歷史回放

- 最終產品來源為 A7 `4ad709f1`，收尾只增文件及檢查工具；A7 [完整閘門](a7/gates-latest.json)為前端 2,001、Prompt Quality 843、Python 43、目錄 32、lint／build／sync／schema／歷史 ID／strict／207 assets 全通過。200 個同 seed audit：0 blocker、18 既有診斷，A7 前後逐字相同。A5／A6 候選改動造成的核准輸出差異各有固定 Git 獨立 oracle，不把選光改變藏成「完全相同」。
- A2 主工作台 9,606 次生成；A3 1,440；A4 6,232；A5 5,940；A6 14,818（含 11,396 候選池／10,292 固定選取驗證）；A7 6,240。各批案例、舊新往返與 RNG 比較見相應 acceptance.json 及 baseline.json.gz。
- 六輸出、原文複製、套用／生成、收藏、Markdown／ZIP、重載、抓拍／重抽／明確重新匯入在各批分別驗證。最後 A7 [桌手機結果](a7/browser/results.json)為 1440×1000、390×900，38 操作／20 畫面、六工作區；0 console／page error、外部 POST、意外頁面溢位。已人工檢視桌面 Nana 與手機 Sakura 畫面。本次專用 5175 驗收服務已停止，埠已釋放。
- [最終來源審計](closure/final-source-audit.json)：539 筆正式穿搭英文不含列管配色控制語；舊 aliases 保留。十二固定色／十一位置與逐筆審查精確一致；原角色卡來源逐字相同。28 個逆轉來源與固定 Git ae57e343 完全一致，9 個已知新增程式／測試只在隔離副本移除。[原子失敗／混合／缺失測試](closure/inverse-tests.log.gz)通過。
- [完整歷史鏈](closure/history-summary.json)已通過：43 份新回放證據、6 層 inverseExact 成功紀錄（其中最新三層列出 45 份固定 Git 逐檔核對），所有 oracle mismatch／未核准差異為 0。原工具、原 expectedHash、原報告不重錄。各層隔離還原後先逐字比對固定 Git，再執行上一層原工具，完整回到 A2、A1、四批 A5；A corpus／ordered snapshots、E 的 22 表＋2 常數／1,098 還原及 B／C／D 護欄由完整閘門另外驗證。
- [保護結果](closure/protection.json)在提交前再次核對：其他工作目錄、未提交內容、原歷史證據與已交付本批報告均不改。現行工作目錄為既有 main checkout；專案主路徑的另一分支及 dirty work 原樣保留。

重跑使用 Node 22：`node scripts/phase4_closure_check.mjs Docs/reports/phase4-completion-2026-10-28/closure/rerun-日期/final-source-audit.json`；隔離歷史鏈 `node scripts/phase4_history.mjs <新的允許輸出目錄>`；完整閘門 `python3 scripts/phase4_gates.py <新的階段名稱> <審閱完整SHA>`。輸出應使用新的目錄或外部暫存路徑，不能覆寫已交付證據。歷史工具需要原 Git 物件與 node_modules，不能把無 .git 的 archive 當完整開發環境。

## 保留的限制與後續

[收尾決策](../../decisions/2026-10-28-phase4-closure.md)列明所有保留理由。舊卡公開原文與凍結抓拍來源不追溯改寫；文字還原不能恢復未編碼的任意選值；UI 對不相容光線的既有清除政策保持。A7 精確來源表遇新文案需重新審閱。18 個既有 audit 診斷保留作診斷，不用擴大修改來清零。strict 仍有 J12 的兩項既有允許值、0 blocking／0 stale；其餘啟發式提示和既有 Vite chunk-size warning 不冒充新回歸。

Phase 4 範圍內沒有剩餘實作項。P5b 繼續暫緩；B3、J12、PAGE2 身份覆蓋及 C 類內容／分佈／命名議題仍是獨立後續。未呼叫付費模型、未手動部署 Firebase Functions；文字及瀏覽器驗收不等同實際生圖品質保證。
