# PAGE2 GPT／Z 成年身份補齊 v1

2026-10-28。狀態：Cooper 已確認驗收通過，授權限定 commit／push；實際提交與 CI 結果另核對。可信基準 main `bfc2d5baafc8aaede8f774527d0f1aaa187da27f`。

## 範圍與來源

Phase 4 已結案；本批是原 A1 明確排除的 PAGE2 後續。33 張角色各自的 `profile.identityAndBody` 已包含成年身份：32 張為 `a 20-year-old adult East Asian woman`，Eleanor 為 `a 20-year-old adult demonic woman`。只在 PAGE2 GPT／Z-Image 的新生成內容重用這個既有開頭，不修改角色來源或共用 PAGE1 引擎。

## 輸出契約

- PAGE2 GPT 有結構化身份時，在卡名後、五官欄位前增加一次原成年身份句，首字大寫、句尾加句點；無結構化欄位時保留完整 Identity and body fallback，不再重複插入。
- PAGE2 Z 在既有角色名稱片語之後增加原成年身份片語；既有永久四錨點、body、hair、攝影方向、服裝、附加文字及順序保持。
- 抽取沿用 A1 已審閱的來源形狀：從字首 `a 20-year-old adult ... woman` 辨識，容許空白正規化。缺失或無法辨識時不猜年齡、族裔、性別或角色類型，不從卡名或其他輸出推測。
- AI、頭像、四視圖、全身參考逐字保持；PAGE1 六輸出、選值、RNG、抓拍匯入／重抽、角色資料、服裝圖層、變體、公開欄位 ID／標籤與儲存格式不變。
- 舊收藏已有的六種公開文字、單張 Markdown／ZIP 內容不批次遷移；既有儲存值優先。明確重新生成及新收藏才採本批輸出。缺失輸出的既有 fallback 機制保持。
- J12、B3、C 類與 P5b 均不在本批。既有 PAGE2 攝影方向與服裝文案不順手整理。

## 已確認的既有匯入限制

固定基準與本批版本均不接受 PAGE2 的 `GPT Prompt` Markdown 標題，ZIP 匯入也經過同一解析器，因此仍失敗；介面顯示「ZIP 格式錯誤，無法匯入 Favorites」，既有收藏不被覆寫。單張下載與 ZIP 使用不同排版，均需逐份保留六種公開文字；JSON 儲存／重載正常。這不是本批回歸，不藉成年身份修正改 parser；PAGE2 匯出／匯入格式相容另批評估。

## 驗收與歷史

先新增失敗回歸，再修改 renderer。固定 Git oracle 逐張驗證全套、純人物、單層、全部相容髮型／眼鏡、附加文字；只允許兩處身份插入，其餘逐字比較。檢查無身份／無結構化欄位邊界、舊／新收藏 JSON／Markdown／ZIP 及 PAGE1 套用、抓拍、重新匯入。

新增測試端精確 inverse，只在隔離副本還原本批來源及品質入口；缺檔／竄改／混合狀態拒絕，原 A～E、A1～A7 基準與 Phase 4 manifest 不改。共用歷史回放入口接上新一層 inverse，原工具在隔離副本執行。

完成聚焦測試、前端全套、Prompt Quality、lint／build、同 seed 200 strict audit、schema／歷史 ID／完整性／工具／資產檢查。1440×1000 與 390×900 實際操作 PAGE2 六種複製、角色／髮型／眼鏡／圖層、收藏原文、下載／ZIP、套用 PAGE1 與重載；巡覽現行六工作區。文字驗收不宣稱外部模型出圖品質。

[決策](../decisions/2026-10-28-page2-adult-identity.md) · [驗收證據](../reports/page2-adult-identity-2026-10-28/README.md)
