import contract from '../../../functions/shared/imageProviderContract.json' with { type: 'json' };

export const IMAGE_PROVIDER_CONTRACT = contract;

export function getProviderContract(providerKey) {
  const provider = contract.providers[providerKey];
  if (!provider) throw new Error(`Unsupported provider: ${providerKey}`);
  return provider;
}

export function normalizeProviderLoraStrength(model, value) {
  const rules = model.loraStrength;
  if (!rules) {
    if (value !== undefined) throw new Error('此模型不支援調整 LoKr 強度');
    return {};
  }
  const strength = value === undefined ? rules.default : value;
  if (typeof strength !== 'number' || !Number.isFinite(strength) || strength < rules.min || strength > rules.max
    || Math.abs(strength / rules.step - Math.round(strength / rules.step)) > 1e-8) {
    throw new Error('LoKr 強度需為 0～1，且以 0.05 為間距');
  }
  return { loraStrength: Number(strength.toFixed(2)) };
}

export function normalizeProviderGenerationRequest(providerKey, payload = {}) {
  const provider = getProviderContract(providerKey);
  const modelKey = String(payload.modelKey || provider.defaultModelKey);
  const model = provider.models[modelKey];
  if (!model) throw new Error(`Unsupported ${providerKey} model: ${modelKey}`);

  const prompt = String(payload.prompt || '').trim();
  const promptRules = contract.request.prompt;
  if (prompt.length < promptRules.minLength) throw new Error('請先提供至少 3 個字元的 Prompt');
  if (prompt.length > promptRules.maxLength) throw new Error(`Prompt 不可超過 ${promptRules.maxLength} 個字元`);
  if (model.maxPromptLength && prompt.length > model.maxPromptLength) throw new Error(`此模型的 Prompt 不可超過 ${model.maxPromptLength} 個字元`);

  const numericCount = Number(payload.count);
  const count = Number.isFinite(numericCount)
    ? Math.max(contract.request.count.min, Math.min(model.maxCount || contract.request.count.max, Math.trunc(numericCount)))
    : contract.request.count.default;
  const aspectRatio = (model.aspectRatios || contract.request.aspectRatios).includes(payload.aspectRatio)
    ? payload.aspectRatio
    : contract.request.defaultAspectRatio;
  const requestedResolution = String(payload.resolution || model.defaultResolution).toLowerCase();
  const resolution = model.resolutions.includes(requestedResolution)
    ? requestedResolution
    : model.defaultResolution;

  return { ...payload, modelKey, prompt, count, aspectRatio, resolution,
    ...(providerKey === 'comfyCloud' ? normalizeProviderLoraStrength(model, payload.loraStrength) : {}) };
}

export function normalizeProviderGenerationResponse(payload = {}) {
  const images = Array.isArray(payload.images)
    ? payload.images.filter((image) => image?.src && image?.mimeType).map((image) => ({ ...image }))
    : [];
  const errors = Array.isArray(payload.errors) ? payload.errors.map(String) : [];
  return { images, errors, meta: payload.meta ?? null };
}
