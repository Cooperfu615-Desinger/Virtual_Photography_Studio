# 鏡子自拍移至道具動作 v1

日期：2026-10-11。狀態：使用者已核准實作與 commit／push，本機實作、程式驗證與主要瀏覽器流程通過；原生下拉選單鍵盤選取待實際瀏覽器確認。Git 交付結果以本機及遠端提交記錄核對為準；未手動部署。Public output contract `1.50.0`。

## 1. 目的與範圍

將 PAGE1 的「鏡子自拍」從 `手部動作` 移至 `道具動作`，顯示名稱改為「手持手機對鏡自拍」。這是持握可見手機並利用鏡面拍攝的具體物件互動，不是所有自拍方式的通用名稱。

- 僅搬移這一項；`自然自拍` 與 `男友/閨蜜自拍` 維持原手部選項與行為。
- 保留原 option ID `selfie-mirror-phone-visible`，改由 `posePropId` 選擇。
- 不新增 UI 欄位、browser storage key、Saved Cards schema 或資料庫資料列；來源仍在 `poseComposerOptions.js`。
- 不調整布局、姿勢、場景、鏡頭、比例、衣物、人物或光線來源。

## 2. 不變的拍攝語意

同一份英文來源完整保留：

```text
one hand holding a visible phone toward a mirror for a mirror selfie, with the phone overlapping the face or positioned beside it in the reflection
```

手機仍在畫面中可見，鏡面仍是拍攝方式的一部分。不得把它改成手機／持握手留在畫面外的前鏡頭自拍，也不得自動新增自拍棒、第二台相機、可見拍攝者或不同場景。

保留 `selfie_hand_pose`、`visible_phone`、`mirror_selfie`、`locks_orbit` 及既有可見範圍。歷史 tag 名稱屬於相容介面，不因移類別而全面重新命名。

## 3. 選擇、隨機與優先權

- 選項維持 `randomEligible: false`，只供手動選擇，不加入道具隨機池。
- 沿用 hand／prop last-action takeover：選定道具清空手部；改選具體手部則清空道具，不同時輸出兩個動作。
- 沿用既有道具保留規則：B 區及全域批次隨機保留明確的 `posePropId`，因此手動鏡子自拍不再被手部批次隨機覆寫。這是移分類後刻意採用的道具行為，不建立特例隨機系統。
- 有效自拍動作不論存於 hand 或 prop，都沿用 orbit `全無` 的解析及 UI 停用；一般非自拍道具不取得自拍鎖定。
- 四足跪姿仍優先保留雙掌／雙肘必要支撐，道具控制停用；本批不擴大四足的手機適用範圍。
- 固定月台／車廂人物位置接管仍使用有效場景姿勢，不能被普通手機道具覆蓋。全無位置及其他路徑沿用既有政策。
- 仰躺 surface-led、雙人、角色卡／特殊角色、緊裁切與全身角色參考照的既有範圍不擴大。

## 4. 還原與文字回填

- 舊 payload 中的 `poseHandId = selfie-mirror-phone-visible` 透過現有 hand-to-prop normalize 遷移至同 ID 的 `posePropId`，並清空舊手部值。
- 已有有效明確道具時，既有道具優先；不能以 legacy 手部值覆蓋使用者新選擇。
- 標準 Prompt／Markdown parser 根據不變的英文來源回填至道具欄位。舊中文名稱作為歷史分類紀錄，不重建一個新 ID。
- 新生成 selection／摘要使用新道具欄位及新名稱；Saved Cards 已存 Prompt 原文不批次重寫，還原後重新生成才使用新分類。

## 5. 輸出與 Z capture

所有輸出仍讀同一 resolved selection，先依既有構圖可見性投影動作來源。有效道具接管手部，完整 canonical pose 只含同一動作一次。

