# 局部超特寫：第二階段獨立核心

日期：2026-09-09。對應[正式規格](local-detail-prompt.md)。

## 已實作與尚未接入

`localDetailProjection.js` 已能將經審核、帶來源引用的局部模型轉成三部位英文結果。`localDetailSourceAdapter.js` 提供 6 款原始目錄衣物的區域轉換。後續同日已由 `localDetailResolvedAdapter.js` 接入 `engine.js` 的同次解析資料（詳見下方 runtime 小節），但尚未接入 UI／storage consumer；不代表整個目錄或第七輸出完成。

目前可審核來源：

| 款式 | 目標與證據範圍 |
| --- | --- |
| 亮面乳膠束帶套裝 | 腹部連續不透明覆蓋，保留局部乳膠，不露出被遮住的肚臍環 |
| 短版高領挖腰連身泳裝 | 肚臍位置明確挖空，不搬入高領胸片、完整下身 |
| 短版亮面乳膠拉鏈洋裝 | 肚臍位置為中央狹長開口；腹側不自動標成露出 |
| 一字領上衣 | 鎖骨開口，不把整片上胸判成露膚 |
| 透膚刺繡襯衫 | 上胸保留已知半透明衣料，底下皮膚／內搭仍待資料 |
| 高領連身上衣 | 連續軀幹覆蓋，保留來源的布料選擇語句，不自行選定其中一種 |

原始來源轉換器不包含改穿法後的狀態；有 effective modifier 時保守回傳 unknown 層。Runtime bridge 僅額外辨識來源明確的標準上衣版型／正常穿著，以及正常穿著、敞開的長版襯衫中央開口；其他 modifier 仍待專門規則。未知款式、特殊穿搭、角色卡及來源失效不能沿用其他款式。

## 核心輸入契約

`buildLocalDetailBundle(snapshot)` 的輸入是內部模型，不是儲存 schema：

- `subjectCount`：僅數字 1 支援，其餘回傳空 bundle。
- `imageType`：既有 6 個成品類型 ID；未知類型不降級成攝影。
- `sources`：同一次解析的來源字典，key 對應來源物件的 `en`。
- `targets[target].layers`：**實際所有可能遮擋該區域的層次**，由外到內。層包含 `id`、`regions`、`details`。不能拿主景別裁切後的服裝填入，也不能漏掉未知外層。
- `regions[region]`：`state` 與 `ref: { key, excerpt }`。狀態為 exposed／covered／translucent／unknown；缺少區域或證據失效一律 unknown。exposed 只解除這一層，仍繼續讀內層。
- 層上的 `details`：經審核、確實位於該區域的衣料／衣物結構來源，帶 `group`、`region`、`ref`。
- 目標上的 `details`：被上述層次遮擋的皮膚、身份或配件來源；只有確定 exposed 的子區域才會輸出。無法直接透過 translucent 自動展示底下飾品。
- `effects`：已由 adapter 審核為局部適用的 lighting／imaging 來源片語。不是整段場景或攝影師文字的自動拆句器；目前無完整目錄效果 adapter。

核心驗證 excerpt 確實存在於來源，但**文字存在不等於語意已審核**。呼叫端必須提供已審核的部位與層次對應，不能把任何來源句都標成 localFabric。來源轉換器的有效 modifier、角色卡與完整造型優先順序仍須接到當次原始 resolved snapshot，不能由本核心猜測。

回傳三份不可變結果，包含固定 id／label／target／contractVersion、status、text、coverage、coverageState、sourceRefs、diagnostics。coverageState 的 mixed 有逐子區域內容；diagnostics 不進公開英文。這些欄位尚不是 Saved Cards 保存契約。

## 已驗證行為

- 已知不透明層遮蔽底下飾品；外層敞開／半透明不能移除內搭。
- 未知外層阻擋內層；沒有任何層不等於裸露。
- 有可信局部表面時可以保留衣料而不推定皮膚；完全缺資料則英文為空、status 為 needs-source-review。
- 鎖骨露出或肚臍中央開口不推廣至其他子區域。
- 錯誤 group、錯誤 region、失效 excerpt 不成為公開內容。
- 三目標使用同一輸入、無隨機呼叫、不修改來源；額外加入場景、鞋子、姿勢、一般景別不影響結果。
- 水彩、油畫、時裝插畫、粉彩不被改成寫實攝影。核心不繼承一般鏡頭，也不新增背景或水中濕潤感。

