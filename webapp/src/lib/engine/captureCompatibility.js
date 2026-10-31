import reviewedSources from './captureCompatibilitySources.json' with { type: 'json' };

// Deliberately exact source review: new or edited catalog text stays unrestricted.
const reviewed = Object.fromEntries(Object.entries(reviewedSources)
  .filter(([, rows]) => Array.isArray(rows))
  .map(([kind, rows]) => [kind, new Map(rows.map(row => [row.id, row]))]));
export function reviewedCaptureFlags(kind, item) {
  const row = reviewed[kind]?.get(item?.id);
  return row && row.en === item?.en ? row.flags : [];
}
export function seasonAllowsAmbient(location, ambient) {
  return !(reviewedCaptureFlags('location', location).includes('flower')
    && reviewedCaptureFlags('ambient', ambient).includes('frozen'));
}

function opposingFlags(a, b, first, second) {
  return (a.includes(first) && b.includes(second)) || (a.includes(second) && b.includes(first));
}
export function styleAllowsLocation(style, location) {
  return !opposingFlags(reviewedCaptureFlags('style', style), reviewedCaptureFlags('location', location), 'day', 'night');
}
export function styleAllowsAmbient(style, ambient) {
  return !opposingFlags(reviewedCaptureFlags('style', style), reviewedCaptureFlags('ambient', ambient), 'day', 'night');
}
export function styleAllowsSubject(style, subject) {
  return !opposingFlags(reviewedCaptureFlags('style', style), reviewedCaptureFlags('subject', subject), 'high', 'low');
}
export function styleAllowsShutter(style, shutter) {
  return !(reviewedCaptureFlags('style', style).includes('slow') && reviewedCaptureFlags('shutter', shutter).includes('fast'));
}
