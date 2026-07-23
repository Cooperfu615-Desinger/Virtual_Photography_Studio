import {
  AI_PROMPT_LENGTH_CONTRACT,
  countAiPromptWords,
} from './aiPromptLengthContract.js';

const SECTION_ORDER = Object.freeze([
  'imageType',
  'composition',
  'subject',
  'wardrobe',
  'projectedCanonicalPose',
  'scene',
  'imaging',
]);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export function resolveAiPromptPolicyKey({
  characterCard = false,
  completeLook = false,
} = {}) {
  if (characterCard) return 'characterCard';
  if (completeLook) return 'completeLook';
  return 'normal';
}

export function createAiPromptSectionModel({
  policyKey = 'normal',
  sections = [],
} = {}) {
  const budget = AI_PROMPT_LENGTH_CONTRACT.budgets[policyKey];
  if (!budget) throw new Error(`Unknown AI Prompt budget policy: ${policyKey}`);

  const textById = new Map(sections.map((section) => [section.id, String(section.text || '').trim()]));
  const normalizedSections = SECTION_ORDER.map((id) => {
    const text = textById.get(id) || '';
    return {
      id,
      text,
      wordCount: countAiPromptWords(text),
      immutable: AI_PROMPT_LENGTH_CONTRACT.immutableSections.includes(id),
    };
  });
  const totalWords = normalizedSections.reduce((total, section) => total + section.wordCount, 0);

  return deepFreeze({
    policyKey,
    budget: { ...budget },
    sections: normalizedSections,
    measurement: {
      totalWords,
      overTargetWords: Math.max(0, totalWords - budget.targetWords),
      overSoftMaxWords: Math.max(0, totalWords - budget.softMaxWords),
      withinSoftMax: totalWords <= budget.softMaxWords,
    },
  });
}

const REDUCTION_SECTION_ORDER = Object.freeze([
  'imaging',
  'scene',
  'wardrobe',
  'subject',
]);

export function createBudgetedAiPromptSectionModel({
  policyKey = 'normal',
  sections = [],
} = {}) {
  const sectionState = sections.map((section) => ({
    id: section.id,
    text: String(section.text || '').trim(),
    reductions: Array.isArray(section.reductions)
      ? section.reductions.map((value) => String(value || '').trim())
      : [],
  }));
  const initialModel = createAiPromptSectionModel({ policyKey, sections: sectionState });
  let model = initialModel;
  const reductionsApplied = [];

  for (const sectionId of REDUCTION_SECTION_ORDER) {
    const section = sectionState.find((entry) => entry.id === sectionId);
    if (!section) continue;
    for (const reducedText of section.reductions) {
      if (model.measurement.withinSoftMax) break;
      const currentWords = countAiPromptWords(section.text);
      const reducedWords = countAiPromptWords(reducedText);
      if (!reducedText || reducedText === section.text || reducedWords >= currentWords) continue;
      section.text = reducedText;
      reductionsApplied.push({
        sectionId,
        fromWords: currentWords,
        toWords: reducedWords,
      });
      model = createAiPromptSectionModel({ policyKey, sections: sectionState });
    }
    if (model.measurement.withinSoftMax) break;
  }

  return deepFreeze({
    ...model,
    arbitration: {
      initialWords: initialModel.measurement.totalWords,
      finalWords: model.measurement.totalWords,
      reductionsApplied,
    },
  });
}

export function renderAiPromptSectionModel(model) {
  return model.sections
    .map((section) => section.text)
    .filter(Boolean)
    .join('\n\n');
}

export const AI_PROMPT_SECTION_ORDER = SECTION_ORDER;
export const AI_PROMPT_REDUCTION_SECTION_ORDER = REDUCTION_SECTION_ORDER;
