// Prose imports carry evidence, not a complete selection snapshot. Never infer a
// garment swatch from an unowned color word or overwrite explicit JSON metadata.
const normalize = value => String(value || '').replace(/`/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const concrete = option => option?.id && !['none', 'random'].includes(option.id) && option.zh !== '全無' && option.en !== 'none';
const garmentKey = /^(?:specialOutfit|outfitPreset|top|dress|pants|skirt|outerwear|legwear|shoes|headphones|faceCovering|headAccessory|eyewear)([AB]?)Id$/;
export const RECOVERED_WARDROBE_COLOR_KEY = /^(?:(?:outfitPreset)(?:[AB])?(?:Color|PrimaryColor|ContrastColor|LockedPalette)|(?:top|dress|bottom|outerwear|legwear|shoes|headphones|faceCovering|headAccessory|eyewear)(?:[AB])?Color|(?:completeLookPalette|topBottomPalette)(?:[AB])?)Id$/;
const roleOf = key => key.match(/([AB])(?=(?:PrimaryColor|ContrastColor|LockedPalette|Color)?Id$)/)?.[1] || '';
const stopSection = /\b(?:shared expression|pose and composition|scene|lighting|camera look|camera & film|image type):/i;

export function createWardrobeRecoveryContext(prompt) {
  const text = normalize(prompt);
  const markers = [...text.matchAll(/\b(?:woman ([12]):|(?:the )?(first|second) woman(?:,|\s+wears\b))/g)];
  const duo = markers.length > 0 || /\b(?:two|2)\s+(?:[\w-]+\s+){0,9}women\b/.test(text);
  const roles = { A: '', B: '' };
  for (let i = 0; i < markers.length; i++) {
    const m = markers[i], role = m[1] === '1' || m[2] === 'first' ? 'A' : 'B';
    if (roles[role]) continue; // Full GPT comes before compact Z/MJ in Markdown.
    roles[role] = text.slice(m.index + m[0].length, markers[i + 1]?.index ?? text.length).split(stopSection)[0];
  }
  const wardrobe = text.match(/\bwardrobe:\s*([\s\S]*)/)?.[1]?.split(stopSection)[0];
  const single = wardrobe ?? text.split(/\b(?:scene|lighting|camera look):/i)[0];
  return { duo, roles, single };
}

export function wardrobeItemRecoveryScope(key, context, fallback) {
  const match = key.match(garmentKey);
  return match?.[1] && context.duo ? context.roles[match[1]] : fallback;
}

function sources(item) {
  return [...new Set([item?.en, ...(item?.meta?.legacyPromptAliases || [])].filter(Boolean)
    .map(normalize).map(s => s.replace(/^complete outfit:\s*/, '').replace(/^wearing\s+/, '')))];
}
function variants(option) {
  const syntax = option.meta?.wearableColorSyntax;
  return [...new Set([option.en, ...(option.meta?.legacyPromptAliases || []),
    ...(syntax ? [[syntax.prefix, syntax.detail ? `with ${syntax.detail}` : ''].filter(Boolean).join(' '), !syntax.prefix && syntax.detail].filter(Boolean) : [])].map(normalize).filter(Boolean))];
}
function matches(text, phrase) {
  return new RegExp(`(?<![a-z0-9-])${escape(phrase)}(?![a-z0-9-])`, 'g').test(text);
}
function uniqueColor(options, text, evidence) {
  const candidates = options.filter(concrete).flatMap(option => variants(option).map(phrase => ({ option, phrase })));
  const hits = candidates.filter(({ option, phrase }) => {
    const scoped = candidates.filter(other => other.phrase.length > phrase.length && matches(other.phrase, phrase))
      .reduce((value, other) => value.replace(new RegExp(`(?<![a-z0-9-])${escape(other.phrase)}(?![a-z0-9-])`, 'g'), ' '), text);
    return evidence(phrase, option, scoped);
  });
  // A longer matching swatch wins over its own substrings, but two distinct
  // assertions (red and blue) remain unresolved instead of using array order.
  const ids = [...new Set(hits.map(hit => hit.option.id))];
  return ids.length === 1 ? hits.find(hit => hit.option.id === ids[0]).option : null;
}
function targetOwned(phrase, targets) {
  const words = normalize(phrase).replace(/\b(?:the|and|all)\b/g, ' ');
  return targets.some(target => {
    const tokens = target.replace(/_/g, ' ').split(' ').filter(w => !['main', 'primary', 'secondary'].includes(w));
    return tokens.length && tokens.every(token => new RegExp(`\\b${escape(token.replace(/s$/, ''))}(?:s|es)?\\b`).test(words));
  });
}
function targetColor(text, phrase, targets) {
  return [...text.matchAll(new RegExp(`(?:^|[,.;])\\s*([^,.;]+?)\\s+(?:in|rendered in|set to)\\s+${escape(phrase)}(?![a-z0-9-])`, 'g'))]
    .some(m => targetOwned(m[1], targets));
}
function itemColor(text, item, phrase, color, allItems) {
  if (!concrete(item)) return false;
  const syntax = color.meta?.wearableColorSyntax;
  for (const source of sources(item)) {
    const head = source.split(/[,.;]/)[0];
    if (!head) continue;
    if (!syntax && matches(text, `${phrase} ${head}`)) return true;
    for (const m of text.matchAll(new RegExp(`(?<![a-z0-9-])${escape(head)}(?![a-z0-9-])`, 'g'))) {
      let tail = text.slice(m.index, text.indexOf('.', m.index) < 0 ? undefined : text.indexOf('.', m.index));
      // Do not borrow a suffix swatch from a later garment.
      for (const other of allItems.filter(o => o !== item)) for (const otherSource of sources(other)) {
        const otherHead = otherSource.split(/[,.;]/)[0], at = tail.indexOf(otherHead, head.length);
        if (at >= 0) tail = tail.slice(0, at);
      }
      if (syntax) {
        const prefix = normalize(syntax.prefix), detail = normalize(syntax.detail);
        if (syntax.placement !== 'suffix' && prefix && matches(text.slice(Math.max(0, m.index - prefix.length - 1), m.index + head.length), `${prefix} ${head}`)
          && (!detail || matches(tail, detail))) return true;
        const surface = [normalize(syntax.relation) || (prefix ? 'finished in' : 'patterned with'), prefix, detail ? (prefix ? `with ${detail}` : detail) : ''].filter(Boolean).join(' ');
        if (matches(tail, surface)) return true;
      }
    }
    const target = normalize(item.meta?.wearableColorTarget);
    if (target && matches(text, `${target} in ${phrase}`)) return true;
    if (target && syntax && matches(text, [target, syntax.prefix ? `in ${normalize(syntax.prefix)}` : '', syntax.detail ? `with ${normalize(syntax.detail)}` : ''].filter(Boolean).join(' '))) return true;
  }
  return false;
}

export function recoverWardrobeColors(context, locks, controls) {
  const map = new Map(controls.map(c => [c.key, c]));
  const get = key => map.get(key)?.options?.find(o => o.id === locks[key] && concrete(o));
  const result = new Map();
  for (const control of controls.filter(c => RECOVERED_WARDROBE_COLOR_KEY.test(c.key))) {
    const role = roleOf(control.key), key = control.key.replace(/([AB])(?=(?:PrimaryColor|ContrastColor|LockedPalette|Color)?Id$)/, '');
    const text = context.duo ? (role ? context.roles[role] : '') : (role ? '' : context.single);
    const none = control.options.find(o => o.zh === '全無' || o.id === 'none');
    const outfit = get(`outfitPreset${role}Id`), special = get(`specialOutfit${role}Id`), dress = get(`dress${role}Id`);
    const items = controls.filter(c => garmentKey.test(c.key) && roleOf(c.key) === role).map(c => get(c.key)).filter(Boolean);
    let found = null;
    if (text) found = uniqueColor(control.options, text, (phrase, color, text) => {
      if (key === 'completeLookPaletteId') {
        return matches(text, `complete outfit palette direction: shift the complete outfit palette toward a ${phrase}`)
          || (outfit?.meta?.shirtBlackBottom && matches(text, `shirt palette inspired by ${phrase}`));
      }
      if (key === 'topBottomPaletteId') return matches(text, phrase); // Never infer a palette from two incidental colors.
      if (/^outfitPreset/.test(key)) {
        if (!outfit || special) return false;
        const meta = outfit.meta || {}, channel = key.includes('Contrast') ? 'contrast' : 'primary';
        if (key.includes('Locked')) {
          if (meta.colorMode !== 'primary_contrast_locked') return false;
          const literal = {
            'metallic-gold':'kept in fixed metallic gold', 'metallic-silver':'kept in fixed metallic silver',
            'classic-black-trim':'kept in crisp classic black', 'classic-white-apron':'kept in classic clean white',
            'classic-white-cuff-collar':'kept in classic clean white', 'classic-school-navy-trim':'kept in a classic navy uniform trim scheme',
          }[color.id];
          return Boolean(literal && matches(text, literal) && (!/classic-white/.test(color.id)
            || (color.id === 'classic-white-apron' ? meta.colorTargets?.locked?.includes('apron') : !meta.colorTargets?.locked?.includes('apron'))));
        }
        const bindings = meta.colorTextBindings || sources(outfit).flatMap(s => [...s.matchAll(/([^,.;]+?) controlled by (?:the )?(?:outfit )?(primary color|outfit color selection|contrast color|contrast palette)/g)]
          .map(m => ({ target:m[1].trim(), channel:/contrast/.test(m[2]) ? 'contrast' : 'primary' })));
        if (bindings.some(b => b.channel === channel && matches(text, `${normalize(b.target)} set to ${phrase}`))) return true;
        const targets = meta.colorTargets?.[channel] || [];
        if (targets.length && targetColor(text, phrase, targets)) return true;
        if (channel === 'primary' && matches(text, `the primary outfit surfaces rendered in ${phrase}`)) return true;
        if (!meta.colorMode || !Object.keys(meta.colorTargets || {}).length) {
          if (matches(text, `${channel === 'primary' ? 'primary' : 'secondary'} garment color ${phrase}`)
            || matches(text, `${channel === 'primary' ? 'primary' : 'secondary'} garment color in ${phrase}`)
            || matches(text, `${channel === 'primary' ? 'primary' : 'secondary'} garment color expressed as ${phrase}`)) return true;
          return channel === 'primary' && itemColor(text, outfit, phrase, color, items);
        }
        return false;
      }
      const category = key.replace(/ColorId$/, '');
      // Full looks own their embedded pieces; their fixed colors never become
      // independent top/bottom/shoe overrides during prose recovery.
      if ((outfit || special || dress) && ['top','bottom'].includes(category)) return false;
      if (special && ['shoes','legwear'].includes(category)) return false;
      const owner = category === 'bottom' ? get(`pants${role}Id`) || get(`skirt${role}Id`) : get(`${category}${role}Id`);
      const local = ['shoes', 'legwear'].includes(category)
        ? sources(outfit || dress).reduce((value, source) => value.replaceAll(source, ' '), text) : text;
      return itemColor(local, owner, phrase, color, items);
    });
    if (found || none) result.set(control.key, found || none);
  }
  return result;
}
