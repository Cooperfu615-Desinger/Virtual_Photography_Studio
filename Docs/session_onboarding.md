# 新 session 入口與新增內容導引

更新：2026-11-01。對照 main `eef77871e840459efce50b51e198c90108bcfad4`。本文件整理現行入口，不新增產品行為、內容或遷移授權。

## 1. 先確認實際工作目錄

每個 session 先唯讀核對所在目錄、分支、HEAD、工作區差異與 worktree 清單，再判斷讀到的文件是否屬於本次指定版本：

```sh
pwd
git branch --show-current
git rev-parse HEAD
git status --short
git worktree list
```

若任務要求最新 main，另核對遠端 main；無法連線時明列未確認，不把本機 origin/main 快取當成已查證遠端。檢查本身不授權 pull、切換分支、reset、清理或覆寫其他工作。

本輪觀察（僅為 2026-11-01 快照，不是永久路徑規則）：

| 位置 | 當時分支／用途 |
| --- | --- |
| `/Users/cooperfu/.codex/worktrees/moss-optional-lora/Virtual_Photography_Studio` | main，這輪新版文件與已交付產品所在工作目錄 |
| `/Users/cooperfu/Projects/Virtual_Photography_Studio` | codex/shirt-black-bottom，較舊分支，另有未提交內容 |

新 session 應選擇已確認的 main 工作目錄，不能因資料夾名稱相同就推定版本一致。若目前開錯目錄，先回報實際位置與差異，再使用已核對的工作目錄；不要改動舊分支來「同步文件」。未來位置可變，始終以實際 Git 狀態為準。

## 2. 必讀順序與文件效力

1. [根 AGENTS](../AGENTS.md)：開發範圍、相容邊界、驗收與提交授權。
2. [current_project_state](current_project_state.md)：最新交付、排除範圍與各領域現行入口。上方新狀態承接下方歷史紀錄。
3. 本導引：選擇下表與任務相符的維護來源。
4. 涉及一般目錄或舊映射時，讀 [Catalog 操作指南](../knowledge_base/catalog/README.md)，再讀對應領域的編寫指南。
5. 讀該功能的現行專屬規格與實際程式／資料；有明確範圍後才選驗收案例。Prompt 變更另讀 [PAGE1 輸出指南](specs/page1-single-prompt-compression-guide.md)、[輸出契約](../webapp/src/lib/engine/promptOutputContracts.js)、[代表案例](../webapp/src/lib/engine/representativePromptFixtures.js)。

不要求開工前讀完整歷史。只有現行文件不足以解釋特定來源時，才查 conversation_handoff、舊決策或對應歷史報告。

日期補記、舊規格與驗收報告保留當時數量、SHA、命令與「待驗收／未提交」文字，不能直接當作目前狀態。現行專屬核准契約優先於一般指南的舊範例；有衝突時先核對 current state、專屬規格及程式證據，不自行變更產品決策。編寫指南檔名 A／B／C／D 是歷史領域分組，不保證等於目前 PAGE1 畫面區段字母。

## 3. 依內容選入口

| 想新增或修改的內容 | 先讀 | 正式維護入口／邊界 |
| --- | --- | --- |
| 一般單品、套裝、連身、配件 | [穿搭指南](specs/wardrobe-section-b-authoring-guide.md)、[C2 編寫政策](specs/c2-authoring-length-policy-v1.md) | `knowledge_base/catalog/Wardrobe/` 中 index 列管的分類；配色／固定色／材質責任寫在各筆 metadata，不能用控制句混入英文 |
| 現行單人指定動作 | [神情姿態 v2](specs/expression-pose-v2.md)、[現行介面](specs/pose-ui-v2.md)、[C3 說明與隱藏規則](specs/c3-pose-description-visibility-v1.md)，再讀對應姿勢家族規格 | [specifiedActions.js](../webapp/src/lib/engine/specifiedActions.js)：ID、clauses、descriptionZh、接管／支撐及驗收狀態；不可新增到退役 Pose Composer 或舊 specialActionId 當作公開入口 |
| 手勢、視線、頭部、拍攝方式 | [現行介面](specs/pose-ui-v2.md)、[人物指南現行入口](specs/character-section-a-authoring-guide.md) | [gazeGesture.js](../webapp/src/lib/engine/gazeGesture.js)、[headPosture.js](../webapp/src/lib/engine/headPosture.js)，並核對實際 UI 與狀態轉換；沿用既有接管／互斥 |
| 一般地點／場景、環境光、人物主光 | [場景指南](specs/scene-section-c-authoring-guide.md)、[C2 政策](specs/c2-authoring-length-policy-v1.md) | `catalog/Locations/`、`catalog/CameraLighting/`；正式 meta.semantic 與專用欄位需人工審閱 |
| 固定場景及人物位置 | [場景指南](specs/scene-section-c-authoring-guide.md)、對應[車站](specs/station-fixed-composition-v1.md)／[車廂](specs/japanese-carriage-fixed-composition-v1.md)規格 | [fixedCompositionOptions.js](../webapp/src/lib/engine/fixedCompositionOptions.js) 及其 station／carriage 來源、[fixedScenePose.js](../webapp/src/lib/engine/fixedScenePose.js)；不是只增加 Locations JSON 就完成 |
| PAGE3 場景建模 | [場景指南](specs/scene-section-c-authoring-guide.md)，再由現行資料與還原流程定位專屬規格 | [page3WorldScenes.js](../webapp/src/data/page3WorldScenes.js)、[page3WorldScene.js](../webapp/src/lib/page3WorldScene.js)、[page3SavedCard.js](../webapp/src/features/page3/page3SavedCard.js)；與 PAGE1 一般地點目錄分開 |
| 體態、五官、膚質、髮型等一般人物選項 | [人物指南](specs/character-section-a-authoring-guide.md) | `catalog/Character/`；新增五官時另核對 MJ／Nano 等實際投影責任 |
| 角色卡、角色專屬穿搭圖層 | [B3 維護責任](specs/b3-maintenance-ownership-v1.md)、[角色身份規格](specs/character-card-facial-identity.md) | [characterProfiles.js](../webapp/src/lib/engine/characterProfiles.js) 管身份；[characterWardrobeSources.js](../webapp/src/lib/engine/characterWardrobeSources.js) 管共用穿搭；characterCardLab 管 PAGE2 圖層，MJ 簡稱與圖片 manifest 分工保持 |
| 攝影風格、鏡頭、成像／光學 | [攝影指南](specs/photography-section-d-authoring-guide.md)、[C7 配對](specs/c7-capture-pairing-v1.md) | `catalog/Regional/`、`catalog/CameraLighting/`；舊相機 profile 不重新公開；人工與隨機選值的既有優先權不變 |

