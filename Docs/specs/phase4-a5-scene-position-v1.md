# Phase 4 A5 主體所在空間 v1

2026-10-28。依 Phase 4 整體授權，基準 `74316be01efb10780412927454ef0a10be5a7774`。逐筆原件、ID、英文、中文、描述、aliases 與前後標籤見 [review](../reports/phase4-completion-2026-10-28/a5/review.json)。

## 政策與範圍

兩筆室內（美食街、咖啡館窗邊）只去 outdoor；其餘九筆只去 indoor。indoor/outdoor 表示主體所在位置；屋簷、騎樓、緣側遮蔽與窗外景觀由原文／支撐資訊表達。興記門口騎樓與旅館緣側屬有遮蔽的外部邊界，不因屋頂或鄰接室內而同時標室內。咖啡館 green_space 保留可見窗外樹木，hospitality 等其他語意不順手重審。

僅改三份 Locations JSON 的十一個 tags 與生成 database；不改 renderer、ID、順序、aliases、原文、lyingSurface、registry 或 legacy mappings。A6 光線相容另批。

## 行為與相容

依新 metadata 的光線、人物受光、姿勢支撐、隨機衣物／外套候選會改變；RNG 次數與後續隨機輸出允許連帶變化，須精確等於固定舊 engine 加十一項 metadata 修正的獨立 oracle。明確鎖值仍沿用既有解析／過濾，不另加入遷移或強制清除。舊存檔公開原文保持，套用重新生成採目前語意。

## 驗收

`phase4_a5_acceptance.mjs`：全資料精確比對固定 Git＋十一項差異；每筆全景別／單雙人／全環境光／全人物受光、隨機組合、未修改場景、候選池、鎖值轉換與 JSON／Markdown 往返。六輸出、selection、RNG 必須吻合獨立 oracle。歷史 Ximending 十一筆待決測試留在隔離舊來源，新增目前十一筆驗證，不重錄舊基準。

執行完整 AGENTS 閘門、同 seed 200 audit、桌手機六工作區與匯出／ZIP／套用，並驗證所有原歷史與其他工作目錄未改。整體歷史鏈於 Phase 4 收尾再次執行。
