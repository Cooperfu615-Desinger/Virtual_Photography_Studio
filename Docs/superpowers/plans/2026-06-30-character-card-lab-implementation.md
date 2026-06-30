# Character Card Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PAGE2's face-only builder with a Character Card Lab that edits built-in character-card variants, emits six prompts, imports structured variants into PAGE1, and removes SUNO from the active app flow.

**Architecture:** Add a focused `characterCardLab.js` module for card extensions, hair variants, six prompt outputs, saved-card creation, and PAGE1 apply helpers. Keep PAGE1 prompt generation in `engine.js`, but split character identity source from wardrobe layer source so imported character-card layers can coexist with PAGE1-filled layers. Update React surfaces in `App.jsx`, `Page2Workspace.jsx`, `Page1Workspace.jsx`, and `PromptCard.jsx` without creating a second PAGE1 inside PAGE2.

**Tech Stack:** Vite, React 19, JavaScript modules, Node.js `node --test`, ESLint, existing localStorage/Firebase Saved Cards serialization.

---

## Scope Check

This plan covers two related product changes from the approved spec:

- Character Card Lab and PAGE1 import/merge behavior.
- SUNO removal from active navigation while retaining old `page5` saved-card display compatibility.

The tasks are ordered so each commit leaves the app in a testable state. SUNO removal is last because it depends on Saved Cards continuing to render legacy cards.

## File Structure

- Create `webapp/src/lib/characterCardLab.js`
  - Owns character-card layer extension data, hair variant filtering, PAGE2 prompt builders, PAGE2 saved-card builder, and PAGE1 structured apply helper.
- Create `webapp/src/lib/characterCardLab.test.js`
  - Unit tests for card resolution, hair variants, six outputs, saved-card shape, and PAGE1 apply helper.
- Modify `webapp/src/lib/engine.js`
  - Add character-card variant lock fields, normalize them, build imported card wardrobe layers, and merge those layers into prompt output.
- Create `webapp/src/lib/engineCharacterCardVariant.test.js`
  - Engine-level tests for PAGE1 prompt generation with imported card layers and PAGE1-filled missing layers.
- Replace `webapp/src/components/Page2Workspace.jsx`
  - Turn PAGE2 into the Character Card Lab UI.
- Modify `webapp/src/App.jsx`
  - Remove old PAGE2 builder helpers, wire new PAGE2 profile state, handle structured apply and prompt override, keep legacy saved-card sanitization.
- Modify `webapp/src/components/Page1Workspace.jsx`
  - Display imported card layer rows in PAGE1 C wardrobe while preserving normal PAGE1 controls.
- Modify `webapp/src/lib/page1WorkspaceSummary.js`
  - Summarize imported card layers and character-card hair variant.
- Modify `webapp/src/components/PromptCard.jsx`
  - Support `extraPrompts` so PAGE2 saved cards can show six outputs.
- Modify `webapp/src/components/SavedCardsWorkspace.jsx`
  - Remove active SUNO source filter while keeping old `page5` cards visible under all sources.
- Modify `webapp/src/App.css` and `webapp/src/index.css`
  - Add Character Card Lab layout and imported-layer badges using existing panel styles.
- Later task removes active SUNO imports/rendering from `webapp/src/App.jsx`, but leaves `webapp/src/lib/suno.js` readable until old-card retirement.

---

### Task 1: Add Character Card Lab Data And Variant Helpers

**Files:**
- Create: `webapp/src/lib/characterCardLab.js`
- Create: `webapp/src/lib/characterCardLab.test.js`

- [ ] **Step 1: Write failing tests for card resolution and hair variants**

Create `webapp/src/lib/characterCardLab.test.js` with:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLockControls } from './engine.js';
import {
  CHARACTER_CARD_LAYER_KEYS,
  createEmptyCharacterCardVariant,
  getCharacterCardOptions,
  getCompatibleHairVariants,
  normalizeCharacterCardVariant,
  resolveCharacterCard,
} from './characterCardLab.js';

test('character card options are read from PAGE1 character profile control', () => {
  const cards = getCharacterCardOptions(getLockControls());

  assert.ok(cards.length >= 10);
  assert.equal(cards[0].id, 'character-rika');
  assert.equal(cards[0].label, '11_Rika');
  assert.match(cards[0].identityAndBody, /soft doll-like indie-girl facial features/i);
  assert.match(cards[0].baseHair, /glossy natural black long wavy hair/i);
  assert.equal(cards[0].defaultWardrobeLayers.top.label, '上身');
  assert.match(cards[0].defaultWardrobeLayers.top.prompt, /cropped white short-sleeve baby tee/i);
  assert.equal(cards[0].defaultWardrobeLayers.bottom.label, '下身');
  assert.match(cards[0].defaultWardrobeLayers.bottom.prompt, /low-rise light-wash blue jeans/i);
  assert.equal(cards[0].defaultWardrobeLayers.neckAccessory.label, '脖子飾品');
});

test('hair variants use shared compatibility plus per-card overrides', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const rika = cards.find((card) => card.id === 'character-rika');
  const hina = cards.find((card) => card.id === 'character-hina');
  const rikaVariants = getCompatibleHairVariants(rika);
  const hinaVariants = getCompatibleHairVariants(hina);

  assert.ok(rikaVariants.some((variant) => variant.id === 'low-ponytail'));
  assert.ok(rikaVariants.some((variant) => variant.id === 'highlight-streaks'));
  assert.equal(rikaVariants.some((variant) => variant.id === 'slicked-back-wet-look'), false);
  assert.ok(hinaVariants.some((variant) => variant.id === 'slicked-back-wet-look'));
  assert.equal(hinaVariants.some((variant) => variant.id === 'twin-tails'), false);
});

test('variant normalization keeps only valid card layers and hair variants', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const normalized = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top', 'bottom', 'missing-layer'],
    outputMode: 'included-wardrobe',
  }, cards);

  assert.equal(normalized.characterProfileId, 'character-rika');
  assert.equal(normalized.hairVariantId, 'low-ponytail');
  assert.deepEqual(normalized.includedWardrobeLayers, ['top', 'bottom']);
  assert.equal(normalized.outputMode, 'included-wardrobe');

  const empty = createEmptyCharacterCardVariant(cards);
  assert.equal(empty.characterProfileId, 'character-rika');
  assert.equal(empty.hairVariantId, 'default');
  assert.deepEqual(empty.includedWardrobeLayers, CHARACTER_CARD_LAYER_KEYS.filter((key) => resolveCharacterCard(cards, 'character-rika').defaultWardrobeLayers[key]));
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
cd webapp
npm test -- src/lib/characterCardLab.test.js
```

Expected: FAIL because `characterCardLab.js` does not exist.

- [ ] **Step 3: Implement `characterCardLab.js` data helpers**

Create `webapp/src/lib/characterCardLab.js` with:

```js
export const CHARACTER_CARD_LAYER_KEYS = [
  'top',
  'bottom',
  'dress',
  'outerwear',
  'shoes',
  'headAccessory',
  'eyewear',
  'earrings',
  'neckAccessory',
  'wristAccessory',
  'ring',
  'waistAccessory',
];

export const CHARACTER_CARD_LAYER_LABELS = {
  top: '上身',
  bottom: '下身',
  dress: '連身',
  outerwear: '外套',
  shoes: '鞋子',
  headAccessory: '頭飾',
  eyewear: '眼鏡',
  earrings: '耳環',
  neckAccessory: '脖子飾品',
  wristAccessory: '手部飾品',
  ring: '戒指',
  waistAccessory: '腰部飾品',
};

