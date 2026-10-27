# A2 特殊穿搭：膠帶造型控制語 v1

日期：2026-10-27。狀態：本機完整驗收通過，Cooper 已核准本批限定 commit／push；Git 與 CI 結果另行回報。

## 範圍與成功條件

可信 main／歷史 ID 基準 `3a18fc2c2529dce38782135638ffd67c38a62187`。僅 `wardrobe:特殊穿搭-special-outfits:紅色亮面膠帶束帶造型:90`：移除英文 `palette-controlled ` 前綴及 `, tape color follows complete-look palette selection` 子句，保留其餘字元。中文名稱雖含紅色，原有效英文沒有固定紅色，**不得補紅色或任何新視覺事實**。

保留名稱、desc、永久 ID、有序 legacyIds、排序、semantic、參考圖與配色責任；把修改前完整英文追加至 top-level legacyPromptAliases。只移除非視覺控制語，既有 family／tags 不變。正式分類 JSON 同步產生 Markdown／database，不手改產物；runtime 色系句、renderer、選值／RNG、UI、storage 及其他分類保持。

## 相容與歷史

歷史卡片公開原文及抓拍內嵌人物快照保持；依 ID 重建 structured 及明確重新生成使用新來源。舊全文 alias、無快照 Markdown、JSON、新 PAGE1 單張／ZIP 快照均驗證。舊抓拍重抽保留原來源，明確重新匯入新生成來源才清除兩段控制語。不變更 snapshot 格式或 parser，不移除仍需保留的舊文字相容規則。

A～E、A5、A1 及前四批 A2 證據保持。新 test-only inverse 只在記憶體副本或隔離目錄精確回復本筆 en／alias，先核對來源、database、Markdown、兩份管理檔及兩份回放銜接檔，全部通過後才寫；缺 ID、重複／重排、未知文字／metadata、混合 before／after 必須拒絕。前批原驗收工具在回復後副本重播，不能重錄封存掩蓋差異。

## 驗收

先保存 main、全追蹤檔及其他工作目錄狀態／雜湊、同 seed audit，建立會失敗的單筆回歸再改正式資料。固定 Git 引擎另加唯一核准資料差異作獨立 oracle；六輸出、structured、selection、summary、RNG 比較不得有核准外差異。全無及九色系、所有景別、雙人 A/B、固定構圖、外套投影、新舊抓拍及其他 89 款特殊穿搭納入；runtime 句保持，未選色不得因中文名新增紅色。

舊 JSON、原始完整英文 alias、PAGE1 單張／ZIP 快照、衍生輸出與歷史抓拍另驗精確文字及 ID 歸屬。沒有快照的舊渲染正文沿用既存推論，僅要求與固定 Git 相同；它不保證完整選值，不能把其既存辨識限制當成本批新功能或已修正問題。依 root AGENTS 完成 sync／schema／歷史 ID／strict／Python／目錄工具、前端全套、Prompt Quality、lint／build、200 / prompt-quality-baseline strict audit。瀏覽器 1440×1000／390×900 檢查六工作區及生成、複製、收藏重載、匯入／套用、抓拍重抽／明確重新匯入；不呼叫付費模型。

[決策](../decisions/2026-10-27-a2-special-tape-control-language.md) · [驗收報告](../reports/wardrobe-control-a2-special-tape-2026-10-27/README.md)。runtime 配色句、既有特殊穿搭色系套用問題、其他 Phase 4 與 P5b 均不在本批；後續 Git 授權只包含本批交付。

特殊穿搭原 schema 未開放 top-level legacyPromptAliases；本批僅為該分類新增既有 string-array 欄位宣告，field_mapping 三個對應清單追加該分類。無新 runtime 欄位／格式；隔離 inverse 同時精確還原這兩份管理文件，避免影響前批封存檢查。

回歸檔由既有 npm test glob 與 CI 自動收錄；Prompt Quality 沿用原測試清單並另執行本批聚焦回歸。package.json／CI 不必變更。兩份回放銜接檔有獨立 before／after 雜湊；舊驗收前也須精確還原，原檢查不放寬。

## 驗收揭露的既有配色套用限制

固定 main 與本批皆會在單人特殊穿搭套用 Saved Card 時，於 `transitionPage1Locks` 清除其他 wardrobe 控制，連同 `completeLookPaletteId` 回到 `none`。九種非全無色系均已在固定 Git 原碼重現；存檔／Markdown 快照仍保有色系，問題發生於套用 UI 狀態。瀏覽器以黑紅／銀灰兩種重現，套用前完整公開文字保持，套用後僅出現既有色系句移除。本批不修改此規則；列入 runtime 配色後續分析，不能宣稱本批已修復色系套用。
