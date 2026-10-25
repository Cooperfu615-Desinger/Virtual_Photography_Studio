# E 已核准搬移清單

基準：`5e7ed02952ceea4a2f76b81583c5f783748ff308`，Cooper 明確核准 22 表＋2 常數。表共 334 筆，常數另計；renderer 文字與函式陣列排除。每欄 fieldKind 與上下文見 [正式來源](../../../knowledge_base/catalog/legacy_mappings.json)及[固定結構契約](../../../scripts/lib/legacyMappingContract.json)，原始 expression SHA 與來源行號見 [migration-baseline.json](migration-baseline.json)。下方函式以原引擎識別名稱追溯；載入時計算的 helper／consumer 未改。

| 常數／表 | pre-E 行號 | 筆數 | 計算時機 | 使用函式 |
| --- | ---: | ---: | --- | --- |
| `LEGACY_CHARACTER_EXPRESSION_CATEGORY` | 169 | 1 | literal | `CHARACTER_EXPRESSION_POSE_LEGACY_OPTION_MAP` |
| `LEGACY_ENVIRONMENT_MOOD_CATEGORY` | 1035 | 1 | literal | `buildEntries` |
| `REGIONAL_STYLE_LEGACY_OPTION_MAP` | 2672 | 26 | literal | `applyRegionalLegacyOptionIds` |
| `CAMERA_FRAMING_LEGACY_OPTION_MAP` | 2701 | 5 | literal | `applyCameraLegacyOptionIds` |
| `CAMERA_ANGLE_LEGACY_OPTION_MAP` | 2709 | 6 | literal | `applyCameraLegacyOptionIds` |
| `CAMERA_ORBIT_LEGACY_OPTION_MAP` | 2718 | 8 | literal | `applyCameraLegacyOptionIds` |
| `CAMERA_AMBIENT_LIGHT_RENAME_LEGACY_OPTION_MAP` | 2729 | 9 | literal | `applyCameraLegacyOptionIds` |
| `CAMERA_FILM_LEGACY_OPTION_MAP` | 2741 | 16 | literal | `applyCameraLegacyOptionIds` |
| `CAMERA_PROFILE_RENDERING_MIGRATIONS` | 2760 | 8 | literal | `normalizeLocks`（含 migrateCameraProfileToRendering） |
| `CHARACTER_IDENTITY_LEGACY_OPTION_MAP` | 2771 | 38 | literal | `applyCharacterIdentityLegacyOptionIds` |
| `CHARACTER_EXPRESSION_POSE_LEGACY_OPTION_MAP` | 2812 | 42 | literal | `applyCharacterExpressionPoseLegacyOptionIds` |
| `CHARACTER_EXPRESSION_POSE_LEGACY_SOCIAL_POSE_MIGRATIONS` | 2927 | 8 | load-time map | `applyExpressionPoseLegacySocialLockMigration` |
| `CHARACTER_LEGACY_SELFIE_SPECIAL_ACTION_MIGRATIONS` | 2941 | 4 | load-time map | `applyLegacySelfieSpecialActionMigration` |
| `CHARACTER_SPECIAL_ACTION_TO_POSE_COMPOSER_MIGRATIONS` | 2951 | 23 | literal | `applySpecialActionPoseComposerMigration` |
| `LEGACY_POSE_HAND_TO_PROP_ID` | 2977 | 7 | load-time Map | `applyLegacyPoseHandPropMigration` |
| `CHARACTER_POSE_TO_POSE_COMPOSER_MIGRATIONS` | 2987 | 27 | literal | `applyPoseIdPoseComposerMigration` |
| `POSE_COMPOSER_ARRANGEMENT_TO_ANCHOR_MIGRATIONS` | 3017 | 2 | literal | `applyPoseArrangementAnchorMigration` |
| `WARDROBE_LEGACY_OPTION_MAP` | 3022 | 80 | literal | `applyWardrobeLegacyOptionIds` |
| `WARDROBE_LEGACY_PROMPT_ALIASES` | 3137 | 6 | literal | `applyWardrobeLegacyPromptAliases` |
| `LOCATION_LEGACY_PROMPT_ALIASES` | 3169 | 2 | literal | `applyLocationLegacyPromptAliases` |
| `WARDROBE_OUTFIT_TO_DRESS_LEGACY_LOCK_MIGRATIONS` | 3188 | 4 | load-time map | `applyOutfitPresetToDressLegacyLockMigration` |
| `LEGACY_HAIR_STYLING_STATE_MIGRATIONS` | 3543 | 1 | literal | `applyLegacyHairStylingStateMigration` |
| `LEGACY_EYEWEAR_LOCK_MIGRATIONS` | 3785 | 7 | load-time map | `applyEyewearLegacyLockMigration` |
| `LEGACY_OUTERWEAR_OPENING_LOCK_MIGRATIONS` | 3822 | 5 | load-time map | `applyOuterwearOpeningLegacyLockMigration` |

補充：`LEGACY_HAIR_STYLING_STATE_MIGRATIONS` 本身是 literal；`applyLegacyHairStylingStateMigration` 內的 Map 在呼叫時建立，仍留原位。兩個字串常數透過 JSON 讀入，字串值及使用順序不變。只解析頂層純資料，沒有行數下限；renderer 字串 `LEGACY_OUTERWEAR_DOUBLE_SHOULDER_STYLING_TEXT` 與函式陣列 `AI_LEGACY_SINGLE_RENDERER_HELPERS` 明確排除，函式內局部映射及其他模組不在此範圍。

fieldKind：catalog-zh 依 buildEntries displayZh 精確比對；embedded-ref 宣告 module/export/match；attribute 使用指定分類的 displayZh 列舉；legacy-key 保存歷史 label、ID、prompt 或 [label,index]。新增 catalog-category 驗證現行分類，legacy-category 保存已退役分類，不要求現行存在。pair/pairs 額外約束索引為非負整數，不接受 bool、字串索引或多／少欄位。每表 key 唯一性包含分類與完整 tuple，避免誤把不同分類或索引的舊標籤當重複。

兩筆「雙腿屈起」的 first-match 順序為 sitting-hug-knees → lying-body-legs-bent，首筆仍是 sitting-hug-knees。J12 的 shoulder-lean / leaning-shoulders 仍由既有兩項 allowlist 管理，E 無新增豁免。兩筆 identity mapping 的空 legacy 陣列是原始資料，保持不動。