const CHARACTER_CARD_EXTENSIONS = {
  'character-rika': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair'],
    disabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'fitted cropped white short-sleeve baby tee with a small minimalist black line-art chest graphic',
      bottom: 'slightly loose low-rise light-wash blue jeans with relaxed straight legs and soft vintage fading',
      shoes: 'clean white low-top sneakers',
      neckAccessory: 'black-and-white beaded choker necklace',
      waistAccessory: 'small silver ring keychain clipped to the front belt loop',
    },
  },
  'character-48g': {
    hairTags: ['medium', 'lob', 'straight', 'bangs', 'black-hair'],
    wardrobeLayers: {
      outerwear: 'taupe-gray cropped hooded zip jacket worn open with the hood usually worn up framing the hair',
      top: 'black lace bralette neckline',
      bottom: 'low-rise faded blue denim mini skirt worn unbuttoned with the zipper slightly pulled down and visible thin-strap black lace thong waistband underneath',
      shoes: 'black lace-up ankle boots with glossy rounded toes',
      waistAccessory: 'small off-white shoulder bag with thin black strap',
    },
  },
  'character-philippa': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair', 'dip-dye'],
    wardrobeLayers: {
      dress: 'black high-neck gothic lace dress with sheer mesh long sleeves, black floral lace sleeve appliques across shoulders and arms, fitted black lace bodice with subtle beadwork, floor-length translucent black tulle skirt overlay with trailing hem',
      shoes: 'black elegant dress shoes',
    },
  },
  'character-lily': {
    hairTags: ['long', 'wavy', 'bangs', 'red-hair', 'dyed'],
    wardrobeLayers: {
      outerwear: 'black shaggy faux-fur off-shoulder mini coat worn as the main garment, plush high-pile texture, deep V neckline, bare shoulders and collarbones, oversized sleeves, mini-length hem',
      top: 'minimal black inner layer kept subtle under the coat',
      shoes: 'black ankle-strap stiletto sandals with thin straps and open toes',
    },
  },
  'character-hinata': {
    hairTags: ['bob', 'medium', 'wavy', 'dyed', 'center-part'],
    wardrobeLayers: {
      top: 'deep cobalt blue cable-knit turtleneck cutout bodysuit sweater with thick ribbed high collar, fitted long sleeves, vertical cable texture, sculpted bust-waist contour, large side-waist cutout openings exposing both sides of the narrow waist and upper hips',
      bottom: 'medium-wash skinny blue jeans with natural denim fading',
      shoes: 'black leather ankle boots with rounded toes and low block heels',
      waistAccessory: 'black leather belt with small silver buckle',
    },
  },
  'character-rin': {
    hairTags: ['short', 'bob', 'curly', 'bangs', 'black-hair'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'crisp white oversized button-down shirt with open collar, relaxed dropped shoulders, sleeves rolled to the forearms, slightly loose tucked-in fabric',
      bottom: 'charcoal high-waisted tailored straight trousers with pressed front crease and clean waistband',
      shoes: 'black leather loafers with low stacked heels',
      eyewear: 'signature thin rectangular brown-gold metal frame eyeglasses with transparent lenses',
      earrings: 'stacked twin gold hoop earrings on both ears',
      neckAccessory: 'layered delicate gold necklaces with tiny pendant charms',
    },
  },
  'character-sakura': {
    hairTags: ['long', 'wavy', 'bangs', 'brown-hair', 'pink-streaks'],
    wardrobeLayers: {
      headAccessory: 'white plush bunny-eared hood with floppy long ears, pink inner ears, cute black cartoon eyes, small pink nose, soft white plush fur texture, tiny white fang-like teeth along the hood opening',
      top: 'oversized ivory-white fleece pullover hoodie with dropped shoulders, long loose sleeves, front kangaroo pocket and white drawstrings',
      bottom: 'relaxed beige oatmeal sweatpants with soft brushed knit texture and straight loose legs',
      shoes: 'clean white low-top sneakers',
    },
  },
  'character-sui': {
    hairTags: ['long', 'wavy', 'bangs', 'black-hair'],
    wardrobeLayers: {
      outerwear: 'mustard yellow oversized knit cardigan with chunky fuzzy texture, deep V open front, wooden buttons, relaxed dropped shoulders, long loose sleeves with ribbed cuffs, small white fuzzy floral embroidery scattered on the cardigan',
      top: 'cream ribbed knit camisole with a scoop neckline underneath',
      bottom: 'high-waisted medium-dark blue straight-leg jeans with natural denim fading',
      shoes: 'brown leather ankle boots with rounded toes and low stacked heels',
      neckAccessory: 'delicate gold necklace with a small red-orange oval pendant',
    },
  },
  'character-yuri': {
    hairTags: ['long', 'straight', 'bangs', 'black-hair'],
    wardrobeLayers: {
      top: 'white ribbed off-shoulder cropped long-sleeve top with exposed shoulders, fitted sleeves, small front buttons, vintage black graphic print across the chest and delicate lace trim along the cropped hem',
      bottom: 'low-rise medium-wash blue flared jeans with natural fading',
      shoes: 'brown low-top canvas sneakers with cream rubber soles and white laces',
      eyewear: 'round translucent brown acetate eyeglasses with thin metal temples',
      neckAccessory: 'black choker necklace with small silver charm details',
      wristAccessory: 'stacked silver bangles and rings',
      waistAccessory: 'decorated leather belt with large oval western-style belt buckle and metal-stud chain detail',
    },
  },
  'character-hina': {
    hairTags: ['short', 'bob', 'bangs', 'dyed'],
    enabledHairVariants: ['slicked-back-wet-look'],
    wardrobeLayers: {
      top: 'loose sage-mint green sleeveless tunic tank top with soft washed cotton texture, round crew neckline, oversized A-line drape, wide armholes with a subtle black inner layer visible at the side',
      bottom: 'matching sage-mint green relaxed short shorts',
      shoes: 'bare feet as the locked footwear state',
      eyewear: 'round thin black metal eyeglasses',
    },
  },
};

export const HAIR_VARIANT_OPTIONS = [
  { id: 'default', label: '保留預設髮型', compatibleTags: [], prompt: 'keep the original character hair identity unchanged' },
  { id: 'low-ponytail', label: '低馬尾', compatibleTags: ['long', 'medium-long'], prompt: 'keep the original hair identity, gather the hair length into a loose low ponytail while preserving bangs, hair color, texture, and face-framing strands' },
  { id: 'high-ponytail', label: '高馬尾', compatibleTags: ['long'], prompt: 'keep the original hair identity, tie the hair into a high ponytail with natural volume while preserving bangs, hair color, texture, and face-framing strands' },
  { id: 'twin-tails', label: '雙馬尾', compatibleTags: ['long'], prompt: 'keep the original hair identity, style the length into loose twin tails while preserving bangs, hair color, texture, and face-framing strands' },
  { id: 'half-up', label: '半綁髮', compatibleTags: ['long', 'medium', 'lob'], prompt: 'keep the original hair identity, pull the upper hair into a soft half-up style while leaving the remaining length visible' },
  { id: 'loose-bun', label: '鬆散髮髻', compatibleTags: ['long', 'medium-long'], prompt: 'keep the original hair identity, gather the hair into a loose relaxed bun with natural loose strands around the face' },
  { id: 'tucked-behind-ears', label: '耳後收整', compatibleTags: ['short', 'bob', 'lob', 'medium'], prompt: 'keep the original hair identity, tuck part of the hair behind the ears while preserving length, bangs, color, and texture' },
  { id: 'outward-flipped-ends', label: '髮尾外翹', compatibleTags: ['short', 'bob', 'lob', 'medium'], prompt: 'keep the original hair identity, style the ends with a subtle outward flip and polished shape' },
  { id: 'slicked-back-wet-look', label: '油頭濕髮感', compatibleTags: ['short', 'bob'], prompt: 'keep the original hair identity, style the hair into a sleek wet-look swept-back finish while preserving the character hair color and cut length' },
  { id: 'highlight-streaks', label: '增加局部挑染', compatibleTags: ['long', 'medium', 'lob', 'bob', 'short'], prompt: 'keep the original hair identity, add subtle localized highlight streaks without changing the base hair color or haircut' },
  { id: 'hair-clips', label: '局部髮夾', compatibleTags: ['long', 'medium', 'lob', 'bob', 'short', 'bangs'], prompt: 'keep the original hair identity, add small understated hair clips near one side while preserving the original silhouette' },
];

function normalizeLayerMap(layerMap = {}) {
  return Object.fromEntries(
    CHARACTER_CARD_LAYER_KEYS
      .map((key) => {
        const prompt = String(layerMap[key] || '').trim();
        if (!prompt) return null;
        return [key, { key, label: CHARACTER_CARD_LAYER_LABELS[key], prompt }];
      })
      .filter(Boolean)
  );
}

export function getCharacterCardOptions(lockControls = []) {
  const control = lockControls.find((item) => item.key === 'characterProfileId');
  return (control?.options || [])
    .filter((option) => option.specialSubject === 'character-profile')
    .map((option) => {
      const extension = CHARACTER_CARD_EXTENSIONS[option.id] || {};
      return {
        id: option.id,
        label: option.zh,
        sourceOption: option,
        identityAndBody: option.profile?.identityAndBody || '',
        face: option.profile?.identityAndBody || '',
        skin: option.profile?.identityAndBody || '',
        makeup: option.profile?.identityAndBody || '',
        baseHair: option.profile?.hair || '',
        photographicDirection: option.profile?.photographicDirection || '',
        referenceImages: option.referenceImages || [],
        primaryReferenceImage: option.meta?.referenceImage || '',
        hairTags: extension.hairTags || [],
        enabledHairVariants: extension.enabledHairVariants || [],
        disabledHairVariants: extension.disabledHairVariants || [],
        defaultWardrobeLayers: normalizeLayerMap(extension.wardrobeLayers),
      };
    });
}

export function resolveCharacterCard(cards, id) {
  return cards.find((card) => card.id === id) || cards[0] || null;
}

export function getCompatibleHairVariants(card) {
  if (!card) return HAIR_VARIANT_OPTIONS.filter((variant) => variant.id === 'default');
  const tags = new Set(card.hairTags || []);
  const enabled = new Set(card.enabledHairVariants || []);
  const disabled = new Set(card.disabledHairVariants || []);
  return HAIR_VARIANT_OPTIONS.filter((variant) => {
    if (disabled.has(variant.id)) return false;
    if (variant.id === 'default' || enabled.has(variant.id)) return true;
    return variant.compatibleTags.some((tag) => tags.has(tag));
  });
}

