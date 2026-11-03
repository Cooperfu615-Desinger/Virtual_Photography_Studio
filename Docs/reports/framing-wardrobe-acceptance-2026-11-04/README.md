# 構圖景別穿搭保留：第一階段瀏覽器驗收

日期：2026-11-04（Asia/Taipei）。結論：本機第一階段通過；未驗證正式模型出圖品質。

## 版本與隔離

- 測試提交：`f3a67496`，獨立分支 `codex/framing-wardrobe-retention`，基底 `d469a329`。
- 使用隔離 Git 工作目錄，未切換或修改原 session 分支與既有檔案。
- 網址：`http://127.0.0.1:5175/Virtual_Photography_Studio/`。
- Chrome 新建無痕視窗；未登入雲端、未輸入 API key、未呼叫付費生成。測試後關閉分頁並恢復 viewport。
- 桌面 1440×1000；手機 390×900；保留正常垂直與面板內部捲動。

## 行為結果

| 測項 | 結果 |
| --- | --- |
| 全部全無後指定網狀蕾絲馬甲短裙長靴套裝，再逐一切換六個公開景別 | 六景別 × GPT、Z-Image、MIDJOURNEY、Nano、胸上、全身共 36 份輸出均保留 skirt 與 boots |
| 全身角色照跨六景別 | 文字完全相同，維持 9:16；胸上維持 4:5 |
| 全部全無後逐一切換六景別 | 每景別六輸出皆不加入穿搭段落、替代套裝、裙靴或裸露指令 |
| 全臉景別加入測試收藏、設全無、再套用收藏 | 景別與套裝還原；重新載入後六份輸出與收藏 Detail 中各版本原文逐字一致 |
| DLL 側欄六個來源 | 可逐一選取；完整版胸上來源保留裙靴與 4:5 文字；缺少 key 時生成按鈕停用 |
| 手機收藏 | 空篩選、回到有資料、Compact／Detail 與套用可用 |
| 鍵盤 | 構圖按鈕 Tab 焦點可見 |
| 五工作區 | Prompt、角色、場景、DLL_PIC Pro、Saved Cards 均可切換並渲染；兩尺寸無文件橫向溢出與破圖，無可見控制重疊或文字不可讀 |
| 執行期 | console warning/error 紀錄為空，無觀察到未處理頁面錯誤 |

固定明確穿搭驗收不等於固定隨機 seed 比對。UI 重選近景可重新抽取左右構圖；第一次精確比對誤用較早生成的另一個側向版本，改用實際收藏原文後六輸出全部一致。固定 seed 的行為邊界由既有自動化矩陣負責。

## 自動化基準

此提交保留前一輪已驗證的程式內容；本輪提交前核對檔案雜湊，未再改程式。

- 前端完整測試 1,719／1,719；Prompt Quality 763／763。
- lint、build、git diff --check 通過。
- strict audit：200 案例，seed `prompt-quality-baseline`，0 阻擋／22 既有診斷，與修改前相同。
- 使用 Node TAP reporter；預設 reporter 的測試執行器問題已在舊版重現。
- 原歷史快照／雜湊保留，以精確逆向差異驗證穿搭變更範圍。

## 文件差異與範圍

舊版 visual-validation 與 AGENTS 的五工作區清單仍列獨立「動作姿勢」，目前實際導覽已退役該頁並包含 DLL_PIC Pro；依 current_project_state 與測試提交實際介面驗收五個現行工作區。Saved Cards 的舊來源篩選仍保留，不視為獨立導覽頁。

此次未更動 UI 配置，因此保存最終截圖，未重置共享工作區製作 before 圖。此驗收是受影響流程與五工作區 smoke，不宣稱測試每個工作區全部功能、所有舊收藏格式、真實雲端或外部生成結果。

## 證據

- [逐項 DOM 輸出、尺寸與收藏精確比對](results.json)
- [桌面構圖](desktop-prompt.png)、[手機構圖](mobile-prompt.png)
- 角色：[桌面](desktop-character.png)、[手機](mobile-character.png)
- 場景：[桌面](desktop-scene.png)、[手機](mobile-scene.png)
- DLL：[桌面](desktop-dll.png)、[手機](mobile-dll.png)
- 收藏：[桌面](desktop-saved.png)、[手機](mobile-saved.png)、[收藏 GPT 展開](saved-gpt-detail.png)

## 交付邊界

遠端 Pages 設定為 workflow，source 為 main；唯一 Actions 工作流程只在 main push、目標 main 的 PR 或手動觸發時執行。獨立分支 push 不觸發該部署，推送後分支 Actions 清單為空。未建立 PR、未合併、未部署。

後續正式模型出圖與使用者接受仍須獨立完成；Prompt 保留穿搭不保證外部模型的衣物、裁切與構圖表現。
