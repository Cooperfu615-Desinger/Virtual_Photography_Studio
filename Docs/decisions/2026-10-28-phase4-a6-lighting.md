# A6 場景光線相容決策

實作既有 C 區 §8 的候選限制，詳 [規格](../specs/phase4-a6-lighting-compatibility-v1.md)。新檢查放在泛用室內支援之前；否則 generic supports_indoor 提早放行。來源精確固定的六個 independent key 在原 scope／景別檢查後仍豁免，並非任意人工光自動放行。

原報告 14 棚／7 窗光是當時盤點，目前 14 棚與 6 地下，共有 8 種自然／窗環境光；不將舊數量硬寫成目前驗收。兩個背景補 studio_lighting_scene，不追加 solid_color_studio。Hallstatt 的孤立 studio 標籤與全無的歷史 metadata 不應觸發「真實室內棚景」限制，保持原資料。

非運輸固定構圖八組的 UI 顯示與生成器都用固定場景及有效景別，普通 location／sceneAttribute 不再干擾光線候選；六運輸組手動全部光線仍可用，隨機遵守位置相容。

不修改原文／aliases／ID，也不清洗舊存檔文字。普通 engine 明確不相容鎖值保留；UI restore 的既有清除不可用選值行為另有往返紀錄，不能把兩種路徑視為同一無損契約。已封存抓拍原文保持。
