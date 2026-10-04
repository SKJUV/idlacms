import { ReferralProgram } from '../types';

export const MSCFE_PROGRAM_TITLE = 'Master of Science in Financial Engineering (MScFE)';
export const MSCFE_PROGRAM_SLUG = 'mscfe';

const STORAGE_KEY = 'idla_referral_programs';

export const DEFAULT_REFERRAL_PROGRAMS: ReferralProgram[] = [
  {
    id: 'refprog_mscfe',
    title: MSCFE_PROGRAM_TITLE,
    slug: MSCFE_PROGRAM_SLUG,
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const slugify = (title: string): string =>
  title
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'programme';

const titlesMatch = (a: string, b: string): boolean => {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes('mscfe') && right.includes('mscfe')) return true;
  return false;
};

export function getLocalReferralPrograms(): ReferralProgram[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored: ReferralProgram[] = raw ? JSON.parse(raw) : [];
    const map = new Map<string, ReferralProgram>();
    DEFAULT_REFERRAL_PROGRAMS.forEach(item => map.set(item.slug, item));
    stored.forEach(item => {
      if (item?.slug || item?.title) {
        map.set(item.slug || slugify(item.title), item);
      }
    });
    return Array.from(map.values());
  } catch {
    return [...DEFAULT_REFERRAL_PROGRAMS];
  }
}

export function saveReferralPrograms(list: ReferralProgram[]): ReferralProgram[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
  return list;
}

export function getEnabledReferralPrograms(): ReferralProgram[] {
  return getLocalReferralPrograms().filter(p => p.enabled);
}

export function getDefaultReferralProgramTitle(): string {
  return getEnabledReferralPrograms()[0]?.title || MSCFE_PROGRAM_TITLE;
}

export function getReferralDestinationTitle(preferred?: string | null): string {
  const enabled = getEnabledReferralPrograms();
  if (preferred?.trim()) {
    const match = enabled.find(p => titlesMatch(p.title, preferred) || p.slug === preferred.trim().toLowerCase());
    if (match) return match.title;
  }
  return enabled[0]?.title || MSCFE_PROGRAM_TITLE;
}

export function upsertReferralProgram(title: string): ReferralProgram {
  const cleanTitle = title.trim();
  const list = getLocalReferralPrograms();
  const existing = list.find(p => titlesMatch(p.title, cleanTitle) || p.slug === slugify(cleanTitle));
  if (existing) {
    const updated = { ...existing, title: cleanTitle, enabled: true };
    return saveReferralPrograms(list.map(p => p.id === existing.id ? updated : p)).find(p => p.id === existing.id)!;
  }
  const created: ReferralProgram = {
    id: `refprog_${Date.now()}`,
    title: cleanTitle,
    slug: slugify(cleanTitle),
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  saveReferralPrograms([created, ...list]);
  return created;
}

export function setReferralProgramEnabled(id: string, enabled: boolean): ReferralProgram[] {
  const list = getLocalReferralPrograms();
  const enabledCount = list.filter(p => p.enabled).length;
  const next = list.map(p => {
    if (p.id !== id) return p;
    if (!enabled && enabledCount <= 1) return p;
    return { ...p, enabled };
  });
  return saveReferralPrograms(next);
}

export function removeReferralProgram(id: string): ReferralProgram[] {
  const list = getLocalReferralPrograms().filter(p => p.id !== id);
  if (!list.some(p => p.enabled)) {
    return saveReferralPrograms(DEFAULT_REFERRAL_PROGRAMS);
  }
  return saveReferralPrograms(list);
}

export function findProgramInCatalog<T extends { title: string; type?: string }>(
  programs: T[],
  title: string
): T | undefined {
  return programs.find(p => titlesMatch(p.title, title));
}
