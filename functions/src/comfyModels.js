const local = (key, textNode, textKey, latentNode, seedNode) => ({
  template: require(`./comfyWorkflows/${key}.json`),
  textNode, textKey, latentNode, seedNode, seedKey: 'seed', seedLimit: 2 ** 48 - 1,
  outputNode: key === 'qwenImage21' ? '461' : '9',
});

const krea = (key) => ({
  template: require(`./comfyWorkflows/${key}.json`),
  textNode: '1', textKey: 'prompt', seedNode: '1', seedKey: 'seed',
  seedLimit: 2 ** 31, outputNode: '2', partnerPricing: true,
  // Krea accepts a native ratio and 1K label, not an explicit pixel canvas.
  // Leave dimensions unknown until an upstream pixel mapping is verified.
  nativeAspectRatio: true,
});

// Official partner node size presets verified 2026-10-06. Unlike local
// diffusion, these APIs do not accept every calculated 8-pixel canvas.
const ideogramSizes = {
  '1k': { '1:1': [1024, 1024], '4:3': [1152, 864], '3:4': [864, 1152],
    '16:9': [1280, 720], '9:16': [720, 1280], '4:5': [896, 1120] },
  '2k': { '1:1': [2048, 2048], '4:3': [2304, 1728], '3:4': [1728, 2304],
    '16:9': [2560, 1440], '9:16': [1440, 2560], '4:5': [1792, 2240] },
};
const seedreamSizes = {
  '1k': { '1:1': [1024, 1024], '4:3': [1152, 864], '3:4': [864, 1152],
    '16:9': [1312, 736], '9:16': [736, 1312], '4:5': [1024, 1280] },
  '2k': { '1:1': [2048, 2048], '4:3': [2304, 1728], '3:4': [1728, 2304],
    '16:9': [2848, 1600], '9:16': [1600, 2848], '4:5': [1792, 2240] },
};
const models = {
  zImageTurbo: local('zImageTurbo', '57:27', 'text', '57:13', '57:3'),
  qwenImage21: local('qwenImage21', '459:452', 'prompt', '459:456', '459:458'),
  zImageTurboInt8: local('zImageTurboInt8', '57:27', 'text', '57:13', '57:3'),
  ideogram45: { template: require('./comfyWorkflows/ideogram45.json'),
    textNode: '1', textKey: 'model.prompt', seedNode: '1', seedKey: 'model.seed',
    seedLimit: 2 ** 31, outputNode: '5', sizes: ideogramSizes, partnerPricing: true },
  seedream5Pro: { template: require('./comfyWorkflows/seedream5Pro.json'),
    textNode: '3', textKey: 'prompt', seedNode: '3', seedKey: 'model.seed',
    seedLimit: 2 ** 31, outputNode: '2', sizes: seedreamSizes, partnerPricing: true },
  krea2Medium: krea('krea2Medium'),
  krea2MediumTurbo: krea('krea2MediumTurbo'),
  krea2Large: krea('krea2Large'),
};

function getComfyModel(modelKey) {
  const model = Object.hasOwn(models, modelKey) && models[modelKey];
  if (!model) throw new Error('不支援的 Comfy Cloud 模型');
  return model;
}

module.exports = { getComfyModel };
