const PRIMARY_PROMPT_OUTPUTS = Object.freeze([
  Object.freeze({
    id: 'gpt',
    title: 'Gpt',
    field: 'grokPrompt',
    placeholder: '目前尚無可顯示的 Gpt prompt。',
    description: '分段自然語言主 prompt，主要給 ChatGPT-Image-2 / GPT Image 使用。',
    copyLabel: 'Gpt copied',
  }),
  Object.freeze({
    id: 'grok',
    title: 'Grok/Z-Image',
    field: 'zImagePrompt',
    placeholder: '目前尚無可顯示的 Grok/Z-Image prompt。',
    description: '更自然的完整段落描述，主要給 Grok Imagine / Z-Image 使用。',
    copyLabel: 'Grok/Z-Image copied',
  }),
  Object.freeze({
    id: 'ai',
    title: 'AI Prompt',
    field: 'midjourneyPrompt',
    placeholder: '目前尚無可顯示的 AI Prompt。',
    description: '偏通用影像生成語氣，適合快速貼到外部工具測試視覺方向。',
    copyLabel: 'AI copied',
  }),
]);

const FIXED_FRAMING_PROMPT_OUTPUTS = Object.freeze([
  Object.freeze({
    id: 'facial-closeup-portrait',
    title: '五官特寫照',
    aspectRatio: '1:1',
    placeholder: '目前尚無可顯示的五官特寫照 Prompt。',
    description: '固定 1:1 方形，保留五官、髮型、上身領口、場景與攝影設定。',
    copyLabel: '五官特寫照 copied',
  }),
  Object.freeze({
    id: 'chest-up-portrait',
    title: '胸上特寫照',
    aspectRatio: '4:5',
    placeholder: '目前尚無可顯示的胸上特寫照 Prompt。',
    description: '固定 4:5 直式，保留胸上人物、上身服裝、可見姿勢、場景與攝影設定。',
    copyLabel: '胸上特寫照 copied',
  }),
  Object.freeze({
    id: 'full-body-character',
    title: '全身角色照',
    aspectRatio: '9:16',
    placeholder: '目前尚無可顯示的全身角色照 Prompt。',
    description: '固定 9:16 直式，完整呈現單人人物、穿搭、鞋襪與配件。',
    copyLabel: '全身角色照 copied',
  }),
]);

function readFixedFramingOutputs(previewPrompt) {
  const extraPrompts = new Map(
    (Array.isArray(previewPrompt?.extraPrompts) ? previewPrompt.extraPrompts : [])
      .map((entry) => [entry?.id, entry?.text || '']),
  );

  return FIXED_FRAMING_PROMPT_OUTPUTS
    .map((output) => ({ ...output, value: extraPrompts.get(output.id) || '' }))
    .filter((output) => output.value.trim());
}

export function buildPage1GenerationPromptCards(previewPrompt) {
  const primaryCards = PRIMARY_PROMPT_OUTPUTS.map((output) => ({
    id: output.id,
    title: output.title,
    value: previewPrompt?.[output.field] || '',
    placeholder: output.placeholder,
    description: output.description,
    copyLabel: output.copyLabel,
  }));
  const fixedFramingCards = readFixedFramingOutputs(previewPrompt).map((output) => ({
    id: output.id,
    title: output.title,
    value: output.value,
    placeholder: output.placeholder,
    description: output.description,
    copyLabel: output.copyLabel,
  }));

  return [...primaryCards, ...fixedFramingCards];
}

export function buildPage1DllPromptSources(previewPrompt) {
  const primarySources = PRIMARY_PROMPT_OUTPUTS.map((output) => ({
    id: output.id,
    label: output.title,
    value: previewPrompt?.[output.field] || '',
  }));
  const fixedFramingSources = readFixedFramingOutputs(previewPrompt).map((output) => ({
    id: output.id,
    label: output.title,
    value: output.value,
    aspectRatio: output.aspectRatio,
    lockAspectRatio: true,
  }));

  return [...primarySources, ...fixedFramingSources];
}
