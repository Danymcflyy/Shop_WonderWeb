/**
 * Lightweight first-party session scoring (CONVERSION_SYSTEM.md).
 * Tags are problem and business-type ids only — no sensitive inferences.
 * Stored in sessionStorage; never sent anywhere.
 */
export type InterestProfile = Record<string, number>;

const STORAGE_KEY = 'tb:interests';

export function addInterest(profile: InterestProfile, tag: string, weight = 1): InterestProfile {
  return {...profile, [tag]: (profile[tag] ?? 0) + weight};
}

export function topInterests(profile: InterestProfile, limit = 3) {
  return Object.entries(profile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function readInterests(): InterestProfile {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InterestProfile) : {};
  } catch {
    return {};
  }
}

export function recordInterest(tags: string[], weight: number) {
  try {
    const next = tags.reduce((profile, tag) => addInterest(profile, tag, weight), readInterests());
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode): personalization is optional.
  }
}
