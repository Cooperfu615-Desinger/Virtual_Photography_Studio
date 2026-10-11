import { MIDJOURNEY_ITEM_NAMES } from './midjourneyItemNames.js';

const clean = value => String(value || '').replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s.]+$/g, '').trim();
export const naturalSentence = value => {
  const text = clean(value);
  return text ? `${text[0].toUpperCase()}${text.slice(1)}.` : '';
};
export const uniqueNames = values => [...new Map(values.filter(Boolean).map(value => [value.toLowerCase(), value])).values()];

// This filter is used only on mixed legacy identity/person sources, never on
// pose, scene, or completed prompts. Standalone Body Type is mapped separately; mixed legacy body fields stay excluded.
const BODY_CLAUSE = /\b(?:cup bust|bust[–-]waist|height\s*\d|\d+\s*cm|body proportions|body shape|body silhouette|hourglass|physique|slim (?:body|arms|calves|waist)|narrow(?:ed)? waist|wide hips|full(?:er)? (?:bust|breasts|thighs)|moderate bust|defined waist|rounded hips|level shoulders|slim petite|sculpted bust|curv(?:y|aceous)|flesh bulges)\b/i;
export function naturalIdentity(value) {
  return String(value || '').split(/[,;]|(?<=[.!?])\s+/)
    .filter(fragment => !BODY_CLAUSE.test(fragment))
    .map(clean).filter(Boolean).join(', ');
}

const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Noun phrases only: used for bundled outfits, projected card layers, and
// custom items without a catalog ID. No comma truncation or long-prose fallback.
const NOUNS = [
  'bath towel wrap', 'adhesive tape', 'caution tape', 'lamellar armor', 'plate armor', 'armor', 'helmet', 'katana', 'wakizashi', 'longsword', 'chainmail', 'breastplate', 'gambeson', 'cloak', 'hood',
  'bralette', 'corset gown', 'corset dress', 'corset bodysuit', 'bustier', 'vest', 'jersey', 'sweatshirt',
  'harness', 'arm warmers', 'scarf', 'headscarf', 'bandana', 'neckerchief', 'petticoat',
  'pendant necklaces', 'choker necklace', 'pendant necklace', 'ring keychain', 'waist belts',
  'wrist cuff', 'wrist cuffs', 'thong sandals', 'shirt dress',
  'bikini bottoms', 'bikini top', 'bra top', 'tank top', 'tube top', 'crop top', 'sweater vest',
  'cotton camisole top', 'dress shirt', 't-shirt', 'baby tee', 'shirt', 'blouse', 'top', 'tee', 'camisole', 'bra', 'bandeau',
  'corset', 'sweater', 'hoodie', 'jacket', 'blazer', 'cardigan', 'coat', 'trench coat', 'cover-up',
  'catsuit', 'bodysuit', 'jumpsuit', 'romper', 'overalls', 'dress', 'gown', 'cheongsam', 'qipao',
  'kimono', 'yukata', 'robe', 'swimsuit', 'monokini', 'bikini', 'apron', 'pasties',
  'skirt', 'skort', 'shorts', 'trousers', 'pants', 'jeans', 'leggings', 'briefs', 'thong',
  'stockings', 'pantyhose', 'tights', 'socks', 'leg warmers', 'garter belt', 'waist cincher',
  'boots', 'shoes', 'heels', 'pumps', 'sandals', 'sneakers', 'loafers', 'flats',
  'handbag', 'shoulder bag', 'bag', 'pouch', 'backpack', 'gloves', 'cuffs',
  'headband', 'headpiece', 'hair clip', 'ribbon', 'bow', 'hat', 'cap', 'beanie', 'beret', 'crown',
  'glasses', 'eyeglasses', 'sunglasses', 'headphones', 'earphones', 'earbuds', 'respirator', 'face mask',
  'earrings', 'earring', 'ear cuff', 'choker', 'necklace', 'pendant', 'necktie', 'bolo tie',
  'bangles', 'rings', 'bracelets', 'bracelet', 'wristwatch', 'ring', 'waist chain', 'belts', 'belt', 'keychain', 'brooch', 'navel piercing',
];
const MODIFIERS = 'bunny-eared|gothic|button-up|button-down|lace|leather|latex|denim|silk|satin|cotton|knit|mesh|tulle|velvet|wool|tweed|chiffon|nylon|ribbed|sequined|pleated|ruffled|cropped|mini|maxi|midi|longline|sleeveless|short-sleeve|long-sleeve|spaghetti-strap|strapless|halter|off-shoulder|thigh-high|knee-high|ankle|platform|combat|Mary Jane|sailor|zip-up|bomber|biker|puffer|polo|cargo|wide-leg|straight-leg|flared|ankle-length|floor-length|pointed-toe|stiletto|lace-up|low-top|high-top|fishnet|pearl|beaded';
const reviewedNames = uniqueNames(Object.values(MIDJOURNEY_ITEM_NAMES))
  .filter(name => name && !/\band\b|\bor\b/.test(name));