局部測試 33/33（原契約 13、投影 13、真實目錄 adapter 7）；完整 frontend 860/860；Prompt Quality 168/168；lint／build 通過，僅既有 chunk-size advisory。Strict audit 使用 200、seed `prompt-quality-baseline`，前後 stdout 完全一致，零阻擋、23 既有診斷。

## 下一個接入關卡

1. 擴充 resolved context 的可審核層次，補齊圖案、有效 modifier、配件遮蔽、角色卡及各種完整造型；目前已串接解析結果，不等於完整款式支援。
2. 同次解析／零新增 random／舊六逐字不變的 runtime gate 已通過；消費者實際切換部位的 UI gate 尚待接入。
3. 接入第七卡、複製、生成來源與 Saved Cards 新舊 round-trip。
4. 第七卡接入後執行其 desktop／mobile Browser QA 與交付實測英文；目前僅完成既有工作區回歸。

## Runtime bridge 與驗證（2026-09-09）

`engine.js` 在同一次生成、原始角色／服裝／配色已解析後呼叫 `buildResolvedLocalDetailBundle`，三目標結果放在 `localDetailPrompts`，不加入 `extraPrompts`。沒有把景別、俯仰、環繞、焦段、場景、仰躺表面、姿勢或自拍文字傳進局部 adapter。來源字典取自同一組 slot/color 物件，並保留可追溯 excerpt；結果不修改原始物件。

已接入的範圍與限制：

- 上表 6 款衣物，辨識 runtime 已加前綴的連身／套裝名稱。局部布料可以附上同次解析的簡單配色，不搬入整套色系指令；完整造型 palette 仍為未審核 barrier。
- 長版襯衫＋敞開穿＋正常穿著，只將外層的肚臍中央開口視為可通過，仍讀內搭；只有外套且沒有主衣物時，不視為裸露。
- 一般人物眼部支援來源有明確眼部片語的 4 款臉型；已解析髮型、頭部配件與眼前眼鏡遮擋尚未建立完整區域資料時，先阻擋眼部結果。明確戴在頭頂的眼鏡不移到眼前。
- 3 組局部適用膚質、3 組主體光線選項的來源片語可讀取；其餘沒有機械複製完整描述。部位未確認時，光線本身不能使結果變成 ready。
- 肚臍環只有 navelPosition 明確 exposed 才保留。其他腰飾、頸飾、獨立褲裙腰線尚未審核時形成 barrier；不悄悄省略可能遮住部位的物件。
- 外層的露膚描述帶 `requiresExposed`，等所有層次確認後才輸出，避免「外層有開口＋內層有遮蔽」仍寫出裸露皮膚。
- 角色卡、特殊角色與特殊穿搭包含獨立身份／穿戴物，目前回傳待補資料而不是以普通人物代替。雙人 bundle 為空。

`localDetailRuntime.test.js` 的 40 個舊結果基準在接入前取得，排除 id/date 和新增 bundle，包含六輸出、summary、selection 與 structured；單人／雙人的隨機呼叫次數為 651／677，接入後相同。這不代表生圖相同，而是來源與舊文字結果相同。

Runtime 階段最終測試：局部 45/45，完整 frontend 872/872，Prompt Quality 168/168，lint/build 通過。200 筆 `prompt-quality-baseline` strict audit 前後 stdout 相同，零阻擋、23 既有診斷。Saved Cards 測試確認現有 codec 不保存 `localDetailPrompts`，原六文字保留；這是隔離測試，不是第七輸出 round-trip 成功。

Browser URL：`http://127.0.0.1:5175/Virtual_Photography_Studio/`。1440×1000、390×900 均完成隨機生成與五工作區導覽，六份輸出和 DLL 來源清單維持原樣，console warn/error 為空。手機動作／場景面板有既有容器超出（352px 內容／327px 容器），同尺寸公開 Pages 版也重現；本次未動 UI/CSS。Screenshots 在工具內檢視，沒有新增檔案；未操作付費生圖、保存、刪除或匯入使用者卡片。
