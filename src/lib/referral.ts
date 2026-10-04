import { ReferralCode } from '../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID, Query, Permission, Role } from './appwrite';
import { getReferralDestinationTitle } from './referralPrograms';

const LOCAL_STORAGE_KEY = 'idla_admin_referral_codes';
const SESSION_REF_KEY = 'idla_referral_code';
const SESSION_PROGRAM_KEY = 'idla_referral_program';

const readSessionCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem(SESSION_REF_KEY);
    return stored ? stored.trim().toUpperCase() : null;
  } catch {
    return null;
  }
};

const writeSessionCode = (code: string) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_REF_KEY, code.trim().toUpperCase());
  } catch {}
};

const readSessionProgram = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(SESSION_PROGRAM_KEY);
  } catch {
    return null;
  }
};

const writeSessionProgram = (title: string) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_PROGRAM_KEY, title);
  } catch {}
};

const parseProgramFromLocation = (): string | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash || '';
  const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
  const hashParams = hashQuery ? new URLSearchParams(hashQuery) : null;
  return params.get('program') || params.get('filiere') || hashParams?.get('program') || hashParams?.get('filiere');
};

/**
 * Programme de destination du parrainage (catalogue admin, MScFE par défaut).
 */
export function getCapturedReferralProgram(): string {
  const fromUrl = parseProgramFromLocation();
  const resolved = getReferralDestinationTitle(fromUrl || readSessionProgram());
  writeSessionProgram(resolved);
  return resolved;
}

/**
 * Construit l'URL canonique de parrainage vers le programme éligible.
 */
export function buildReferralLink(code: string, programTitle?: string): string {
  if (!code) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://idlaacademy.online';
  const program = getReferralDestinationTitle(programTitle);
  const params = new URLSearchParams({
    ref: code.trim().toUpperCase(),
    program,
  });
  return `${origin}/candidature?${params.toString()}`;
}

/**
 * Lit le code uniquement depuis l’URL (query + hash), sans session.
 */
export function parseReferralCodeFromLocation(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash || '';
  const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
  const hashParams = hashQuery ? new URLSearchParams(hashQuery) : null;

  const rawCode =
    params.get('ref') ||
    params.get('code') ||
    params.get('sponsor') ||
    hashParams?.get('ref') ||
    hashParams?.get('code') ||
    hashParams?.get('sponsor') ||
    null;

  return rawCode ? rawCode.trim().toUpperCase() : null;
}

/**
 * Capture le code dans la session pour qu’il survive à la navigation interne.
 */
export function captureReferralFromLocation(): string | null {
  const fromUrl = parseReferralCodeFromLocation();
  if (fromUrl) {
    writeSessionCode(fromUrl);
    getCapturedReferralProgram();
    return fromUrl;
  }
  const stored = readSessionCode();
  if (stored) getCapturedReferralProgram();
  return stored;
}

/**
 * Code parrain actif (URL puis session).
 */
export function parseReferralCodeFromUrl(): string | null {
  return captureReferralFromLocation();
}

export function getCapturedReferralCode(): string | null {
  return captureReferralFromLocation();
}

/**
 * Si l’ancien format /#candidature?ref= est utilisé, redirige vers /candidature?ref=.
 */
export function migrateLegacyReferralHash(): { tab: 'candidature' | 'ambassadeur' | null; code: string | null } {
  if (typeof window === 'undefined') {
    return { tab: null, code: null };
  }

  const code = captureReferralFromLocation();
  const hashPath = (window.location.hash || '').replace(/^#\/?/, '').split('?')[0];

  if (hashPath === 'candidature' || hashPath === 'ambassadeur') {
    const path = hashPath === 'candidature' ? '/candidature' : '/ambassadeur';
    const qs = new URLSearchParams(window.location.search);
    if (code && !qs.get('ref')) qs.set('ref', code);
    if (code && !qs.get('program')) qs.set('program', getCapturedReferralProgram());
    const next = qs.toString() ? `${path}?${qs.toString()}` : path;
    window.history.replaceState({ tab: hashPath }, '', next);
    return { tab: hashPath, code };
  }

  return { tab: null, code };
}

export function withReferralQuery(path: string): string {
  const code = getCapturedReferralCode();
  if (!code || !path.startsWith('/candidature')) return path;
  const url = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'https://idlaacademy.online');
  if (!url.searchParams.get('ref')) url.searchParams.set('ref', code);
  if (!url.searchParams.get('program')) url.searchParams.set('program', getCapturedReferralProgram());
  return `${url.pathname}${url.search}`;
}

/**
 * Récupère les codes de parrainage stockés localement.
 */
export function getLocalReferralCodes(): ReferralCode[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("Erreur lecture localStorage referral codes:", e);
    return [];
  }
}

/**
 * Sauvegarde un code de parrainage localement.
 */