export function createEmptyCharacterCardVariant(cards = []) {
  const card = cards[0] || null;
  return {
    characterProfileId: card?.id || '',
    hairVariantId: 'default',
    includedWardrobeLayers: card ? Object.keys(card.defaultWardrobeLayers) : [],
    promptOverrideText: '',
    outputMode: 'included-wardrobe',
  };
}

export function normalizeCharacterCardVariant(rawVariant = {}, cards = []) {
  const fallback = createEmptyCharacterCardVariant(cards);
  const characterProfileId = resolveCharacterCard(cards, rawVariant.characterProfileId)?.id || fallback.characterProfileId;
  const card = resolveCharacterCard(cards, characterProfileId);
  const hairVariants = getCompatibleHairVariants(card);
  const hairVariantId = hairVariants.some((variant) => variant.id === rawVariant.hairVariantId)
    ? rawVariant.hairVariantId
    : 'default';
  const validLayers = new Set(Object.keys(card?.defaultWardrobeLayers || {}));
  const includedWardrobeLayers = Array.isArray(rawVariant.includedWardrobeLayers)
    ? rawVariant.includedWardrobeLayers.filter((key) => validLayers.has(key))
    : fallback.includedWardrobeLayers;
  const outputMode = rawVariant.outputMode === 'pure-character' ? 'pure-character' : 'included-wardrobe';

  return {
    characterProfileId,
    hairVariantId,
    includedWardrobeLayers,
    promptOverrideText: String(rawVariant.promptOverrideText || ''),
    outputMode,
  };
}
```

- [ ] **Step 4: Run the focused test**

Run:

```bash
cd webapp
npm test -- src/lib/characterCardLab.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add webapp/src/lib/characterCardLab.js webapp/src/lib/characterCardLab.test.js
git commit -m "Add character card lab data helpers"
```

Expected: commit succeeds.

---

### Task 2: Add Six PAGE2 Prompt Outputs And Saved-Card Shape

**Files:**
- Modify: `webapp/src/lib/characterCardLab.js`
- Modify: `webapp/src/lib/characterCardLab.test.js`

- [ ] **Step 1: Add failing tests for six prompts and saved-card serialization input**

Append to `webapp/src/lib/characterCardLab.test.js`:

```js
import {
  buildCharacterCardPromptBundle,
  buildCharacterCardSavedCard,
} from './characterCardLab.js';

test('prompt bundle returns six copyable character-card outputs', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const variant = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top'],
    outputMode: 'included-wardrobe',
  }, cards);
  const bundle = buildCharacterCardPromptBundle(cards, variant);

  assert.deepEqual(bundle.outputs.map((output) => output.id), [
    'gpt',
    'grok-z-image',
    'ai',
    'headshot',
    'four-view',
    'full-body-reference',
  ]);
  assert.match(bundle.outputs[0].value, /Character Profile Card:\n11_Rika/i);
  assert.match(bundle.outputs[0].value, /low ponytail/i);
  assert.match(bundle.outputs[0].value, /cropped white short-sleeve baby tee/i);
  assert.doesNotMatch(bundle.outputs[0].value, /low-rise light-wash blue jeans/i);
  assert.match(bundle.outputs[3].value, /headshot reference/i);
  assert.match(bundle.outputs[4].value, /front view/i);
  assert.match(bundle.outputs[5].value, /full-body character reference/i);
});

test('pure-character prompt keeps hair variant and excludes wardrobe layers', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const variant = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: [],
    outputMode: 'pure-character',
  }, cards);
  const bundle = buildCharacterCardPromptBundle(cards, variant);
  const combined = bundle.outputs.map((output) => output.value).join('\n');

  assert.match(combined, /soft doll-like indie-girl facial features/i);
  assert.match(combined, /low ponytail/i);
  assert.doesNotMatch(combined, /baby tee|jeans|sneakers|choker/i);
});

