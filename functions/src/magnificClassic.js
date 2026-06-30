const MAGNIFIC_CLASSIC_ASPECT_SIZES = {
  '1:1': 'square_1_1',
  '4:3': 'classic_4_3',
  '3:4': 'traditional_3_4',
  '16:9': 'widescreen_16_9',
  '9:16': 'social_story_9_16',
};

function clampGenerationCount(count) {
  const numericCount = Number(count);
  if (!Number.isFinite(numericCount)) return 1;
  return Math.max(1, Math.min(4, Math.trunc(numericCount)));
}

function getMagnificClassicImageSize(aspectRatio = '9:16') {
  return MAGNIFIC_CLASSIC_ASPECT_SIZES[aspectRatio] || MAGNIFIC_CLASSIC_ASPECT_SIZES['9:16'];
}

function buildMagnificClassicRequest({
  prompt,
  aspectRatio = '9:16',
  count = 1,
  guidanceScale,
  seed,
}) {
  const body = {
    prompt: String(prompt || '').trim(),
    image: {
      size: getMagnificClassicImageSize(aspectRatio),
    },
    num_images: clampGenerationCount(count),
    filter_nsfw: true,
  };

  if (guidanceScale !== undefined && guidanceScale !== null && guidanceScale !== '') {
    body.guidance_scale = Math.max(0, Math.min(2, Number(guidanceScale)));
  }

  if (seed !== undefined && seed !== null && seed !== '') {
    body.seed = Math.max(0, Math.min(1000000, Math.trunc(Number(seed))));
  }

  return body;
}

function parseMagnificClassicResponse(payload) {
  const images = (payload?.data || []).flatMap((image) => {
    if (!image?.base64) return [];
    return [{
      src: `data:image/png;base64,${image.base64}`,
      mimeType: 'image/png',
      hasNsfw: Boolean(image.has_nsfw),
    }];
  });

  return {
    images,
    errors: [],
    meta: payload?.meta || null,
  };
}

module.exports = {
  buildMagnificClassicRequest,
  clampGenerationCount,
  getMagnificClassicImageSize,
  parseMagnificClassicResponse,
};