export function saveLocalReferralCode(refCode: ReferralCode): void {
  try {
    const current = getLocalReferralCodes();
    const existingIdx = current.findIndex(c => c.id === refCode.id || c.code === refCode.code);
    if (existingIdx >= 0) {
      current[existingIdx] = refCode;
    } else {
      current.unshift(refCode);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn("Erreur sauvegarde local referral code:", e);
  }
}

/**
 * Charge tous les codes de parrainage (Appwrite DB + LocalStorage fallback).
 * La base cloud l’emporte pour éviter d’écraser le compteur d’usages.
 */
export async function loadAllReferralCodes(): Promise<ReferralCode[]> {
  const localList = getLocalReferralCodes();
  let dbList: ReferralCode[] = [];

  if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.referrals) {
    try {
      const res = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.referrals,
        [Query.orderDesc('$createdAt'), Query.limit(100)]
      );
      dbList = res.documents.map((doc: any) => ({
        id: doc.$id,
        code: doc.code,
        sponsorEmail: doc.sponsorEmail,
        sponsorName: doc.sponsorName,
        targetProgram: doc.targetProgram,
        discountReward: doc.discountReward,
        maxUses: doc.maxUses ? Number(doc.maxUses) : undefined,
        currentUses: doc.currentUses ? Number(doc.currentUses) : 0,
        expiresAt: doc.expiresAt,
        status: doc.status || 'Active',
        createdAt: doc.$createdAt || doc.createdAt || new Date().toISOString(),
      }));
    } catch (err) {
      // Ignorer silencieusement si la collection n'est pas encore approvisionnée
    }
  }

  const map = new Map<string, ReferralCode>();
  localList.forEach(item => {
    if (item?.code) map.set(item.code.toUpperCase(), item);
  });
  dbList.forEach(item => {
    if (item?.code) {
      const key = item.code.toUpperCase();
      const local = map.get(key);
      map.set(key, {
        ...item,
        currentUses: Math.max(item.currentUses || 0, local?.currentUses || 0),
      });
    }
  });

  return Array.from(map.values());
}

/**
 * Enregistre ou met à jour un code de parrainage dans Appwrite DB et LocalStorage.
 */
export async function persistReferralCode(refData: Omit<ReferralCode, 'id' | 'createdAt'> & { id?: string }): Promise<ReferralCode> {
  const codeFormatted = refData.code.trim().toUpperCase();
  const now = new Date().toISOString();
  
  const refCode: ReferralCode = {
    id: refData.id || `ref_${Date.now()}`,
    code: codeFormatted,
    sponsorEmail: refData.sponsorEmail,
    sponsorName: refData.sponsorName,
    targetProgram: getReferralDestinationTitle(refData.targetProgram),
    discountReward: refData.discountReward || 'Frais de dossier offerts',
    maxUses: refData.maxUses,
    currentUses: refData.currentUses || 0,
    expiresAt: refData.expiresAt,
    status: refData.status || 'Active',
    createdAt: now,
  };

  saveLocalReferralCode(refCode);

  if (isAppwriteDbConfigured() && APPWRITE_CONFIG.collections.referrals) {
    try {
      const payload = {
        code: refCode.code,
        sponsorEmail: refCode.sponsorEmail,
        sponsorName: refCode.sponsorName,
        targetProgram: refCode.targetProgram,
        discountReward: refCode.discountReward,
        maxUses: refCode.maxUses,
        currentUses: refCode.currentUses,
        expiresAt: refCode.expiresAt,
        status: refCode.status,
      };

      let remoteId = refData.id && !refData.id.startsWith('ref_') ? refData.id : '';

      if (!remoteId) {
        const existing = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.referrals,
          [Query.equal('code', codeFormatted), Query.limit(1)]
        );
        if (existing.documents.length > 0) {
          remoteId = existing.documents[0].$id;
        }
      }

      if (remoteId) {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.referrals,
          remoteId,
          payload
        );
        refCode.id = remoteId;
      } else {
        const doc = await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.referrals,
          ID.unique(),
          payload,
          [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
        );
        refCode.id = doc.$id;
      }
      saveLocalReferralCode(refCode);
    } catch (e) {
      console.warn("Erreur écriture Appwrite DB referrals (fallback local maintenu):", e);
    }
  }

  return refCode;
}

/**
 * Incrémente le compteur d'utilisation d'un code de parrainage lors d'une inscription.
 */
export async function registerReferralCodeUsage(codeStr: string): Promise<void> {
  if (!codeStr) return;
  const cleanCode = codeStr.trim().toUpperCase();
  const all = await loadAllReferralCodes();
  const target = all.find(c => c.code.toUpperCase() === cleanCode);
  if (!target) return;

  const updated: ReferralCode = {
    ...target,
    currentUses: (target.currentUses || 0) + 1,
  };

  await persistReferralCode(updated);
}

export function isReferralUsable(matched: ReferralCode): { ok: true } | { ok: false; reason: string } {
  if (matched.status !== 'Active') {
    return { ok: false, reason: 'Ce code de parrainage est temporairement en pause.' };
  }
  if (matched.expiresAt && new Date(matched.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: 'Ce code de parrainage a expiré.' };
  }
  if (matched.maxUses && matched.currentUses >= matched.maxUses) {
    return { ok: false, reason: "La limite d'utilisations de ce code parrain a été atteinte." };
  }
  return { ok: true };
}
