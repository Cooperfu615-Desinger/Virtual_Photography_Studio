import {
  OBSERVATION_CAPTURE_ACTIONS,
  OBSERVATION_CAPTURE_DISCOVERY_STATES,
  OBSERVATION_CAPTURE_FOREGROUNDS,
  OBSERVATION_CAPTURE_LENSES,
  OBSERVATION_CAPTURE_LIGHTING,
  OBSERVATION_CAPTURE_POSITIONS,
  OBSERVATION_CAPTURE_SCENES,
  OBSERVATION_CAPTURE_TEXTURES,
} from '../data/observationCapturePromptOptions.js';
import {
  getCompatibleHairVariants,
  getEffectiveCharacterCardWardrobeLayers,
  resolveCharacterCard,
} from './characterCardLab.js';

const DEFAULT_SEED = 1;

function normalizeSeed(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SEED;
  const integer = Math.abs(Math.floor(parsed));
  return integer || DEFAULT_SEED;
}

function cleanText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sentence(value) {
  const text = cleanText(value);
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function createSeededRandom(seed) {
  let state = (normalizeSeed(seed) + 0x6D2B79F5) >>> 0;
  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(options, random) {
  if (!options.length) return null;
  return options[Math.floor(random() * options.length)] || options[0];
}

function pickForKind(options, kind, random) {
  const candidates = options.filter((option) => {
    if (Array.isArray(option.kinds)) return option.kinds.includes(kind);
    return true;
  });
  return pick(candidates.length > 0 ? candidates : options, random);
}

function formatWardrobe(card) {
  const layerMap = getEffectiveCharacterCardWardrobeLayers(card, { eyewearMode: 'default' });
  return Object.values(layerMap)
    .map((layer) => cleanText(layer?.prompt || layer))
    .filter(Boolean);
}

function formatHair(card) {
  const defaultVariant = getCompatibleHairVariants(card).find((variant) => variant.id === 'default')
    || getCompatibleHairVariants(card)[0];
  const hair = cleanText(card?.baseHair);
  const variant = cleanText(defaultVariant?.prompt);
  return [hair, variant].filter(Boolean).join(', ');
}

export function createEmptyObservationCaptureProfile(cards = []) {
  const card = cards[0] || null;
  return {
    characterProfileId: card?.id || '',
    generationSeed: DEFAULT_SEED,
  };
}

export function normalizeObservationCaptureProfile(rawProfile = {}, cards = []) {
  const fallback = createEmptyObservationCaptureProfile(cards);
  const card = resolveCharacterCard(cards, rawProfile?.characterProfileId);
  return {
    characterProfileId: card?.id || fallback.characterProfileId,
    generationSeed: normalizeSeed(rawProfile?.generationSeed),
  };
}

export function buildObservationCapturePrompt(cards = [], rawProfile = {}) {
  const profile = normalizeObservationCaptureProfile(rawProfile, cards);
  const card = resolveCharacterCard(cards, profile.characterProfileId);
  if (!card) {
    return {
      prompt: '',
      summary: '',
      profile,
      card: null,
      selections: null,
    };
  }

  const random = createSeededRandom(profile.generationSeed);
  const scene = pick(OBSERVATION_CAPTURE_SCENES, random);
  const position = pickForKind(OBSERVATION_CAPTURE_POSITIONS, scene.kind, random);
  const foreground = pickForKind(OBSERVATION_CAPTURE_FOREGROUNDS, scene.kind, random);
  const lens = pick(OBSERVATION_CAPTURE_LENSES, random);
  const action = pick(OBSERVATION_CAPTURE_ACTIONS, random);
  const discovery = pick(OBSERVATION_CAPTURE_DISCOVERY_STATES, random);
  const lighting = pickForKind(OBSERVATION_CAPTURE_LIGHTING, scene.kind, random);
  const texture = pick(OBSERVATION_CAPTURE_TEXTURES, random);
  const wardrobe = formatWardrobe(card);
  const identity = [
    cleanText(card.identityAndBody),
    cleanText(card.distinctiveFeatures),
    formatHair(card),
  ].filter(Boolean);

  const paragraphs = [
    sentence('Photorealistic staged candid observation photograph of an adult fictional woman'),
    sentence(identity.join(', ')),
    wardrobe.length > 0
      ? sentence(`She wears ${wardrobe.join(', ')}`)
      : sentence('She wears a simple everyday outfit'),
    sentence(`The scene is ${scene.en}`),
    sentence(`The camera is ${position.en}, using ${lens.en}`),
    sentence(foreground.en),
    sentence(action.en),
    sentence(discovery.en),
    sentence(lighting.en),
    sentence(texture.en),
    sentence('The composition remains off-center and imperfect, with natural proportions, recognizable facial detail, and a believable public everyday atmosphere'),
  ].filter(Boolean);

  return {
    prompt: paragraphs.join('\n\n'),
    summary: [
      card.label,
      scene.zh,
      position.zh,
      lens.zh,
      foreground.zh,
      action.zh,
      discovery.zh,
    ].join(' / '),
    profile,
    card,
    selections: { scene, position, foreground, lens, action, discovery, lighting, texture },
  };
}

export const OBSERVATION_CAPTURE_DEFAULT_SEED = DEFAULT_SEED;