const NAME_PATTERN = new RegExp(`\\b(?:(?:(?:${MODIFIERS})[ -]){0,4}(?:${NOUNS.sort((a, b) => b.length - a.length).map(escape).join('|')})|${reviewedNames.sort((a, b) => b.length - a.length).map(escape).join('|')})\\b`, 'gi');

export function extractMidjourneyItemNames(source) {
  const text = String(source || '').replace(/^complete (?:special )?outfit:\s*[^.]*\.\s*/i, '');
  // Styling/control clauses are not evidence of another selected garment.
  const visible = text.split(/[,;]|(?<=[.!?])\s+/).filter(fragment =>
    !/^(?:\s*)(?:no |not |without |avoid |preserv|controlled by|coordinated|main fabric color|upper\/main|lower or secondary)/i.test(fragment));
  const names = uniqueNames(visible.flatMap(fragment => {
    const identity = fragment.replace(/^\s*styled with\s+/i, '').split(/\s+(?:with|featuring|worn|tucked|peeking|styled|clipped)\b/i)[0];
    return [...identity.matchAll(NAME_PATTERN)]
      .filter(match => !/^\s*(?:loop|buckle|hardware|trim|detail|panel|hem|area|bodice|edge|band)\b/i.test(identity.slice(match.index + match[0].length)))
      .map(match => match[0]);
  }));
  // A repeated generic noun is not a second garment ("cardigan ... knit cardigan").
  return names.filter(name => !names.some(other => other !== name && other.toLowerCase().endsWith(` ${name.toLowerCase()}`)));
}

export function midjourneyItemName(item) {
  if (!item || item.zh === '全無' || item.id === 'none') return '';
  const id = String(item.id || '').replace(/:[ab]$/, '');
  return MIDJOURNEY_ITEM_NAMES[id] || extractMidjourneyItemNames(item.en).join(', ');
}

export function naturalWardrobeSentence(value, subject = 'She') {
  const items = String(value || '').split(', ').filter(Boolean);
  const barefoot = items.includes('bare feet');
  const names = items.filter(name => name !== 'bare feet').map(name =>
    /\b(?:pants|trousers|jeans|shorts|bottoms|briefs|leggings|tights|pantyhose|stockings|socks|shoes|boots|heels|pumps|sandals|sneakers|loafers|flats|glasses|eyeglasses|sunglasses|headphones|earphones|earbuds|earrings|bracelets|bangles|rings|necklaces|gauntlets|hoops|warmers|overalls|pasties|cuffs|chainmail|armor|tape)\b$/i.test(name)
      ? name : `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`);
  const list = names.length < 2 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  const plural = subject === 'Both';
  return [list ? naturalSentence(`${subject} ${plural ? 'wear' : 'wears'} ${list}`) : '',
    barefoot ? naturalSentence(`${subject} ${plural ? 'are' : 'is'} barefoot`) : ''].filter(Boolean).join(' ');
}

export function renderNaturalMidjourney({ imageType, composition, subject, pose, wardrobe, scene, imaging }) {
  return [
    [imageType, composition, subject, pose].filter(Boolean).join(' '),
    wardrobe,
    scene,
    imaging,
  ].map(part => String(part || '').trim()).filter(Boolean).join('\n\n');
}