test('PAGE2 character card saved card stores six outputs', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const variant = normalizeCharacterCardVariant({
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top'],
    outputMode: 'included-wardrobe',
  }, cards);
  const bundle = buildCharacterCardPromptBundle(cards, variant);
  const card = buildCharacterCardSavedCard(cards, variant, bundle);

  assert.equal(card.source, 'page2');
  assert.equal(card.sourceLabel, '角色卡');
  assert.equal(card.promptLabels.grok, 'GPT Prompt');
  assert.equal(card.promptLabels.midjourney, 'AI Prompt');
  assert.equal(card.promptLabels.zImage, 'Grok/Z-Image Prompt');
  assert.equal(card.extraPrompts.length, 3);
  assert.deepEqual(card.profile.includedWardrobeLayers, ['top']);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
cd webapp
npm test -- src/lib/characterCardLab.test.js
```

Expected: FAIL because prompt builders are not exported.

- [ ] **Step 3: Implement prompt bundle and saved-card helpers**

Append to `webapp/src/lib/characterCardLab.js`:

```js
function cleanSentence(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function selectedHairVariant(card, variant) {
  return getCompatibleHairVariants(card).find((item) => item.id === variant.hairVariantId)
    || HAIR_VARIANT_OPTIONS[0];
}

function selectedLayers(card, variant) {
  const layerMap = card?.defaultWardrobeLayers || {};
  const included = new Set(variant.includedWardrobeLayers || []);
  if (variant.outputMode === 'pure-character') return [];
  return CHARACTER_CARD_LAYER_KEYS
    .filter((key) => included.has(key) && layerMap[key])
    .map((key) => layerMap[key]);
}

function buildLayerText(layers) {
  return layers.map((layer) => `${layer.label}: ${layer.prompt}`).join('\n');
}

function buildCharacterIdentityText(card, hairVariant) {
  return [
    `Character Profile Card:\n${card.label}`,
    `Identity and body:\n${cleanSentence(card.identityAndBody)}`,
    `Hair:\n${cleanSentence(`${card.baseHair}, ${hairVariant.prompt}`)}`,
    `Photographic direction:\n${cleanSentence(card.photographicDirection || 'photorealistic editorial portrait, coherent facial identity, natural photographic detail')}`,
  ].join('\n\n');
}

export function buildCharacterCardPromptBundle(cards = [], rawVariant = {}) {
  const variant = normalizeCharacterCardVariant(rawVariant, cards);
  const card = resolveCharacterCard(cards, variant.characterProfileId);
  if (!card) return { card: null, variant, outputs: [], summary: '' };

  const hairVariant = selectedHairVariant(card, variant);
  const layers = selectedLayers(card, variant);
  const wardrobeText = buildLayerText(layers);
  const wardrobeBlock = wardrobeText ? `\n\nWardrobe layers:\n${wardrobeText}` : '';
  const identityText = buildCharacterIdentityText(card, hairVariant);
  const summary = `${card.label} / ${hairVariant.label}${layers.length ? ` / ${layers.map((layer) => layer.label).join('、')}` : ' / 純人物'}`;
  const gpt = [
    'Image Type:\nCreate a photorealistic character-card portrait reference.',
    `Subject:\n${identityText}${wardrobeBlock}`,
    'Camera Look:\nclean realistic character reference, neutral production-ready detail, consistent identity, realistic facial proportions',
  ].join('\n\n');
  const grokZImage = cleanSentence([
    `Create a natural photorealistic character reference of ${card.label}`,
    card.identityAndBody,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `included wardrobe layers: ${layers.map((layer) => layer.prompt).join(', ')}` : 'no clothing layers included, focus on identity and hair',
    card.photographicDirection,
  ].filter(Boolean).join(', '));
  const ai = cleanSentence([
    `Photorealistic character reference of ${card.label}`,
    card.identityAndBody,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `wearing ${layers.map((layer) => layer.prompt).join(', ')}` : 'pure character identity and hair reference',
  ].filter(Boolean).join(', '));
  const headshot = cleanSentence([
    `headshot reference of ${card.label}`,
    'tight face-and-hair portrait, neutral clean background, consistent facial identity',
    card.identityAndBody,
    `${card.baseHair}, ${hairVariant.prompt}`,
    'clear skin texture, makeup, eyes, nose, lips, jawline, and hairline',
  ].join(', '));
  const fourView = cleanSentence([
    `four-view character reference sheet for ${card.label}`,
    'one image containing front view, left 45-degree view, side profile view, and back view',
    'same exact woman in every panel, matched facial proportions, consistent hair silhouette',
    card.identityAndBody,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `use the included wardrobe layers consistently: ${layers.map((layer) => layer.prompt).join(', ')}` : 'no clothing design emphasis, neutral shoulders and body reference',
  ].join(', '));
  const fullBody = cleanSentence([
    `full-body character reference of ${card.label}`,
    'neutral studio reference, clear standing full-body view, same exact identity',
    card.identityAndBody,
    `${card.baseHair}, ${hairVariant.prompt}`,
    layers.length ? `included wardrobe layers: ${layers.map((layer) => layer.prompt).join(', ')}` : 'pure body and hair reference without fixed outfit design',
  ].join(', '));

  return {
    card,
    variant,
    summary,
    outputs: [
      { id: 'gpt', label: 'GPT Prompt', value: gpt },
      { id: 'grok-z-image', label: 'Grok/Z-Image Prompt', value: grokZImage },
      { id: 'ai', label: 'AI Prompt', value: ai },
      { id: 'headshot', label: 'Headshot Prompt', value: headshot },
      { id: 'four-view', label: 'Four-View Prompt', value: fourView },
      { id: 'full-body-reference', label: 'Full-Body Reference Prompt', value: fullBody },
    ],
  };
}

export function buildCharacterCardSavedCard(cards = [], rawVariant = {}, bundle = null) {
  const resolvedBundle = bundle || buildCharacterCardPromptBundle(cards, rawVariant);
  const gpt = resolvedBundle.outputs.find((output) => output.id === 'gpt')?.value || '';
  const grokZImage = resolvedBundle.outputs.find((output) => output.id === 'grok-z-image')?.value || '';
  const ai = resolvedBundle.outputs.find((output) => output.id === 'ai')?.value || '';
  const extraPrompts = resolvedBundle.outputs
    .filter((output) => !['gpt', 'grok-z-image', 'ai'].includes(output.id))
    .map((output) => ({ id: output.id, label: output.label, text: output.value }));

  return {
    id: `page2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    source: 'page2',
    sourceLabel: '角色卡',
    date: new Date().toISOString(),
    summary: `角色卡｜${resolvedBundle.summary}`,
    summaryFields: {
      characterDna: resolvedBundle.card?.label || '-',
      expressionPose: resolvedBundle.outputs.find((output) => output.id === 'headshot')?.label || '-',
      wardrobe: resolvedBundle.variant.includedWardrobeLayers.join('、') || '純人物',
      sceneLook: '-',
    },
    midjourneyPrompt: ai,
    grokPrompt: gpt,
    zImagePrompt: grokZImage,
    promptLabels: {
      midjourney: 'AI Prompt',
      grok: 'GPT Prompt',
      zImage: 'Grok/Z-Image Prompt',
    },
    extraPrompts,
    selection: null,
    structured: {
      'Character Card': [
        { zh: resolvedBundle.card?.label || '角色卡', en: resolvedBundle.summary },
      ],
    },
    profile: { ...resolvedBundle.variant },
  };
}
```

- [ ] **Step 4: Run the focused test**

Run:

```bash
cd webapp
npm test -- src/lib/characterCardLab.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add webapp/src/lib/characterCardLab.js webapp/src/lib/characterCardLab.test.js
git commit -m "Add character card prompt bundle"
```

Expected: commit succeeds.

---

### Task 3: Persist Character-Card Variant Locks In Engine

**Files:**
- Modify: `webapp/src/lib/engine.js`
- Create: `webapp/src/lib/engineCharacterCardVariant.test.js`

- [ ] **Step 1: Write failing engine tests for new lock fields**

Create `webapp/src/lib/engineCharacterCardVariant.test.js` with:

```js
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createEmptyLocks, generatePrompts, getLockControls, normalizeLocks } from './engine.js';

function optionId(controlKey, zh) {
  const control = getLockControls().find((entry) => entry.key === controlKey);
  assert.ok(control, `Expected control ${controlKey}`);
  const option = control.options.find((entry) => entry.zh === zh);
  assert.ok(option, `Expected option ${zh} in ${controlKey}`);
  return option.id;
}

test('normalizeLocks preserves character card variant fields', () => {
  const locks = normalizeLocks({
    characterProfileId: 'character-rika',
    characterCardHairVariantId: 'low-ponytail',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top', 'bottom'],
    characterCardPromptOverride: 'temporary override text',
  });

  assert.equal(locks.characterProfileId, 'character-rika');
  assert.equal(locks.characterCardHairVariantId, 'low-ponytail');
  assert.equal(locks.characterCardWardrobeMode, 'selected-layers');
  assert.deepEqual(locks.characterCardWardrobeLayerIds, ['top', 'bottom']);
  assert.equal(locks.characterCardPromptOverride, 'temporary override text');
});

test('plain PAGE1 character card keeps full default wardrobe for old behavior', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
  });
  const text = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.match(text, /cropped white short-sleeve baby tee/i);
  assert.match(text, /low-rise light-wash blue jeans/i);
  assert.match(text, /white low-top sneakers/i);
  assert.match(text, /beaded choker/i);
});

test('character card variant can include selected card layers and PAGE1 missing layers', () => {
  const [prompt] = generatePrompts(1, {
    ...createEmptyLocks(),
    characterProfileId: 'character-rika',
    characterCardHairVariantId: 'low-ponytail',
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: ['top'],
    skirtId: optionId('skirtId', '牛仔短裙'),
    shoesId: optionId('shoesId', '高跟鞋'),
    neckAccessoryId: optionId('neckAccessoryId', '鎖骨細金屬鏈'),
  });
  const text = [prompt.grokPrompt, prompt.zImagePrompt, prompt.midjourneyPrompt].join('\n');

  assert.equal(prompt.selection.characterProfileId, 'character-rika');
  assert.equal(prompt.selection.characterCardHairVariantId, 'low-ponytail');
  assert.deepEqual(prompt.selection.characterCardWardrobeLayerIds, ['top']);
  assert.match(text, /low ponytail/i);
  assert.match(text, /cropped white short-sleeve baby tee/i);
  assert.match(text, /denim short skirt|牛仔/i);
  assert.match(text, /high heels|高跟鞋/i);
  assert.match(text, /collarbone|鎖骨/i);
  assert.doesNotMatch(text, /low-rise light-wash blue jeans/i);
  assert.doesNotMatch(text, /white low-top sneakers/i);
  assert.ok(prompt.structured.Wardrobe.length > 0);
});
```

- [ ] **Step 2: Run the engine test to verify it fails**

Run:

```bash
cd webapp
npm test -- src/lib/engineCharacterCardVariant.test.js
```

Expected: FAIL because the new lock fields and merge behavior do not exist.

- [ ] **Step 3: Add hidden lock definitions**

In `webapp/src/lib/engine.js`, add hidden definitions immediately after `characterProfileId` in `LOCK_DEFINITIONS`:

```js
  { key: 'characterCardHairVariantId', label: '角色卡髮型變化', defaultValue: 'default', section: 'hidden' },
  { key: 'characterCardWardrobeMode', label: '角色卡服裝模式', defaultValue: 'full-default', section: 'hidden' },
  { key: 'characterCardWardrobeLayerIds', label: '角色卡服裝層', defaultValue: [], multi: true, section: 'hidden' },
  { key: 'characterCardPromptOverride', label: '角色卡臨時覆寫', defaultValue: '', section: 'hidden' },
```

- [ ] **Step 4: Import character-card helpers into engine**

At the top of `webapp/src/lib/engine.js`, add:

```js
import {
  CHARACTER_CARD_LAYER_KEYS,
  getCharacterCardOptions,
  getCompatibleHairVariants,
  normalizeCharacterCardVariant,
} from './characterCardLab.js';
```

- [ ] **Step 5: Add engine-side card variant helpers**

Near `getCharacterProfileOption()` in `webapp/src/lib/engine.js`, add:

```js
function getRuntimeCharacterCards() {
  return getCharacterCardOptions(getLockControls());
}

function getCharacterCardVariantFromLocks(locks) {
  const card = getRuntimeCharacterCards().find((entry) => entry.id === locks.characterProfileId);
  const fullDefaultLayers = card ? Object.keys(card.defaultWardrobeLayers) : [];
  const wardrobeMode = locks.characterCardWardrobeMode || 'full-default';
  return normalizeCharacterCardVariant({
    characterProfileId: locks.characterProfileId,
    hairVariantId: locks.characterCardHairVariantId,
    includedWardrobeLayers: wardrobeMode === 'full-default' ? fullDefaultLayers : locks.characterCardWardrobeLayerIds,
    promptOverrideText: locks.characterCardPromptOverride,
    outputMode: wardrobeMode === 'full-default' || (Array.isArray(locks.characterCardWardrobeLayerIds) && locks.characterCardWardrobeLayerIds.length > 0)
      ? 'included-wardrobe'
      : 'pure-character',
  }, getRuntimeCharacterCards());
}

function buildCharacterCardHairVariantText(subject, locks) {
  if (!isCharacterProfileSubject(subject)) return '';
  const card = getRuntimeCharacterCards().find((entry) => entry.id === subject.id);
  const variant = getCharacterCardVariantFromLocks(locks || {});
  const hairVariant = getCompatibleHairVariants(card).find((entry) => entry.id === variant.hairVariantId);
  const promptOverride = String(variant.promptOverrideText || '').trim();
  const hairText = !hairVariant || hairVariant.id === 'default' ? '' : hairVariant.prompt;
  return [hairText, promptOverride].filter(Boolean).join(', ');
}

function getCharacterCardImportedLayers(subject, locks) {
  if (!isCharacterProfileSubject(subject)) return [];
  const card = getRuntimeCharacterCards().find((entry) => entry.id === subject.id);
  if (!card) return [];
  const variant = getCharacterCardVariantFromLocks(locks || {});
  const included = new Set(variant.includedWardrobeLayers || []);
  return CHARACTER_CARD_LAYER_KEYS
    .filter((key) => included.has(key) && card.defaultWardrobeLayers[key])
    .map((key) => {
      const layer = card.defaultWardrobeLayers[key];
      return {
        id: `character-card-layer:${subject.id}:${key}`,
        zh: `來自角色卡｜${layer.label}`,
        en: layer.prompt,
        desc: layer.prompt,
        meta: { characterCardLayer: key },
      };
    });
}
```

- [ ] **Step 6: Add a dedicated-special-subject gate**

In `webapp/src/lib/engine.js`, add this helper after `isCharacterProfileSubject(subject)`:

```js
function isDedicatedSpecialSubject(subject) {
  return isSpecialSubject(subject) && !isCharacterProfileSubject(subject);
}
```

In `buildStructuredGrokPrompt()` and `buildZImagePrompt()`, change:

```js
  const specialSubjectMode = isSpecialSubject(context.subject);
```

to:

```js
  const specialSubjectMode = isDedicatedSpecialSubject(context.subject);
```

This keeps skeleton/warrior/android wardrobe behavior unchanged while allowing character-card subjects to emit selected card layers plus PAGE1-filled wardrobe layers.

- [ ] **Step 7: Use hair variant and included wardrobe layers in character profile prompt blocks**

In `buildGptCharacterProfileSubjectBlock(subject)`, change the signature to:

```js
function buildGptCharacterProfileSubjectBlock(subject, locks = {}) {
```

Add this helper directly above it:

```js
function buildCharacterCardProfileGroups(subject, locks = {}) {
  const baseGroups = subject.profile || buildFallbackCharacterProfileGroups(subject);
  const importedLayers = getCharacterCardImportedLayers(subject, locks);
  const accessoryLayerKeys = new Set(['headAccessory', 'eyewear', 'earrings', 'neckAccessory', 'wristAccessory', 'ring', 'waistAccessory']);
  const outfitText = importedLayers
    .filter((layer) => !accessoryLayerKeys.has(layer.meta?.characterCardLayer))
    .map((layer) => layer.en)
    .filter(Boolean)
    .join(', ');
  const accessoryText = importedLayers
    .filter((layer) => accessoryLayerKeys.has(layer.meta?.characterCardLayer))
    .map((layer) => layer.en)
    .filter(Boolean)
    .join(', ');

  return {
    ...baseGroups,
    outfit: outfitText,
    accessories: accessoryText,
  };
}
```

Inside `buildGptCharacterProfileSubjectBlock`, replace:

```js
  const groups = subject.profile || buildFallbackCharacterProfileGroups(subject);
```

with:

```js
  const groups = buildCharacterCardProfileGroups(subject, locks);
```

Then replace the `Hair` line input with:

```js
    groupLine('Hair', [groups.hair, buildCharacterCardHairVariantText(subject, locks)].filter(Boolean).join(', ')),
```

Update the call inside `buildGptPromptFromStructuredPrompt()` from:

```js
    ? buildGptCharacterProfileSubjectBlock(context.subject)
```

to:

```js
    ? buildGptCharacterProfileSubjectBlock(context.subject, context.locks)
```

- [ ] **Step 8: Let character cards build wardrobe instead of disabling all wardrobe**

In `generateSinglePrompt()`, replace:

```js
  const wardrobe = isSpecialSubject(subject) ? [] : buildWardrobe({ ...context }, effectiveLocks, runtime);
```

with:

```js
  const cardLayers = getCharacterCardImportedLayers(subject, effectiveLocks);
  const cardWardrobeMode = effectiveLocks.characterCardWardrobeMode || 'full-default';
  const page1Wardrobe = isDedicatedSpecialSubject(subject) || (isCharacterProfileSubject(subject) && cardWardrobeMode === 'full-default')
    ? []
    : buildWardrobe({ ...context }, effectiveLocks, runtime);
  const wardrobe = [...cardLayers, ...page1Wardrobe];
```

This preserves old PAGE1 character-card behavior: a plain `characterProfileId` uses the full card wardrobe and does not add random PAGE1 wardrobe. PAGE2-imported `selected-layers` mode can still combine imported card layers with PAGE1 wardrobe controls.

- [ ] **Step 9: Teach wardrobe slot extraction about character-card layers**

In `extractWardrobeSlots(wardrobe)`, add before the return:

```js
  const characterCardLayers = wardrobe.filter((item) => item.meta?.characterCardLayer);
  const findCharacterCardLayer = (key) => characterCardLayers.find((item) => item.meta?.characterCardLayer === key) || null;
```

Then in the returned object, set these fields to card layer first:

```js
    top: findCharacterCardLayer('top') || findSlot('wardrobe:上身-tops:'),
    pants: findCharacterCardLayer('bottom') || findSlot('wardrobe:褲裝-pants:'),
    skirt: findSlot('wardrobe:裙裝-skirts:'),
    dress: findCharacterCardLayer('dress') || findSlot('wardrobe:連身-dresses:'),
    outerwear: findCharacterCardLayer('outerwear') || findSlot('wardrobe:外套-outerwear:'),
    shoes: findCharacterCardLayer('shoes') || findSlot('wardrobe:鞋款-shoes:'),
    headAccessory: findCharacterCardLayer('headAccessory') || findSlot('wardrobe:頭部配件-head-accessories:'),
    eyewear: findCharacterCardLayer('eyewear') || findSlot('wardrobe:眼鏡-eyewear:'),
    earrings: findCharacterCardLayer('earrings') || findSlot('wardrobe:耳環-earrings:'),
    neckAccessory: findCharacterCardLayer('neckAccessory') || findSlot('wardrobe:頸部配件-neck-accessories:'),
```

Keep the existing role-specific A/B fields unchanged.

- [ ] **Step 10: Store new variant fields in selection snapshot**

In `buildSelectionSnapshot()`, add:

```js
    characterCardHairVariantId: context.locks?.characterCardHairVariantId || 'default',
    characterCardWardrobeMode: context.locks?.characterCardWardrobeMode || 'full-default',
    characterCardWardrobeLayerIds: Array.isArray(context.locks?.characterCardWardrobeLayerIds) ? context.locks.characterCardWardrobeLayerIds : [],
    characterCardPromptOverride: context.locks?.characterCardPromptOverride || '',
```

- [ ] **Step 11: Run focused tests**

Run:

```bash
cd webapp
npm test -- src/lib/characterCardLab.test.js src/lib/engineCharacterCardVariant.test.js src/lib/engineSpecialSubjects.test.js
```

Expected: PASS. Existing character-card tests still pass because `characterCardWardrobeMode: 'full-default'` preserves the current full default wardrobe when PAGE1 only has `characterProfileId`.

- [ ] **Step 12: Commit**

Run:

```bash
git add webapp/src/lib/engine.js webapp/src/lib/engineCharacterCardVariant.test.js
git commit -m "Support character card variant locks"
```

Expected: commit succeeds.

---

### Task 4: Replace PAGE2 With Character Card Lab UI

**Files:**
- Modify: `webapp/src/components/Page2Workspace.jsx`
- Modify: `webapp/src/App.jsx`
- Modify: `webapp/src/index.css`

- [ ] **Step 1: Update imports and PAGE2 state in App**

In `webapp/src/App.jsx`, replace the old PAGE2 face-builder helper imports/state with:

```js
import {
  buildCharacterCardPromptBundle,
  buildCharacterCardSavedCard,
  createEmptyCharacterCardVariant,
  getCharacterCardOptions,
  normalizeCharacterCardVariant,
} from './lib/characterCardLab';
```

Keep `PAGE2_PROFILE_KEY = 'vps.page2Profile'` for storage continuity.

Set PAGE2 state with:

```js
  const characterCards = useMemo(() => getCharacterCardOptions(lockControls), [lockControls]);
  const [page2Profile, setPage2Profile] = useState(() => (
    normalizeCharacterCardVariant(loadJsonStorage(PAGE2_PROFILE_KEY, createEmptyCharacterCardVariant(characterCards)), characterCards)
  ));
  const normalizedPage2Profile = useMemo(() => normalizeCharacterCardVariant(page2Profile, characterCards), [page2Profile, characterCards]);
  const page2PromptBundle = useMemo(() => buildCharacterCardPromptBundle(characterCards, normalizedPage2Profile), [characterCards, normalizedPage2Profile]);
```

Remove old `PAGE2_FIELD_OPTIONS`, `PAGE2_FIELD_CONFIG`, `createEmptyPage2Profile`, and `buildPage2*` helper usage from App after the new UI compiles.

- [ ] **Step 2: Wire PAGE2 save card**

Replace `handleSavePage2Card` with:

```js
  const handleSavePage2Card = useCallback(() => {
    if (!page2PromptBundle.outputs.length) {
      showToast('請先選擇角色卡再加入 Saved Cards');
      return;
    }

    const nextCard = buildCharacterCardSavedCard(characterCards, normalizedPage2Profile, page2PromptBundle);
    addFavoritePrompt(nextCard);
    setViewMode('favorites');
    setPageMode('page4');
    showToast('角色卡 Prompt 已加入 Saved Cards');
  }, [addFavoritePrompt, characterCards, normalizedPage2Profile, page2PromptBundle, showToast]);
```

- [ ] **Step 3: Replace PAGE2 render props**

Change the `Page2Workspace` render in `App.jsx` to:

```jsx
        <Page2Workspace
          characterCards={characterCards}
          profile={normalizedPage2Profile}
          setProfile={setPage2Profile}
          promptBundle={page2PromptBundle}
          onCopyText={handleCopyText}
          onSaveCard={handleSavePage2Card}
          onApplyToPage1={handleApplyPage2CharacterCard}
        />
```

Add `handleApplyPage2CharacterCard` as a stub that only shows a toast until Task 5:

```js
  const handleApplyPage2CharacterCard = useCallback(() => {
    showToast('角色卡匯入 PAGE1 會在下一階段接上');
  }, [showToast]);
```

- [ ] **Step 4: Replace `Page2Workspace.jsx`**

Replace `webapp/src/components/Page2Workspace.jsx` with:

```jsx
import { useMemo } from 'react';
import DllPicProPanel from './DllPicProPanel';
import PromptPreviewCard from './PromptPreviewCard';
import {
  CHARACTER_CARD_LAYER_KEYS,
  getCompatibleHairVariants,
  normalizeCharacterCardVariant,
  resolveCharacterCard,
} from '../lib/characterCardLab';

export default function Page2Workspace({
  characterCards,
  profile,
  setProfile,
  promptBundle,
  onCopyText,
  onSaveCard,
  onApplyToPage1,
}) {
  const activeCard = resolveCharacterCard(characterCards, profile.characterProfileId);
  const hairVariants = useMemo(() => getCompatibleHairVariants(activeCard), [activeCard]);
  const layerEntries = CHARACTER_CARD_LAYER_KEYS
    .map((key) => activeCard?.defaultWardrobeLayers?.[key])
    .filter(Boolean);
  const includedLayers = new Set(profile.includedWardrobeLayers || []);
  const outputs = promptBundle.outputs || [];

  const updateProfile = (patch) => {
    setProfile((prev) => normalizeCharacterCardVariant({ ...prev, ...patch }, characterCards));
  };

  const toggleLayer = (layerKey) => {
    const next = includedLayers.has(layerKey)
      ? profile.includedWardrobeLayers.filter((key) => key !== layerKey)
      : [...profile.includedWardrobeLayers, layerKey];
    updateProfile({
      includedWardrobeLayers: next,
      outputMode: next.length > 0 ? 'included-wardrobe' : 'pure-character',
    });
  };

  return (
    <section className="page2-shell character-card-lab-shell">
      <section className="lock-panel page2-panel character-card-lab-editor">
        <div className="lock-panel-header">
          <div>
            <div className="lock-title">Character Card Lab</div>
            <p className="lock-subtitle">選擇內建角色卡，設定髮型變化與要匯回 PAGE1 的預設服裝 layer。</p>
          </div>
        </div>

        <div className="control-section">
          <div className="control-section-header">
            <div className="control-section-title">角色卡</div>
          </div>
          <div className="character-card-grid">
            {characterCards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={profile.characterProfileId === card.id ? 'character-card-option active' : 'character-card-option'}
                onClick={() => updateProfile({
                  characterProfileId: card.id,
                  hairVariantId: 'default',
                  includedWardrobeLayers: Object.keys(card.defaultWardrobeLayers),
                  outputMode: 'included-wardrobe',
                })}
              >
                {card.primaryReferenceImage ? (
                  <img src={`${import.meta.env.BASE_URL}${card.primaryReferenceImage}`} alt={card.label} />
                ) : null}
                <span>{card.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeCard ? (
          <>
            <div className="control-section">
              <div className="control-section-header">
                <div className="control-section-title">人物與髮型</div>
              </div>
              <div className="character-card-summary">
                <strong>{activeCard.label}</strong>
                <p>{activeCard.identityAndBody}</p>
                <p>{activeCard.baseHair}</p>
              </div>
              <label className="field">
                <span>髮型變化</span>
                <select value={profile.hairVariantId} onChange={(event) => updateProfile({ hairVariantId: event.target.value })}>
                  {hairVariants.map((variant) => (
                    <option key={variant.id} value={variant.id}>{variant.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="control-section">
              <div className="control-section-header">
                <div className="control-section-title">服裝帶入 PAGE1</div>
              </div>
              <div className="character-card-layer-list">
                {layerEntries.map((layer) => (
                  <button
                    key={layer.key}
                    type="button"
                    className={includedLayers.has(layer.key) ? 'character-card-layer active' : 'character-card-layer'}
                    onClick={() => toggleLayer(layer.key)}
                  >
                    <span>{layer.label}</span>
                    <small>{layer.prompt}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="control-section">
              <div className="control-section-header">
                <div className="control-section-title">進階 Prompt Override</div>
              </div>
              <label className="field">
                <span>臨時角色描述</span>
                <textarea
                  className="text-input page2-prompt-textarea"
                  rows={4}
                  value={profile.promptOverrideText}
                  onChange={(event) => updateProfile({ promptOverrideText: event.target.value })}
                  placeholder="可留空。填寫後會作為本次角色卡變體的臨時補充描述匯回 PAGE1。"
                />
              </label>
            </div>
          </>
        ) : null}

        <div className="control-actions">
          <div className="control-actions-main">
            <button className="primary-cta" onClick={onApplyToPage1} disabled={!activeCard}>
              匯回 PAGE1
            </button>
            <button className="secondary" onClick={onSaveCard} disabled={!outputs.length}>
              加入 Saved Cards
            </button>
          </div>
        </div>
      </section>

      <section className="lock-panel page2-output-panel reference-output-panel">
        <div className="reference-output-header">
          <div>
            <div className="control-section-title">Character Card Outputs</div>
            <p className="workspace-panel-copy">六組 prompt 可複製使用，也可交給 DLL PIC Pro 直接生成角色 reference。</p>
          </div>
          <span className="reference-output-count">{outputs.length} outputs</span>
        </div>
        <div className="prompt-preview-grid">
          {outputs.map((card, index) => (
            <PromptPreviewCard
              key={card.id}
              title={card.label}
              eyebrow="Character"
              value={card.value}
              placeholder={`${card.label} 尚未生成`}
              description=""
              copyLabel={`${card.label} copied`}
              fullWidth={outputs.length % 2 === 1 && index === outputs.length - 1}
              onCopy={(text) => onCopyText(`${card.label} copied`, text)}
            />
          ))}
        </div>
        <DllPicProPanel
          title="DLL_PIC Pro"
          description="用角色卡 prompt 直接生成大頭照、四視圖或全身 reference。"
          promptSources={outputs.map((output) => ({ id: output.id, label: output.label, value: output.value }))}
          defaultSourceId="full-body-reference"
        />
      </section>
    </section>
  );
}
```

- [ ] **Step 5: Add minimal CSS for the new PAGE2 controls**

Append to `webapp/src/index.css`:

```css
.character-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
}

.character-card-option,
.character-card-layer {
  border: 1px solid var(--border);
  background: var(--surface);
  color: inherit;
  border-radius: 8px;
  padding: 10px;
  text-align: left;
}

.character-card-option.active,
.character-card-layer.active {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.character-card-option img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 8px;
}

.character-card-summary {
  display: grid;
  gap: 8px;
  font-size: 0.92rem;
  color: var(--muted);
}

.character-card-summary strong {
  color: var(--text);
}

.character-card-layer-list {
  display: grid;
  gap: 8px;
}

.character-card-layer span {
  display: block;
  font-weight: 700;
  margin-bottom: 4px;
}

.character-card-layer small {
  display: block;
  color: var(--muted);
  line-height: 1.35;
}
```

- [ ] **Step 6: Run focused checks**

Run:

```bash
cd webapp
npm test -- src/lib/characterCardLab.test.js
npm run lint
```

Expected: tests and lint pass.

- [ ] **Step 7: Commit**

Run:

```bash
git add webapp/src/App.jsx webapp/src/components/Page2Workspace.jsx webapp/src/index.css
git commit -m "Replace Page2 with character card lab"
```

Expected: commit succeeds.

---

### Task 5: Implement PAGE2 Structured Apply Into PAGE1

**Files:**
- Modify: `webapp/src/lib/characterCardLab.js`
- Modify: `webapp/src/lib/characterCardLab.test.js`
- Modify: `webapp/src/App.jsx`

- [ ] **Step 1: Add failing tests for PAGE1 apply helper**

Append to `webapp/src/lib/characterCardLab.test.js`:

```js
import { createEmptyLocks } from './engine.js';
import { buildPage1LocksFromCharacterCardVariant } from './characterCardLab.js';

test('structured apply clears PAGE1 same-layer choices only for included card layers', () => {
  const cards = getCharacterCardOptions(getLockControls());
  const prevLocks = {
    ...createEmptyLocks(),
    skirtId: 'wardrobe:裙裝-skirts:denim-mini',
    shoesId: 'wardrobe:鞋款-shoes:heels',
    neckAccessoryId: 'wardrobe:頸部配件-neck-accessories:thin-necklace',
    locationId: 'scene:anything',
    poseId: 'pose:anything',
  };
  const nextLocks = buildPage1LocksFromCharacterCardVariant(prevLocks, {
    characterProfileId: 'character-rika',
    hairVariantId: 'low-ponytail',
    includedWardrobeLayers: ['top', 'bottom'],
  }, cards);

  assert.equal(nextLocks.subjectCount, '1');
  assert.equal(nextLocks.characterProfileId, 'character-rika');
  assert.equal(nextLocks.characterCardHairVariantId, 'low-ponytail');
  assert.equal(nextLocks.characterCardWardrobeMode, 'selected-layers');
  assert.deepEqual(nextLocks.characterCardWardrobeLayerIds, ['top', 'bottom']);
  assert.equal(nextLocks.topId, '');
  assert.equal(nextLocks.pantsId, '');
  assert.equal(nextLocks.skirtId, '');
  assert.equal(nextLocks.shoesId, 'wardrobe:鞋款-shoes:heels');
  assert.equal(nextLocks.neckAccessoryId, 'wardrobe:頸部配件-neck-accessories:thin-necklace');
  assert.equal(nextLocks.locationId, 'scene:anything');
  assert.equal(nextLocks.poseId, 'pose:anything');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd webapp
npm test -- src/lib/characterCardLab.test.js
```

Expected: FAIL because `buildPage1LocksFromCharacterCardVariant` is not exported.

- [ ] **Step 3: Implement structured apply helper**

Append to `webapp/src/lib/characterCardLab.js`:

```js
const PAGE1_LAYER_CLEAR_KEYS = {
  top: ['topId', 'topFitId', 'topStylingId', 'topColorId', 'topPatternId'],
  bottom: ['pantsId', 'skirtId', 'bottomFitId', 'bottomRiseId', 'bottomColorId', 'bottomPatternId'],
  dress: ['dressId', 'dressColorId', 'topId', 'pantsId', 'skirtId'],
  outerwear: ['outerwearId', 'outerwearFitId', 'outerwearColorId', 'outerwearPatternId', 'outerwearOpeningId', 'outerwearStylingId'],
  shoes: ['shoesId', 'shoesColorId'],
  headAccessory: ['headAccessoryId'],
  eyewear: ['eyewearId', 'eyewearColorId', 'eyewearPlacementId'],
  earrings: ['earringsId'],
  neckAccessory: ['neckAccessoryId'],
  wristAccessory: ['wristAccessoryId'],
  ring: ['ringId'],
  waistAccessory: ['waistAccessoryId'],
};

export function buildPage1LocksFromCharacterCardVariant(prevLocks = {}, rawVariant = {}, cards = []) {
  const variant = normalizeCharacterCardVariant(rawVariant, cards);
  const next = {
    ...prevLocks,
    subjectCount: '1',
    specialSubjectId: 'none',
    characterProfileId: variant.characterProfileId,
    characterCardHairVariantId: variant.hairVariantId,
    characterCardWardrobeMode: 'selected-layers',
    characterCardWardrobeLayerIds: [...variant.includedWardrobeLayers],
    characterCardPromptOverride: variant.promptOverrideText,
  };

  variant.includedWardrobeLayers.forEach((layerKey) => {
    (PAGE1_LAYER_CLEAR_KEYS[layerKey] || []).forEach((lockKey) => {
      next[lockKey] = Array.isArray(next[lockKey]) ? [] : '';
    });
  });

  return next;
}
```

- [ ] **Step 4: Wire App's PAGE2 apply handler**

In `webapp/src/App.jsx`, add `buildPage1LocksFromCharacterCardVariant` to the `characterCardLab` import.

Replace the stub handler with:

```js
  const handleApplyPage2CharacterCard = useCallback(() => {
    const nextLocks = buildPage1LocksFromCharacterCardVariant(locks, normalizedPage2Profile, characterCards);
    updateLocks(() => normalizeLocks(nextLocks));
    setPageMode('page1');
    showToast('角色卡設定已匯回 PAGE1');
  }, [characterCards, locks, normalizedPage2Profile, showToast, updateLocks]);
```

- [ ] **Step 5: Keep PAGE1 wardrobe controls available for character cards**

In `webapp/src/App.jsx`, find `wardrobeLockControls`. Inside its filter, replace:

```js
          if (isSpecialSubject || isCharacterProfile) return false;
```

with:

```js
          if (isSpecialSubject) return false;
```

This keeps wardrobe disabled for skeleton/warrior/android special subjects, but allows PAGE1 to fill missing C layers after a character-card import.

- [ ] **Step 6: Run focused tests**

Run:

```bash
cd webapp
npm test -- src/lib/characterCardLab.test.js src/lib/engineCharacterCardVariant.test.js
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add webapp/src/lib/characterCardLab.js webapp/src/lib/characterCardLab.test.js webapp/src/App.jsx
git commit -m "Import character card variants into Page1"
```

Expected: commit succeeds.

---

### Task 6: Show Imported Character-Card Layers In PAGE1

**Files:**
- Modify: `webapp/src/components/Page1Workspace.jsx`
- Modify: `webapp/src/lib/page1WorkspaceSummary.js`
- Modify: `webapp/src/index.css`

- [ ] **Step 1: Add imported-layer display helper in Page1Workspace**

In `webapp/src/components/Page1Workspace.jsx`, add this helper near the other local constants:

```js
const CHARACTER_CARD_LAYER_DISPLAY = {
  top: '上身',
  bottom: '下身',
  dress: '連身',
  outerwear: '外套',
  shoes: '鞋子',
  headAccessory: '頭飾',
  eyewear: '眼鏡',
  earrings: '耳環',
  neckAccessory: '脖子飾品',
  wristAccessory: '手部飾品',
  ring: '戒指',
  waistAccessory: '腰部飾品',
};
```

Inside the component, derive:

```js
  const importedCharacterCardLayers = Array.isArray(locks.characterCardWardrobeLayerIds)
    ? locks.characterCardWardrobeLayerIds
    : [];
```

- [ ] **Step 2: Keep wardrobe diagnostics active for character cards**

In `webapp/src/components/Page1Workspace.jsx`, find the `sectionDiagnostics.wardrobe` object. Replace:

```js
      status: isDedicatedSubjectMode ? '已停用' : (isAnyOutfitPresetActive || isSpecialOutfitActive ? '接管中' : formatSelectionStatus(countEffectiveSelections('wardrobe', locks, lockControls))),
```

with:

```js
      status: isSpecialSubjectMode ? '已停用' : (isAnyOutfitPresetActive || isSpecialOutfitActive || importedCharacterCardLayers.length > 0 ? '接管中' : formatSelectionStatus(countEffectiveSelections('wardrobe', locks, lockControls))),
```

Then replace this chip:

```js
        isCharacterProfileMode ? '角色卡停用穿搭' : '',
```

with:

```js
        isCharacterProfileMode && importedCharacterCardLayers.length > 0 ? '角色卡服裝層' : '',
```

- [ ] **Step 3: Render imported layer badges above wardrobe controls**

In the wardrobe section render path before `renderControlGrid(...)`, add:

```jsx
      {activeSection === 'wardrobe' && importedCharacterCardLayers.length > 0 ? (
        <div className="character-card-imported-layers" aria-label="Imported character card wardrobe layers">
          {importedCharacterCardLayers.map((layerKey) => (
            <span key={layerKey} className="character-card-imported-layer">
              來自角色卡｜{CHARACTER_CARD_LAYER_DISPLAY[layerKey] || layerKey}
            </span>
          ))}
        </div>
      ) : null}
```

Place it in the active panel body so it appears before C controls and does not hide any normal PAGE1 fields.

- [ ] **Step 4: Add summary support**

In `webapp/src/lib/page1WorkspaceSummary.js`, add:

```js
const CHARACTER_CARD_LAYER_SUMMARY = {
  top: '角色卡上身',
  bottom: '角色卡下身',
  dress: '角色卡連身',
  outerwear: '角色卡外套',
  shoes: '角色卡鞋子',
  headAccessory: '角色卡頭飾',
  eyewear: '角色卡眼鏡',
  earrings: '角色卡耳環',
  neckAccessory: '角色卡脖子飾品',
  wristAccessory: '角色卡手部飾品',
  ring: '角色卡戒指',
  waistAccessory: '角色卡腰部飾品',
};
```

Inside `buildWorkspaceSummary`, add:

```js
  const importedCharacterCardWardrobe = Array.isArray(locks.characterCardWardrobeLayerIds)
    ? locks.characterCardWardrobeLayerIds.map((key) => CHARACTER_CARD_LAYER_SUMMARY[key]).filter(Boolean)
    : [];
```

Then replace the start of the wardrobe summary:

```js
  const wardrobeSummary = isDedicatedSubjectMode ? '' : buildSummaryText([
```

with:

```js
  const wardrobeSummary = isSpecialSubjectMode ? '' : buildSummaryText([
    ...importedCharacterCardWardrobe,
```

This keeps special subjects disabling wardrobe summaries while character-card mode can summarize imported card layers plus PAGE1-filled layers.

- [ ] **Step 5: Add CSS**

Append to `webapp/src/index.css`:

```css
.character-card-imported-layers {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 12px;
}

.character-card-imported-layer {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.86rem;
}
```

- [ ] **Step 6: Run focused checks**

Run:

```bash
cd webapp
npm test -- src/lib/page1WorkspaceSummary.test.js src/lib/engineCharacterCardVariant.test.js
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add webapp/src/components/Page1Workspace.jsx webapp/src/lib/page1WorkspaceSummary.js webapp/src/index.css
git commit -m "Show imported character card layers in Page1"
```

Expected: commit succeeds.

---

### Task 7: Support Extra Prompt Outputs In Saved Cards

**Files:**
- Modify: `webapp/src/components/PromptCard.jsx`
- Modify: `webapp/src/App.jsx`

- [ ] **Step 1: Update prompt entry helper in PromptCard**

In `webapp/src/components/PromptCard.jsx`, replace `getPromptEntries` with:

```js
function getPromptEntries(data, labels) {
  const primaryEntries = [
    { key: 'grok', label: labels.grok, text: data.grokPrompt },
    { key: 'midjourney', label: labels.midjourney, text: data.midjourneyPrompt },
    { key: 'zImage', label: labels.zImage, text: data.zImagePrompt },
  ];
  const extraEntries = Array.isArray(data.extraPrompts)
    ? data.extraPrompts.map((entry) => ({
      key: entry.id,
      label: entry.label,
      text: entry.text,
    }))
    : [];
  return [...primaryEntries, ...extraEntries].filter((entry) => entry.text);
}
```

- [ ] **Step 2: Persist `extraPrompts` in App sanitization**

In `sanitizeStoredPrompt()`, add:

```js
    extraPrompts: Array.isArray(prompt.extraPrompts)
      ? prompt.extraPrompts
        .filter((entry) => entry?.id && entry?.label && entry?.text)
        .map((entry) => ({ id: String(entry.id), label: String(entry.label), text: String(entry.text) }))
      : [],
```

In `serializeFavoritePrompt()`, add:

```js
    e: sanitized.extraPrompts,
```

In `deserializeFavoritePrompt()`, add:

```js
      extraPrompts: record.e,
```

- [ ] **Step 3: Include `extraPrompts` in App markdown export**

In App's `buildMarkdownExport(data)`, add extra prompt entries after the three primary entries:

```js
  const extraPromptEntries = Array.isArray(data.extraPrompts)
    ? data.extraPrompts.map((entry) => ({ label: entry.label, text: entry.text }))
    : [];
  const promptEntries = [
    { label: labels.midjourney, text: data.midjourneyPrompt },
    { label: labels.grok, text: data.grokPrompt },
    { label: labels.zImage, text: data.zImagePrompt },
    ...extraPromptEntries,
  ].filter((entry) => entry.text);
```

- [ ] **Step 4: Run focused checks**

Run:

```bash
cd webapp
npm test -- src/lib/characterCardLab.test.js
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add webapp/src/components/PromptCard.jsx webapp/src/App.jsx
git commit -m "Support extra prompt outputs in saved cards"
```

Expected: commit succeeds.

---

### Task 8: Remove SUNO From Active Navigation

**Files:**
- Modify: `webapp/src/App.jsx`
- Modify: `webapp/src/components/SavedCardsWorkspace.jsx`

- [ ] **Step 1: Remove active SUNO imports and state from App**

In `webapp/src/App.jsx`, remove:

```js
import PageSunoWorkspace from './components/PageSunoWorkspace';
```

Remove the import block from `./lib/suno`.

Remove `PAGE5_PROFILE_KEY`.

Remove `page5` from `PAGE_MODE_COPY`.

Remove `page5Profile`, `normalizedPage5Profile`, `page5Summary`, `page5StylesPrompt`, `page5PromptBundle`, `handleRandomizePage5Profile`, and `handleSavePage5Card`.

- [ ] **Step 2: Remove SUNO tab and render branch**

In `webapp/src/App.jsx`, remove the SUNO button:

```jsx
              <button
                type="button"
                className={pageMode === 'page5' ? 'tab-primary-active page-mode-button' : 'secondary page-mode-button'}
                onClick={() => setPageMode('page5')}
              >
                SUNO
              </button>
```

Remove the `pageMode === 'page5'` render branch for `PageSunoWorkspace`.

- [ ] **Step 3: Normalize stored page mode away from page5**

After `const [pageMode, setPageMode] = useState(...)`, ensure the initializer maps old `page5` to `page1`:

```js
  const [pageMode, setPageMode] = useState(() => {
    const stored = loadStringStorage(PAGE_MODE_KEY, 'page1');
    return stored === 'page5' ? 'page1' : stored;
  });
```

- [ ] **Step 4: Keep old page5 cards visible in Saved Cards**

In `webapp/src/components/SavedCardsWorkspace.jsx`, remove the SUNO source filter button by deleting:

```js
  { id: 'page5', label: 'SUNO' },
```

Keep `sourceCounts` aware of unknown sources with:

```js
    const counts = { all: displayPrompts.length, page1: 0, page2: 0, page3: 0 };
    displayPrompts.forEach((prompt) => {
      const source = prompt.source || 'page1';
      if (counts[source] !== undefined) counts[source] += 1;
    });
```

Old `page5` cards remain visible under `全部來源` because the `all` filter includes all display prompts.

- [ ] **Step 5: Run focused checks**

Run:

```bash
cd webapp
npm test -- src/lib/characterCardLab.test.js src/lib/suno.test.js
npm run lint
```

Expected: PASS. `suno.test.js` still passes because `suno.js` remains for legacy compatibility even though SUNO is no longer reachable in navigation.

- [ ] **Step 6: Commit**

Run:

```bash
git add webapp/src/App.jsx webapp/src/components/SavedCardsWorkspace.jsx
git commit -m "Remove SUNO from active navigation"
```

Expected: commit succeeds.

---

### Task 9: Rendered Smoke Test And Final Validation

**Files:**
- No source changes unless validation finds a defect.

- [ ] **Step 1: Run unit, lint, and build**

Run:

```bash
cd webapp
npm test
npm run lint
npm run build
```

Expected:

- all Node tests pass
- lint passes
- build passes
- the existing Vite chunk-size warning is acceptable

- [ ] **Step 2: Start dev server**

Run:

```bash
cd webapp
npm run dev -- --host 127.0.0.1 --port 5175
```

Expected: server reports a local URL at `http://127.0.0.1:5175/Virtual_Photography_Studio/`.

- [ ] **Step 3: Run browser smoke script**

In a second terminal, run:

```bash
cd /Users/cooperfu/Desktop/Virtual_Photography_Studio
node -e "import('playwright').then(async ({ chromium }) => { const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); const logs = []; const errors = []; page.on('console', msg => { if (msg.type() === 'error') logs.push(msg.text()); }); page.on('pageerror', err => errors.push(err.message)); await page.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/', { waitUntil: 'networkidle' }); await page.getByRole('button', { name: '角色建模' }).click(); await page.waitForTimeout(500); const page2Text = await page.locator('body').innerText(); await page.getByRole('button', { name: '匯回 PAGE1' }).click(); await page.waitForTimeout(500); const page1Text = await page.locator('body').innerText(); await page.getByRole('button', { name: 'Saved Cards' }).click(); await page.waitForTimeout(500); const savedText = await page.locator('body').innerText(); const mobile = await browser.newPage({ viewport: { width: 390, height: 900 }, isMobile: true }); await mobile.goto('http://127.0.0.1:5175/Virtual_Photography_Studio/', { waitUntil: 'networkidle' }); const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth); await browser.close(); console.log(JSON.stringify({ hasCharacterLab: page2Text.includes('Character Card Lab'), page1Imported: page1Text.includes('來自角色卡') || page1Text.includes('角色卡'), savedCards: savedText.includes('Saved Cards Library'), mobileOverflow, logs, errors }, null, 2)); }).catch(err => { console.error(err); process.exit(1); });"
```

Expected JSON:

```json
{
  "hasCharacterLab": true,
  "page1Imported": true,
  "savedCards": true,
  "mobileOverflow": false,
  "logs": [],
  "errors": []
}
```

- [ ] **Step 4: Stop dev server**

Stop the dev server with `Ctrl-C` in the server terminal.

- [ ] **Step 5: Commit final validation fix if needed**

If validation required a defect fix, commit only the fix:

```bash
git add webapp/src
git commit -m "Fix character card lab validation issues"
```

Expected: commit succeeds only when a fix was made.
