# 手持波板糖：嘴前遮嘴 v1

Status: implemented and locally validated, 2026-10-05

## Outcome and source

保留名稱「手持波板糖」、ID `hand-hold-whirly-lollipop`、清單位置與 storage schema。單手握住糖棒，將大型彩色旋紋波板糖的扁平圓盤舉到嘴唇正前方，遮住部分嘴部，鼻子與眼睛保持可見。不指定左右手，不描述咬糖或將糖含入嘴中。

正式來源位於 `webapp/src/lib/engine/poseComposerOptions.js` 的 `POSE_COMPOSER_PROP_OPTIONS`，35 個空白分隔英文詞：

```text
an oversized colorful swirl lollipop held by the stick in one hand, its flat round candy disc positioned just in front of her lips, partially covering her mouth while leaving her nose and eyes visible
```

此來源維持名詞片語，供 shared canonical pose 組成 `She has …, and presents …`。不新增 renderer 分支。Public output contract `1.40.0`。

## Compatibility and output boundaries

- 舊完整英文 `an oversized colorful whirly pop swirl lollipop with a large playful candy head, held naturally in one hand, cute cheerful prop detail` 保留為 `meta.legacyPromptAliases`，供文字匯入識別。Saved Cards 原文不批次改寫；還原後重新生成採新來源。
- 舊 `poseHandId` 遷移至 `posePropId`、舊 special action 遷移、道具接管手部層的既有規則不變。另項「含著圓形棒棒糖｜右手持棒」不變。
- `prop_action` 加上 `face_action`，沿用現有隨機相容規則，排除背面／後三分之四隨機道具候選；不覆寫明確手動 lock。
- 普通單人的胸上、腰上、牛仔中景與全身主 GPT、Z、AI，以及兩組胸上衍生，於動作有效時完整保留新來源一次。頭肩及更緊的主裁切仍省略動作文字，兩組胸上衍生重新投影同一選擇。
- 全身角色參考仍使用自然站姿，不繼承道具動作，維持單人 `9:16`。固定場景位置接管、四點支撐、仰躺 surface-led 路徑沿用原規則，不擴大動作適用範圍。
- 知識庫的 legacy「咬著波板糖」不是本次活躍選項來源，不修改其 Markdown／JSON。

## Validation

- Focused regression covers visible and tight crops, shared canonical pose, explicit rear selection, legacy English imports, Saved Card restore/regeneration and random rear-view filtering.
- The `whirly-lollipop-mouth` representative fixture pins the five supported outputs and the independent full-body character reference.
- Compare unchanged prop catalog entries and deterministic unrelated-prop outputs before/after. Run the same `200 / prompt-quality-baseline` strict audit, Prompt Quality, frontend tests, lint and build.
- Browser acceptance exercises selected prop, generated output, copy and restoration at desktop/mobile, plus navigation smoke across the five active workspaces. External-model image quality remains a separate user evaluation.