指定動作家族可查[站姿](specs/pose-library-standing-v1.md)、[蹲姿](specs/pose-library-squatting-v1.md)、[坐／跪](specs/pose-library-sitting-kneeling-v1.md)、[躺姿](specs/pose-library-lying-v1.md)。這些文件的歷史數量與待辦仍須對照現行來源；不能因新增一筆就自動標成 accepted 或加入隨機。每筆審閱說明、部位投影、手部／頭部接管、支撐、適用鏡位、手動可見性與隨機資格，逐項保留證據。

## 4. 一般目錄新增流程

1. 先確認有新增需求，並核對是否已有同用途條目；一般字數診斷不是自動刪減或補字理由。
2. 由 catalog/index.json 找正式分類；保留既有排序、ID、有序 aliases。新增 `<group>:<分類slug>:<英文-kebab-case>` 永久 ID，登記 id_registry 的 active 與決策來源，維護 index 的 layout ID 位置。
3. 審閱 zh／en／desc、meta.semantic 及領域專用 metadata。只有新增欄位或改變允許範圍才調整 schema／field_mapping，不能為單筆變更放寬驗證。
4. 名稱／英文調整時核對舊名稱、完整舊英文 alias、舊 ID、圖片 manifest 及 Saved Cards 還原；不重寫舊收藏原文。管理映射寫在 legacy_mappings.json，runtime 解析行為仍在 engine。
5. 選取並記錄本次受信任的完整基準 SHA；執行 sync 與 check，核對八份生成物。六份 Markdown、database.json 與 legacyMappings.json 不手改。
6. 依 AGENTS 與專屬規格跑對應測試、同 seed 比較、歷史回放、資產／瀏覽器驗收；已封存基準不重錄，新行為另建有理由的驗收。

非 catalog 的指定動作／角色／固定場景，依其 source owner 維護，不為「統一」強搬進 JSON 或登記到不屬於它的 catalog registry。這也不代表可免除 ID、相容、輸出與 UI 驗收。

## 5. 驗收與暫緩界線

共用畫面驗收對照 [frontend-visual-validation](specs/frontend-visual-validation.md) 的六工作區：Prompt、角色、場景、DLL_PIC、DLL_VIDEO、Saved Cards。動作與觀察式抓拍是 Prompt 內模式。瀏覽器檢查、模型生成效果、付費生成、原生 App 與 CI／部署是不同證據，不互相代替。

本次導引不重新開啟 PAGE2 舊匯入、J12、P5b、已確認保留的內容或 Saved Cards 持久化 B。Saved Cards A 已交付，ZIP Unicode 缺口保留；新 session 依使用者具體任務決定範圍。

## 6. 新 session 開場範例

「請先唯讀核對工作目錄、分支、HEAD 與 Git 狀態，確認是本次指定的最新 main。閱讀 AGENTS.md、Docs/current_project_state.md、Docs/session_onboarding.md，再依本次新增內容類型閱讀對應指南與專屬規格。先回報維護來源、相容風險、驗收範圍及既有未提交內容；未獲實作授權前不要修改檔案，也不要 commit／push。」
