# DLL_VIDEO Pro／Seedance 2.5 本機驗收

實作日期：2026-10-26–27。工作目錄：`/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio`，分支 `main`，基準 `4e35912f82280c058d0c86b6de3f44fcb019f9df`。

交付補記（2026-10-27）：使用者已授權先 commit/push 到 main，再部署 Firebase Functions。限定本次影片功能及證據，其他80份檔案保留。從 Git 暫存內容匯出的獨立發布副本，前端1,855／1,855、Functions108／108、兩端lint及前端build通過；不含另一批尚未提交的A2測試，所以與下方原工作區1,859項不同。歷史回放需要既有Git物件，補上Git讀取環境後重跑通過。下方未提交／未部署描述為實作驗收當時狀態；實際交付結果以GitHub及Firebase平台紀錄為準。

結果：本機介面與程式檢查通過；未 stage、commit、push、部署或呼叫付費生成。這不是 Seedance 真實生成成功的證據。

## 實作清單

- `webapp/src/App.jsx`／`main.jsx`：新增導覽入口，影片控制器在分頁切換時持續掛載，移除舊全域彈出視窗。
- `webapp/src/components/VideoWorkspace.jsx`／`styles/videoWorkspace.css`：三欄工作區、來源選取／上傳、歷史篩選、預覽／播放／下載、回填設定、額度及響應式排列。
- `webapp/src/lib/videoWorkspaceController.js`／`comfyVideoClient.js`：跨圖片紀錄、不可變設定、來源保留、舊資料相容、帳戶切換隔離、安全續查、Seedance 比例。
- `functions/src/videoModels.json`／`comfyVideo.js`：單圖 Seedance R2V 工作流、參數限制與 token 費用估算；既有模型及下載服務保持。
- `functions/test/seedanceVideo.test.js`／`webapp/src/lib/videoWorkspaceController.test.js`：圖結構、估算、來源／設定還原、失敗歷史、防重送及切換帳戶的回歸。
- [規格](../../specs/dll-video-pro-v1.md)、本資料夾與根目錄 `design-qa.md`。

## 自動檢查

| 項目 | 結果 |
| --- | --- |
| 前端完整 `npm test`，Node 22 | 1,859／1,859 通過（含現有 A2 未提交資料的工作區狀態） |
| 影片控制器專項 | 11／11 通過，包含 pending 寫入失敗時不送出且紀錄為 rejected |
| Functions `npm test`，Node 24 | 108／108 通過 |
| 前端／Functions lint | 通過 |
| 前端 production build | 通過；既有大於 500 kB chunk 提醒仍在 |
| `git diff --check` | 通過 |

日誌保存於本資料夾。測試網路回應採 mock，未使用真實帳號扣額。

## 瀏覽器驗收

入口 `http://127.0.0.1:5175/Virtual_Photography_Studio/`。使用 Codex 內建瀏覽器，桌面 1440×1000、對照 1586×992、手機 390×900，以及 819／821／1099／1101×1000。頁面寬度均不超過 clientWidth；捲軸使截圖可視內容寬度較 viewport 少 15px。欄內捲動為設計行為。

| 覆蓋 | 結果與證據 |
| --- | --- |
| 既有五工作區桌手機導覽 | Prompt、角色、場景、DLL_PIC、Saved Cards 完整載入，無新 console warning/error、橫向溢出或破圖。`desktop-workspaces.png`／`mobile-workspaces.png` 依此順序排列 |
| 既有互動 | 角色卡下一頁／選 Yuna、場景欄位改西門町且輸出更新後回復、Prompt A/C/E/F 面板、設定選單正常。姿勢／抓拍引擎未修改 |
| 圖片 → 新工作區 | 既有 DEV 圖片參數載入已存在的公開參考素材；點「製作影片」後切換至 DLL_VIDEO Pro、來源一致、無 dialog；「選擇 DLL 圖片」回 DLL_PIC |
| 正式頁面本機上傳 | 從檔案選擇器讀取專案公開 AVIF，轉 PNG 顯示；Seedance、動作、運鏡預設可選，未登入時停用送出。`app-desktop.png`／`app-mobile.png` |
| 深淺色 | 共用主題 tokens，文字與控制項可讀；`app-dark.png` |
| 成功與下載（本機模擬） | 真實 View／controller 搭配本機回應，MP4 metadata 5秒、readyState4、無播放錯誤；鍵盤播放後 paused=false。下載完成至 Downloads，ffprobe 確認 5秒、36,286 bytes |
| 回填／同圖 | 按兩項回填後付費提交模擬次數保持 0，必須明確按生成才新增作業 |
| 背景追蹤 | 提交模擬後切換 DLL_PIC、返回時取得完成結果 |
| 不確定／續查 | 第2次提交後 uncertain、設定鎖定；改模擬回應為成功後只續查，提交次數維持2。`desktop-uncertain.png` |
| 失敗／歷史 | 第3次模擬送出失敗，設定保留、原成功結果仍在；手機已完成篩選及歷史選取可用。`mobile-failed.png`／`mobile-history.png` |
| 模型設定 | Wan／MiniMax／Seedance 切換時解析度適配；Seedance 可選30秒／1080p及音訊，MiniMax保留音訊固定說明 |
| 斷點 | `breakpoint-819.png`／`821`／`1099`／`1101`；手機預覽優先、平板紀錄下移、桌面三欄 |

模擬素材為專案公開 `reference/wardrobe/dresses/37_針織長洋裝.avif` 製作的5秒靜態 MP4，不是模型生成影片。模擬額度2,500及估算只用來檢查介面；真實費用公式由 Functions 測試驗證。暫時 `video-qa.html`、`src/videoQa.jsx`、`public/video-qa.mp4` 已移除，不會加入 production build。

## 示意圖比較

`comparison.png` 將核准示意圖與最終同尺寸桌面模擬成功狀態並排比較。保留三欄、藍色主按鈕、大面積播放器、影片紀錄及設定階層；使用專案既有字型、按鈕、主題與原生播放器。

修正過設定欄過長讓送出區落到下方的問題：設定欄改內部捲動、額度／生成區保持可見，桌面額度改為三項橫排。這也讓秒數與解析度回到常用高度；較矮視窗可捲動設定查看音訊，並不遮蓋控制項。最後比較沒有待處理的 P0／P1／P2。

示意圖用橫式咖啡廳人物，驗收用直式公開素材，因此播放器留邊、紀錄縮圖與文字不同；測試頁另有明確模擬標示。原生影片控制列及目前網站導覽位置也與生成示意圖不同，不宣稱逐像素一致。

## 保護範圍與後續

本次開始前既有的80份修改／未追蹤檔均做 SHA-256 比對，內容保持，包括 A2 資料、`webapp/package.json` 及已由其他工作更新的 `Docs/current_project_state.md`。未為此功能改動資料目錄、prompt、套件依賴、Secret或其他工作樹。

仍待：使用者審視介面、授權 Git 交付／Functions部署，以及真實 Seedance 單圖5秒720p的生成、扣額、播放、下載驗收。本機工作目錄未配置 Firebase 登入所需的前端環境，故此次真實服務驗收未執行；不得把模擬結果或舊 Wan／MiniMax 驗收算成本次 Seedance 實測。
