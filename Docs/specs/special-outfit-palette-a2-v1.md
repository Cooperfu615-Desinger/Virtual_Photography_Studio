# A2 單人特殊穿搭保留完整造型色系 v1

2026-10-27。可信 main：`15580949ac1f00e7a2628209d91a301434504965`。Cooper 已確認本機驗收通過，授權只提交並 push 本批程式、文件、基準、回歸案例、歷史回放與驗收工具。實際 Git 與對應 CI 結果另行核對；原始報告保留提交前證據。上下配色抓拍相容、舊連身還原、其他項目與 P5b 仍排除。

## 結果與責任

單人特殊穿搭接管穿搭欄位時，保留該人物既有 `completeLookPaletteId`。適用手動選色、更新其他選項、套用預覽、Saved Cards 回填、Markdown／ZIP 還原後套用與重載。所有其他接管清理仍以固定 main 為準；雙人 A／B 各自的色系與隔離規則不變。

- 唯一 production 修改是 `lockTransitions.js` 單人特殊穿搭清理名單排除 `completeLookPaletteId`。不新增欄位、色票或遷移，也不改 runtime builder、catalog、文法、固定色、裁切、UI 版面、公開欄位或 RNG。
- 色系是每人共用的完整造型設定，沿用目前特殊穿搭／套裝／連身歸屬。更換特殊穿搭保持同一色系；明確選全無必須保持全無。
- 特殊穿搭隨機／空值、解除特殊穿搭後仍生效的套裝／連身、改選分件、整區隨機／清空及全域清空，都沿用固定 main 行為；只在原本會接管的單人分支中保留傳入色系，不增加隱藏狀態或自動恢復被清除的舊值。
- 使用者已被舊版清掉的色系不能憑空復原；仍有保存色系的卡片可以正確套用。
- 已收藏的公開原文、Markdown 快照與已匯入抓拍人物不改寫。重新生成依保存選值走目前引擎；抓拍重抽維持快照，明確重新匯入才換來源。
- 上下配色抓拍相容、舊連身 `dressId + topBottomPaletteId` 還原及純文字辨識、胸上連身區域投影、其他 Phase 4／P5b 排除。既有已知限制須在保護案例重現，不借本批修復。

## 驗收

1. 修改前保存 main SHA、全追蹤檔 SHA、其他工作目錄 HEAD／dirty 狀態與內容 SHA、200 同 seed strict audit。先新增回歸並確認修改前失敗。
2. 固定 Git transition 作為獨立 oracle：沿用原輸出，只將單人有效特殊穿搭的完整色系恢復為 candidate 經既有正規化的值。其他欄位逐一相同。90 款 × 九色系與全無覆蓋手動、還原、後續更新、切換；全無／隨機、非特殊完整造型、分件、雙人 A／B、角色卡、固定構圖、抓拍、全清／區清另列。
3. 新 transition 的輸出交給固定 Git 原引擎，對照目前引擎的全 Prompt 物件／六輸出／選值／RNG，僅排除頂層 id/date。另驗證相同原 locks 的直接生成逐字不變；不可透過重錄 expectedHash 接受差異。
4. 舊 JSON／Markdown 快照／無快照文字的解析保持；新 Markdown 與 ZIP 共用既有編碼，原文保留。套用後色系／完整穿搭保持，其他接管欄位仍清除。抓拍的既有來源、重抽、儲存、明確重新匯入分別驗證。
5. Node 22：聚焦回歸、npm test、test:prompt-quality、lint、build；200 `prompt-quality-baseline --strict` 前後一致。catalog sync --check、歷史 ID／strict、Python、目錄工具、assets 確認正式資料未變。
6. 5175 在 1440×1000 與 390×900，實際操作手動選色／全無、更換特殊穿搭、預覽回填、六輸出複製、收藏、單張／ZIP 匯入匯出、套用、重載、抓拍與六工作區。無新增 console／page error、意外頁面水平溢位或破圖；不呼叫外部生成 API。
7. 精確 inverse 僅寫隔離副本；原 production 檔及本批新增測試都以 SHA 驗證後才寫入／移除，未知、缺檔、混合狀態原子拒絕。回放上一批 runtime 原工具及完整 A2／A1／A5 鏈，A～E 歷史基準與既有工具不重錄。
8. 最後核對 allowlist、歷史 SHA、其他工作目錄及無 staged 內容；本機驗收與使用者驗收、Git／CI 交付分開報告。

[決策](../decisions/2026-10-27-a2-special-outfit-palette.md) · [驗收報告](../reports/special-outfit-palette-a2-2026-10-27/README.md)
