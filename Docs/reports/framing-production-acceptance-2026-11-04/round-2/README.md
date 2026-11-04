# 正式站獨立單品與逐項全無驗收 — 2026-11-04

結果：本輪指定功能矩陣 PASS，36 案例 / 216 個 Prompt 輸出。

網站：https://cooperfu615-desinger.github.io/Virtual_Photography_Studio/
環境：Chrome 新建無痕視窗，原生 macOS 選單操作；Favorites 僅存本機、Sign In Firebase、生成圖像停用。未操作收藏或付費生成。

## 固定條件與矩陣

一般單人、寫實攝影；先全部全無，再逐項選取棉質細肩背心、直筒牛仔褲、羅紋短襪、尖頭細跟高跟鞋。無套裝接管，其他可選設定維持全無，MJ 預設參數不動。
每個狀態依次切換半臉傾斜特寫、全臉傾斜特寫、頭部主導近景、中景、牛仔中景、全身。
六個狀態：四項全選、僅上衣全無、僅褲裝全無、僅襪類全無、僅鞋款全無、透過各單品選單逐項全部清空。

## 驗證結果

- 六輸出 Gpt、Z-Image、MIDJOURNEY、Nano Banana 2.1、胸上特寫照、全身角色照均保留當下有效項目。
- 每個單品全無只移除該項，其他已選單品均保留；逐項全無沒有 Wardrobe / She wears、沒有補入 barefoot / nude / naked。
- 所有輸出非空，胸上 4:5、全身 9:16 與 MJ v8.2 參數保留，未出現檢查的 undefined / object Object / retainResolved 字樣。
- 原生選單選值成功更新。先前 selectOption 無法操作的限制，這次已用原生選單完成驗收，沒有修改程式。
- 桌面截圖檢視未見控制項重疊或裁切；此輪沒有量測 CSS viewport 或重新跑手機矩陣，也未擷取 console / page-error logs。上一輪手機與 console 紀錄見 ../round-1/README.md，不當作本輪新增結果。

## 證據

- outputs.json：36 案例完整六輸出與單品存在/不存在檢查。
- auth-state.txt：未登入與停用生成的 UI 證據。
- selected-none-state.txt：鞋款全無、襪類仍保留的原生 UI 與輸出。
- desktop-shoes-none.png、single-selectors.png：正式站原生操作畫面。

## 範圍與保存

本輪代表性單品涵蓋上身、褲裝、襪類、鞋款；不宣稱窮舉整個目錄、所有配件與模式。未生成圖像，不以模型出圖品質作為此功能門檻。
專案未修改、stage、commit、push 或部署；原工作區 Git 狀態及保存基準檔案雜湊相同。證據僅存於本暫存資料夾。
