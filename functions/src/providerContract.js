const contract = require('../shared/imageProviderContract.json');

function getProviderContract(providerKey) {
  const provider = contract.providers[providerKey];
  if (!provider) throw new Error(`Unsupported provider: ${providerKey}`);
  return provider;
}

function getProviderModelContract(providerKey, modelKey) {
  const provider = getProviderContract(providerKey);
  const normalizedModelKey = String(modelKey || provider.defaultModelKey);
  const model = provider.models[normalizedModelKey];
  if (!model) throw new Error(`Unsupported ${providerKey} model: ${normalizedModelKey}`);
  return { provider, model, modelKey: normalizedModelKey };
}

function clampGenerationCount(count) {
  const bounds = contract.request.count;
  const numericCount = Number(count);
  if (!Number.isFinite(numericCount)) return bounds.default;
  return Math.max(bounds.min, Math.min(bounds.max, Math.trunc(numericCount)));
}

function normalizeAspectRatio(aspectRatio) {
  const value = String(aspectRatio || contract.request.defaultAspectRatio);
  return contract.request.aspectRatios.includes(value)
    ? value
    : contract.request.defaultAspectRatio;
}

function normalizeResolution(model, resolution) {
  const value = String(resolution || model.defaultResolution).toLowerCase();
  return model.resolutions.includes(value) ? value : model.defaultResolution;
}

function normalizeLoraStrength(model, value) {
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

function normalizeGenerationRequest(providerKey, payload = {}) {
  const prompt = String(payload.prompt || '').trim();
  const promptRules = contract.request.prompt;
  if (prompt.length < promptRules.minLength) {
    throw new Error(`Prompt must contain at least ${promptRules.minLength} characters`);
  }
  if (prompt.length > promptRules.maxLength) {
    throw new Error(`Prompt must contain at most ${promptRules.maxLength} characters`);
  }

  const { model, modelKey } = getProviderModelContract(providerKey, payload.modelKey);
  if (model.maxPromptLength && prompt.length > model.maxPromptLength) {
    throw new Error(`Prompt must contain at most ${model.maxPromptLength} characters for this model`);
  }
  return {
    ...payload,
    ...(providerKey === 'comfyCloud' ? normalizeLoraStrength(model, payload.loraStrength) : {}),
    modelKey,
    prompt,
    aspectRatio: model.aspectRatios?.includes(payload.aspectRatio) ? payload.aspectRatio : normalizeAspectRatio(payload.aspectRatio),
    count: Math.min(model.maxCount || contract.request.count.max, clampGenerationCount(payload.count)),
    resolution: normalizeResolution(model, payload.resolution),
  };
}

module.exports = {
  IMAGE_PROVIDER_CONTRACT: contract,
  clampGenerationCount,
  getProviderContract,
  getProviderModelContract,
  normalizeAspectRatio,
  normalizeGenerationRequest,
};
