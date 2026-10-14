const PRIMARY_PROMPT_OUTPUTS = Object.freeze([
  Object.freeze({
    id: 'gpt',
    title: 'Gpt',
    field: 'grokPrompt',
    placeholder: '目前尚無可顯示的 Gpt prompt。',
    copyLabel: 'Gpt copied',
  }),
  Object.freeze({
    id: 'grok',
    title: 'Z-Image',
    field: 'zImagePrompt',
    placeholder: '目前尚無可顯示的 Z-Image prompt。',
    copyLabel: 'Z-Image copied',
  }),
  Object.freeze({
    id: 'ai',
    title: 'MIDJOURNEY',
    field: 'midjourneyPrompt',
    placeholder: '目前尚無可顯示的 AI Prompt。',
    copyLabel: 'AI copied',
  }),
]);

const NANO_BANANA_PROMPT_OUTPUT = Object.freeze({
  id: 'nano-banana-2.1',
  title: 'Nano Banana 2.1',
  field: 'nanoBananaPrompt',
  placeholder: '目前尚無可顯示的 Nano Banana 2.1 prompt。',
  copyLabel: 'Nano Banana 2.1 copied',
});

function readPrimaryOutputs(previewPrompt) {
  return previewPrompt?.nanoBananaPrompt?.trim()
    ? [...PRIMARY_PROMPT_OUTPUTS, NANO_BANANA_PROMPT_OUTPUT]
    : PRIMARY_PROMPT_OUTPUTS;
}

const FIXED_FRAMING_PROMPT_OUTPUTS = Object.freeze([
  Object.freeze({
    id: 'chest-up-portrait',
    title: '胸上特寫照',
    aspectRatio: '4:5',
    placeholder: '目前尚無可顯示的胸上特寫照 Prompt。',
    copyLabel: '胸上特寫照 copied',
  }),
  Object.freeze({
    id: 'full-body-character',
    title: '全身角色照',
    aspectRatio: '9:16',
    placeholder: '目前尚無可顯示的全身角色照 Prompt。',
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
  const primaryCards = readPrimaryOutputs(previewPrompt).map((output) => ({
    id: output.id,
    title: output.title,
    value: previewPrompt?.[output.field] || '',
    placeholder: output.placeholder,
    copyLabel: output.copyLabel,
  }));
  const fixedFramingCards = readFixedFramingOutputs(previewPrompt).map((output) => ({
    id: output.id,
    title: output.title,
    value: output.value,
    placeholder: output.placeholder,
    copyLabel: output.copyLabel,
  }));

  return [...primaryCards, ...fixedFramingCards];
}

export function buildPage1DllPromptSources(previewPrompt) {
  const primarySources = readPrimaryOutputs(previewPrompt).map((output) => ({
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
