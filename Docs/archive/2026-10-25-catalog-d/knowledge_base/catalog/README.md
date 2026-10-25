# Catalog JSON 正式來源（C）

2026-10-25：由 main `64870460e8a153a07baf953df0d6cf784ce2aca4` 切換。正式目錄為 `index.json` 指定順序的 56 份分類 JSON，共 1,050 筆。`schema.json`、`field_mapping.json`、`id_registry.json` 是管理文件，不是分類。manifest 繼續負責參考圖；不把圖片衍生鍵寫回來源。

## 編輯與驗證

1. 由 `index.json` 找到分類檔，修改 `entries`；既有 `id`、`legacyIds` 及陣列順序保留。顯示與抽樣順序仍是行為，不因 ID 穩定就任意重排。
2. 新增只使用 `<group>:<分類slug>:<英文-kebab-case>`，同步在登記簿追加 `active` 與初始 group/category、決策來源。不得另發 `frozen`、重用舊 ID、刪除歷史或退役既有條目。C 本身沒有新增或退役項目。
3. 新增、移動列時同步維護 index 的 Markdown layout ID 位置；每類順序須等於 entries，每 ID 恰好一次。layout 的 cells 只保存結構欄，英文／名稱／描述由紀錄產生；標題、前言、表頭與分隔行保留原文。
4. schema 驗證所有來源及巢狀欄位；`id/zh/en/desc` 非空，表格文字不得含 `|` 或換行。Regional 的 `inspiration` 與 `desc` 分別填寫，生成時以 ` | ` 組回。允許的 false、0、空字串依 schema 原樣保留。
5. 更新欄位責任清單的實際 source/generated/runtime 分工及分類範圍。`outerwear`、`topUnderbust`、`subjectLight` 仍保留來源頂層，engine 依現有順序投影至 meta。`lyingSurface`、`mj` 及 manifest 圖片映射保留；D 的 `meta.semantic` 尚未啟用。
6. 修改前選定已審查的完整 Git SHA，不能從候選 JSON 取得基準。初次 C 尚未提交時本機基準固定如下；C 提交後改用具有正式 registry 的已審查提交，不能繼續使用此 bootstrap。

```bash
export REGISTRY_BASE_COMMIT=64870460e8a153a07baf953df0d6cf784ce2aca4
python3 scripts/sync_to_json.py
python3 scripts/sync_to_json.py --check --report-json
python3 -m unittest discover -s scripts/tests
python3 scripts/check_public_assets.py
node scripts/check_catalog_integrity.mjs --strict
node --test scripts/tests/catalog-integrity.test.mjs
```

`--registry-base-commit FULL_SHA` 可代替環境變數。一般歷史驗證從該 Git object 讀 registry，報告 SHA-256；缺物件、缺 registry、非祖先或自我基準均失敗。初次 C 只能緊接固定 pre-C，使用封存 A inventory 的固定 SHA 與受信任 B 保留的 A snapshot 核對。候選提交須由 CI 指定；本機 HEAD 前進後不容許重用 bootstrap。PR 使用事件 base/head，push 使用 before/current，手動 CI 使用 HEAD^/HEAD；checkout 取得完整歷史。

同步先驗證全部來源、registry、manifest、總覽映射，再準備七份輸出，最後替換。一般 I/O 失敗會回復已替換檔；`--check` 僅讀不寫，逐位元組檢查 database 與六份 Markdown。這不是跨七檔的斷電交易；程序／電源中斷後需重新 sync/check，不能提交部分輸出。

六份 `knowledge_base/*.md` 是唯讀總覽，`webapp/src/data/database.json` 是編譯產物；不要手改。舊 `item_metadata.json`、`outfit_preset_metadata.json` 已合併到分類紀錄並移除，可從 pre-C Git 取得原文。B 的一次性 rehearsal 工具在已切換 checkout 直接拒絕；如需重演，以固定 pre-C 的乾淨外部 checkout 執行原工具，不回退正式 reader。

## 完整驗收與基準保護

依 root AGENTS 跑前端 test、prompt-quality、lint、build、相同 seed/count audit、A 三套完整重播與 seal、五工作區桌手機還原／匯入。C 不重錄 A。未來核准產品變更應另建有來源與理由的新 revision，不能為通過遷移而改既有快照。J12 兩個精確歷史例外保留；其他 blocker 或過期例外都失敗。

正式五工作區為 Prompt 工作台、角色建模、場景建模、DLL_PIC Pro、Saved Cards；動作姿勢與觀察式抓拍為 Prompt 整合模式。外部生成不屬 C 驗收。

[規格](../../Docs/specs/catalog-data-architecture-v1.md) · [C 報告](../../Docs/reports/catalog-architecture-c-2026-10-25/README.md) · [切換前操作文件](../../Docs/archive/2026-10-25-catalog-c/ARCHIVE_INDEX.md)
