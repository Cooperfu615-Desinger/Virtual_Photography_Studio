export function buildPage3SavedCard(profile, summary, anchor, prompt, cinematicPrompt, worldPrompt) {
  const safeSummary = summary || '尚未選擇場景條件';

  return {
    id: `page3-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'page3',
    sourceLabel: '場景建模',
    date: new Date().toISOString(),
    summary: `場景建模｜${safeSummary}`,
    summaryFields: {
      characterDna: '-',
      expressionPose: '-',
      wardrobe: '-',
      sceneLook: safeSummary,
    },
    midjourneyPrompt: prompt,
    grokPrompt: cinematicPrompt,
    zImagePrompt: worldPrompt,
    promptLabels: {
      midjourney: 'Scene Prompt',
      grok: 'Cinematic',
      zImage: 'World',
    },
    selection: null,
    structured: {
      'Page3 Scene': [{ zh: safeSummary, en: anchor || 'scene profile anchor' }],
    },
    profile: { ...profile },
  };
}