- GPT／MJ 與排除路徑依原 canonical pose／段落契約，不改成通用 `phone selfie`。
- 一般單人主 Z 現場整合路徑從**有效自拍動作**取得來源：有效道具優先，否則才使用有效手部。投影仍可見的「手持手機對鏡自拍」搬至 capture context，並從該 Z 姿勢句移除相同動作，避免重複。
- 此搬移只維持原已核准 Z source relocation，不改寫共用 canonical pose，也不回補被裁切省略的動作。
- 其他道具不能被誤判為自拍；有有效非自拍道具時，舊手部自拍不得重新出現。
- 兩組胸上沿用同一 resolved 動作的既有投影；全身角色參考照仍保持原自然站姿及角色參考用途。

## 6. 實際驗證結果

驗證日期：2026-10-11。本機程式與主要瀏覽器流程驗證通過，下列原生鍵盤選取仍有自動化限制；不以此代表外部圖像模型驗收。

- 新增鏡子自拍專項 19/19、專項＋相容性＋同場組裝 97/97、Pose Composer＋歷史場景矩陣 89/89、攝影編輯器 14/14 通過。
- 完整 frontend tests：1490/1490；Prompt Quality：647/647；lint、build、`git diff --check`、資料同步 `--check` 及 Python scripts tests 2/2 通過。完整測試固定 `NODE_OPTIONS=--test-reporter=tap`，符合既有 runner 測試的 TAP 斷言；未修改測試執行器。
- 實作前凍結 95 組案例／570 份六輸出，搬移後逐字一致；其中八組六輸出 SHA 加入專項回歸。既有歷史 JSON 未重寫，selection hash 只在精確舊鏡子自拍 hand→prop 的測試比較反向映射，原 output hash gate 保留。
- Strict audit 使用相同 count `200`、seed `prompt-quality-baseline`；前後皆 0 blocking、0 contract／leakage／contradiction／coverage、20 組有診斷、22 diagnostic-only。既有 19 個衣物／場景邏輯訊號與三個近似重複訊號不變。
- Browser URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/`。桌面 `1440×1000`、手機 `390×900`，13 個互動／還原情境及 16 個版面健康狀態通過。實測新分類、有效自拍環繞不可調整／清空恢復、手部互斥、B 區／全域隨機保留、四足必要支撐、固定車廂位置接管、英文回填、目前收藏套用、舊收藏與舊 locks 還原。
- 五個工作區雙尺寸 smoke 無頁面橫向溢出、破圖、console／page error 或 warning。最終桌面／手機的道具選擇與環繞管理截圖經目視檢查，無新增裁切、重疊或不可讀文字。隔離 browser context，使用者 storage 不變，外部 POST 及付費生成皆 0。
- 鍵盤 focus／Tab 通過，焦點外框可見、無 focus trap；原生下拉選單的鍵盤選取尚未驗證。macOS headless Chromium 在應用程式與純 HTML 對照皆無法以三種鍵盤操作切換選項；應用程式已確認目標 option 未停用，但標準 `selectOption` 仍遭 headless actionability 拒絕。主互動矩陣使用已記錄的 DOM change fallback 測試選取後的狀態及消費者，不能據此宣稱原生鍵盤選取通過。未為自動化限制修改 production，需由實際瀏覽器確認此項。
- 證據：`/tmp/vps-mirror-prop-Qos4aE/` 下的 `full-suite-completion.log`、`prompt-quality-final.log`、`audit-after.log`、`browser-results.json` 與 `desktop-mirror-final.png`／`mobile-mirror-final.png`／`desktop-orbit-final.png`／`mobile-orbit-final.png`。建置僅有既有大型 chunk 提醒。

## 7. 相關規範

- [人物作者指南](character-section-a-authoring-guide.md)
- [單人輸出規範](page1-single-prompt-compression-guide.md)
- [現場整合組裝規則](page1-single-scene-integrated-assembly-v1.md)
- [主 Z 同場拍攝規則](z-image-on-location-capture-v1.md)
- [跪姿 v2](kneeling-catalog-v2.md)
