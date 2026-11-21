export const PAGE3_PERSON_OPTIONS = [
  { id: 'none', label: '不放人物' },
  { id: 'default', label: '預設' },
  { id: 'prompt-workbench', label: 'Prompt 工作台' },
  { id: 'character-lab', label: '角色建模' },
];

export const PAGE3_DEFAULT_PERSON = 'A 20-year-old seductive stunning adult Japanese woman.';

const fullBodyAppearances = new WeakMap();

export function registerScenePersonAppearance(prompt, renderAppearance, renderPerformance) {
  fullBodyAppearances.set(prompt.structured, { renderAppearance, renderPerformance });
}

export function readScenePersonAppearance(prompt) {
  return fullBodyAppearances.get(prompt?.structured)?.renderAppearance() || '';
}

export function readScenePersonSnapshot(prompt) {
  const source = fullBodyAppearances.get(prompt?.structured);
  const text = source?.renderAppearance().trim();
  if (!text) return null;
  const performance = source.renderPerformance?.();
  return {
    source: 'prompt-workbench',
    label: 'Prompt 工作台預覽',
    text,
    ...(performance && { performance }),
  };
}

export function getPage3Person(profile) {
  const person = profile?.person;
  if (person?.source === 'default') return { source: 'default', label: '預設人物', text: PAGE3_DEFAULT_PERSON };
  if (['prompt-workbench', 'character-lab'].includes(person?.source)
    && typeof person.text === 'string' && person.text.trim()) {
    const sourceLabel = PAGE3_PERSON_OPTIONS.find(option => option.id === person.source).label;
    return {
      source: person.source,
      label: typeof person.label === 'string' && person.label.trim() ? person.label.trim() : sourceLabel,
      text: person.text.trim(),
      ...(person.performance && { performance: person.performance }),
    };
  }
  return null;
}
import { withLyingSurface } from './engine/lyingSurface.js';


// Use only supports established by the destination scene, not the source room.
const LOCATION_SUPPORTS = {
  'special-japanese-washitsu': ['tatami', 'cushion', 'floor', 'doorframe'],
  'special-boutique-hotel-room': ['bed', 'bed-edge', 'bed-top'],
  'special-japanese-classroom': ['chair', 'seat', 'floor'],
  'special-secondhand-bookshop': ['bookcase', 'reading-table', 'floor'],
  'special-japanese-lawson-interior': ['counter', 'floor'],
  'special-self-service-laundry': ['chair', 'seat', 'floor'],
  'special-forest-trail': ['ground', 'tree-trunk'],
  'special-lakeside-boardwalk': ['deck-top', 'deck-edge', 'railing'],
  'special-clear-bay-rocky-shore': ['rock', 'rock-face'],
  'special-wind-rippled-dunes': ['sand'],
  'special-dry-salt-lake': ['ground'],
};

const SUPPORT_LABELS = {
  bed: '床與枕頭', 'bed-edge': '床沿', 'bed-top': '床面', chair: '椅子', seat: '座位',
  sofa: '沙發', cushion: '坐墊', tatami: '榻榻米', floor: '地板',
  wall: '牆面', railing: '欄杆', 'tree-trunk': '樹幹', doorframe: '門框',
  bookcase: '書櫃', 'source-scene': '原場景的配置',
};

export function getScenePersonActionSupport(action) {
  if (action.scene?.support === 'bed') return 'bed';
  if (['specified-sitting-slouched', 'specified-sitting-leg-cross'].includes(action.id)) return 'seat';
  return '';
}

export function projectPage3ScenePerson(person, { locationId, distantView } = {}) {
  const { pose, expression, head, capture } = person?.performance || {};
  const notices = [];
  const summary = [];
  const text = [];
  const supports = LOCATION_SUPPORTS[locationId] || [];
  const missingSupport = pose?.support && !supports.includes(pose.support);
  const hidePose = missingSupport || (distantView && pose?.closeCamera);
  let appearance = person?.text || '';
  if (pose?.text && !hidePose) {
    const surface = pose.support === 'bed' ? 'bed' : supports.includes('tatami') ? 'tatami floor' : 'ground';
    const placement = pose.lying ? withLyingSurface(pose.text, surface) : pose.text;
    text.push(surface === 'tatami floor' && !pose.support ? placement.replace(/\bthe ground\b/gi, 'the tatami floor') : placement);
    summary.push(pose.label);
    appearance = pose.appearance || appearance;
  } else if (missingSupport) {
    notices.push(`已略過「${pose.label}」。目前取景缺少此動作所需的${SUPPORT_LABELS[pose.support] || '支撐物'}。`);
  }
  if (capture) notices.push(`已略過「${capture}」。拍攝方式以場景建模的設定為準。`);
  if (distantView && (expression?.text || head?.text || (pose?.closeCamera && !missingSupport))) {
    notices.push('遠距空拍已略過難以辨識的表情、視線或近距互動動作。');
  }
  if (!distantView) {
    for (const detail of [expression, head]) {
      if (!detail?.text || (detail.withPose && hidePose)) continue;
      text.push(detail.text);
      summary.push(detail.label);
    }
  }
  return { person, appearance, text, summary: summary.filter(Boolean), notices };
}
