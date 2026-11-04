# 構圖景別：正式站部署後驗收

驗收日期：2026-11-04。此批只歸檔兩輪正式站驗收紀錄與證據，不修改程式、目錄、Prompt 契約或部署設定。

## 結果

六種構圖景別保留有效穿搭，使用者明確設為全無後才移除相應內容。兩輪共 **60 個案例、360 個 Prompt 輸出**通過記錄中的檢查。

| 輪次 | 覆蓋 | 案例 / 輸出 | 詳細紀錄 |
| --- | --- | --- | --- |
| 第一輪 | 桌面 1761×789、手機 390×900；固定套裝保留、全部全無；六景別 × 六輸出 | 24 / 144 | [第一輪](round-1/README.md) |
| 第二輪 | 桌面原生 Chrome 選單；四項獨立單品保留、各項單獨全無、逐項全部清空；六景別 × 六輸出 | 36 / 216 | [第二輪](round-2/README.md) |

六輸出為 Gpt、Z-Image、MIDJOURNEY、Nano Banana 2.1、胸上特寫照、全身角色照；胸上 4:5、全身 9:16 與主 MJ 參數保留。

第一輪的「單品尚未補齊」是當時狀態，已由第二輪原生選單驗收補齊；原始記錄保留。第二輪沒有重新量測 CSS viewport、重跑手機矩陣或擷取 console/page-error logs，不能把第一輪結果當成第二輪新增證據。第一輪記錄的 console warn/error 為空，不宣稱另有獨立 uncaught-page-error 擷取。

## 正式站與交付來源

- [正式網站](https://cooperfu615-desinger.github.io/Virtual_Photography_Studio/)
- 功能 [PR #16](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/pull/16) 已合併；main 合併提交 `b778499bfa93eb20720be963d2f400253a7e3932`。
- 對應 [CI／部署 run 41770763144](https://github.com/Cooperfu615-Desinger/Virtual_Photography_Studio/actions/runs/41770763144) 已在部署階段確認成功；此批歸檔本身沒有再次部署。
- 這是實際瀏覽器操作的結果記錄，不是聲稱可完全重播的固定 seed 測試；未保存 browser runtime seed。每輪以相同固定選值切換景別。

## 證據索引

- 第一輪：[完整輸出](round-1/outputs.json)、[桌面截圖](round-1/desktop.png)、[手機截圖](round-1/mobile.png)。
- 第二輪：[完整輸出](round-2/outputs.json)、[未登入狀態](round-2/auth-state.txt)、[原生選單與輸出狀態](round-2/selected-none-state.txt)、[鞋款全無截圖](round-2/desktop-shoes-none.png)、[單品選單截圖](round-2/single-selectors.png)。
- [檔案 SHA-256 清單](SHA256SUMS)。JSON、PNG 與 TXT 保留原始位元組；第二輪 README 僅修正歸檔後的相對連結。

## 邊界

使用未登入的獨立無痕視窗，未操作真實使用者收藏、未登入、未執行付費生成；測試視窗已關閉。第二輪代表性單品為棉質細肩背心、直筒牛仔褲、羅紋短襪與尖頭細跟高跟鞋，不宣稱窮舉所有目錄、配件與模式，也不以模型畫質作為此功能門檻。

原報告的「僅存暫存／未 commit push」描述驗收當時狀態；本次依授權另行歸檔至獨立文件分支，保留其他 session 的所有修改。既有本機驗收與凍結基準不改寫。

## 文件交付驗證與部署界線

以最新遠端 main `b778499bfa93eb20720be963d2f400253a7e3932` 建立隔離 clone 與 `codex/framing-production-acceptance`。推送前核對唯一 workflow `.github/workflows/deploy.yml`：push 僅匹配 main，PR 指向 main 會執行品質檢查，build/deploy jobs 排除 pull_request；未呼叫 workflow_dispatch。因此本分支 push 與建立 PR 不會啟動該自動部署。未合併，未修改部署設定。

文件交付檢查：檔案完整性、相對連結、JSON 案例與六輸出數量、穿搭存在/不存在、固定比例與 MJ 參數、diff 空白檢查。此次只新增文件與證據，依 AGENTS 文件類型規範不重跑本機程式測試；PR CI 結果另以遠端檢查為準。
