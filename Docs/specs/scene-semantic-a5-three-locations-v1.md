# Phase 4 A5：三筆場景語意修正 v1

日期：2026-10-26。Cooper 已確認本批驗收通過，授權只提交並 push 本次資料、文件、回歸案例與驗收工具；實際 Git／CI 結果另行核對。基準為已審查 main `a9dd3616bc6596cdb199420f3189a420c6f1ed17`。本批不包含其他 A5、A1–A4、A6、A7、J12、B3 或 P5b。

## 目的與核准差異

正式來源為 `knowledge_base/catalog/index.json` 指定的分類 JSON。只從下列三筆 `meta.semantic.tags` 移除一個錯誤標籤，保留其餘值與順序。

| 既有永久 ID | 移除 | 保留 tags |
| --- | --- | --- |
| `locations:城市與社群感-urban-social-snapshots:戶外-倫敦排屋街道:41` | `subterranean` | urban, outdoor, heritage |
| `locations:自然與戶外-nature-outdoors:戶外-清澈海灣岩岸:1` | `commercial` | outdoor, natural, waterfront |
| `locations:自然與戶外-nature-outdoors:戶外-草地與樹木:3` | `commercial` | outdoor, natural, green_space |

倫敦是地上住宅街道；「地下室窗格」是立面細節，不代表拍攝地點在地下。清澈海灣與草地沒有商業／城市夜光來源；原英文 `small` 被 substring `mall` 誤判。名稱、英文、中文描述、ID、有序 aliases、列序、index、registry、lyingSurface 與 renderer 均不變。只同步生成 database；六份 Markdown 與 legacyMappings 應逐位元組不變。

正式資料採 explicit semantic；不修改 `inferLocationMeta` 或相容演算法。缺少 semantic 的歷史／自訂 library 仍沿用原推論退路。CRT、其餘 15 筆 commercial、棚景／地下光線規則及六組交通手動光線政策不變。

## 可觀察行為與相容

一般單人全身、戶外／全無屬性下，倫敦環境光由 5 增為 19，海灣／草地由 19 減為 17；數量包含全無。海灣／草地排除「城市夜間混合光」「城市高彩度夜色」。三筆主體光候選在該條件下維持 23 個，另核對各景別。

沿用既有一般場景的明確鎖定優先：舊收藏的文字、場景／光線原始 ID 不批次改寫；直接經 codec／buildRestoreLocks 還原後呼叫引擎生成時，即使海灣／草地的舊城市光已不在候選池，明確鎖值仍保留。PAGE1 UI 的 transition 則沿用候選可用性規則，切換場景及套用收藏都會清除不相容光線鎖值；原收藏文字與 ID 不回寫。選單／隨機使用新候選池。倫敦已存的有效光線保持。場景 ID、六輸出欄位、收藏 schema 與 storage keys 不變。候選池改變可以影響相同 seed 的選值、後續 RNG 消耗與輸出，須記錄實際差異，不宣稱全面逐字不變。

## 歷史追溯與基準

D 凍結文件的倫敦 `drainage pipes` 成因記述不符合固定 pre-D `17074fbe` 與本批基準：兩版本原始 en 都沒有 drainage，desc 的「地下室」命中「地下」。修正說明並保留 D 歷史數值；D 的 known-issues.json、A–E fixtures、manifest、generator seals 不改寫。產品變更另留本批證據；歷史回播與當前行為驗收分開，不能重錄舊輸出消除差異。

## 驗收

1. 全來源與生成物差異僅三筆 tags；ID、aliases、順序、registry、index、其他條目與六 Markdown／legacy 副本不變。其他工作樹未提交檔案逐檔 hash 保護。
2. 覆蓋三場景、全部景別、全無／戶外屬性、隨機／全無／有效／不相容手動光線；比較有序環境光、主體光候選、selection、六種公開輸出及 RNG。
3. JSON 舊收藏文字與原 ID 完整保留；Markdown 維持既有全文比對，投影文字不足時不能保證恢復場景，但前後解析須相同。直接引擎還原的顯式光線與 UI 切換／收藏套用的相容政策分開驗證；比較既有固定構圖、雙人、角色卡、場景匯入與仰躺排除路徑。
4. 聚焦回歸先在修改前證明失敗，再於修改後通過；完整 frontend、prompt-quality、lint、build、同 seed 200 strict audit、Python、catalog 工具、同步／歷史 ID／strict integrity 與公開資產檢查。
5. A–E 封存完整性及歷史回播保留，核准產品差異須有可追溯驗證，不改寫歷史。
6. 桌面 1440×1000／手機 390×900 驗證三場景候選、生成、六輸出、Saved Cards 還原與重載、DLL 明確帶入；五工作區 smoke、無 console/page error、破圖或橫向溢出。不送外部生成。

驗收結果記於 [A5 報告](../reports/scene-semantic-a5-2026-10-26/README.md)。本機檢查、使用者驗收與 Git／CI 交付分別記錄。
