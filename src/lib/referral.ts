import { ReferralCode } from '../types';
import { databases, APPWRITE_CONFIG, isAppwriteDbConfigured, ID, Query } from './appwrite';

const LOCAL_STORAGE_KEY = 'idla_admin_referral_codes';

/**
 * Construit l'URL canonique de parrainage basée sur l'origine actuelle.
 */
export function buildReferralLink(code: string): string {
  if (!code) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://idla-edu.com';
  return `${origin}/#candidature?ref=${encodeURIComponent(code.trim().toUpperCase())}`;
}

/**
 * Extrait le code parrain (?ref=... ou ?code=... ou ?sponsor=...) depuis l'URL.
 */
export function parseReferralCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const hashSearch = window.location.hash.includes('?') 
    ? new URLSearchParams(window.location.hash.split('?')[1])
    : null;

  const rawCode = params.get('ref') || params.get('code') || params.get('sponsor') ||
                  (hashSearch ? (hashSearch.get('ref') || hashSearch.get('code') || hashSearch.get('sponsor')) : null);

  return rawCode ? rawCode.trim().toUpperCase() : null;
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

  // Fusionner les listes sans doublons
  const map = new Map<string, ReferralCode>();
  [...dbList, ...localList].forEach(item => {
    if (item && item.code) {
      map.set(item.code.toUpperCase(), item);
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
    targetProgram: refData.targetProgram || 'Tous les programmes',
    discountReward: refData.discountReward || 'Frais de dossier offerts',
    maxUses: refData.maxUses,
    currentUses: refData.currentUses || 0,
    expiresAt: refData.expiresAt,
    status: refData.status || 'Active',
    createdAt: now,
  };

  // 1. Sauvegarde locale
  saveLocalReferralCode(refCode);

  // 2. Persistance Appwrite DB si disponible
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

      if (refData.id && !refData.id.startsWith('ref_')) {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.referrals,
          refData.id,
          payload
        );
      } else {
        const doc = await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.referrals,
          ID.unique(),
          payload
        );
        refCode.id = doc.$id;
        saveLocalReferralCode(refCode);
      }
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
    currentUses: target.currentUses + 1,
  };

  await persistReferralCode(updated);
}
