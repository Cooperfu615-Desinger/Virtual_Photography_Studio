# 新 session 入口與新增內容指南收尾

日期：2026-11-01
範圍：文件維護；對齊 main `eef77871e840459efce50b51e198c90108bcfad4`。
狀態：本機文件驗收；待使用者驗收，尚未提交／推送。

## 問題與決定

Catalog A～E 已切換為 JSON 正式來源，但入口仍夾有舊維護指示：人物指南把新動作導向退役 Pose Composer、把角色身份來源列在 engine.js；部分指南仍列七份生成物或過期絕對路徑；共用驗收清單缺 DLL_VIDEO。根目錄名稱也不能代表分支版本。

本次新增 [session 導引](../session_onboarding.md)，由 AGENTS／README／current state 導入，維持必讀順序：工作目錄與 Git 核對 → AGENTS → current state → 導引 → 領域編寫指南與適用專屬規格。無須預讀全部歷史。

| 領域 | 本次確認的維護責任 |
| --- | --- |
| 一般單品、人物目錄、地點、光線、攝影目錄 | Catalog index 列管 JSON；ID registry、layout、semantic、schema 與八份生成物依既有契約 |
| 現行指定動作 | specifiedActions.js；手動可見性、說明、支撐、接管及隨機資格分開審閱 |
| 手勢、視線、拍攝方式、頭部 | gazeGesture.js／headPosture.js 與實際 UI／狀態轉換 |
| 角色身份與穿搭 | characterProfiles.js／characterWardrobeSources.js；PAGE2 圖層、MJ 簡稱及圖片責任依 B3 |
| 固定場景／PAGE3 | fixedCompositionOptions／fixedScenePose 及 station／carriage 模組；PAGE3 自己的資料與還原流程 |

這是來源核對與指引修正，不搬移來源，不更改產品、Prompt、ID、抽樣、收藏或原有相容優先權。不因新增動作就自動標成 accepted；也不把 catalog registry 擴充到無關的 code-defined 來源。

## 歷史效力

- 四份領域指南的舊日期、章節字母與批次數量保留，但以頁首現行導引、current state 及專屬核准規格判定今天的維護方法。
- 人物指南舊矩陣和 specified-actions v1／v2 保留追溯用途；不是現行公開選單。舊 Pose Composer 控制不重新公開。
- Catalog 固定 pre-D／pre-E 基準及歷史回放命令不改；一般新增另選本次可信任完整 SHA，不能複製過期日常範例。
- 所有既有報告、基準、舊收藏原文與瀏覽器限制紀錄保留；本批沒有重錄任何歷史證據。

## 驗收與排除

文件驗收為路徑／連結、來源責任、入口順序、過期文字與 Git 變更範圍檢查，另以修改前雜湊比對保護歷史與其他 worktree。結果見 [驗收報告](../reports/session-authoring-entry-2026-11-01/README.md)。

六工作區清單依現行 App 導航補 DLL_VIDEO，不新增付費生成、私人任務或全面產品重驗授權。本次不執行產品測試、build、瀏覽器、模型生成、CI／部署；文件檢查不冒充這些驗收。

Saved Cards 持久化 B、PAGE2 舊匯入、J12、P5b 均不併入，艾爾莎隨機政策及其他保留決策不變。未授權 stage／commit／push。
