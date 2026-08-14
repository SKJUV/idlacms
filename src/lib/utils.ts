/**
 * IDLA CMS — Shared Helper Utilities & Clean Helpers
 */

/**
 * Format ISO date string to readable French date (e.g. "15 sept. 2026")
 */
export function formatDate(isoDate: string): string {
  if (!isoDate) return '—';
  try {
    return new Date(isoDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return isoDate;
  }
}

/**
 * Format ISO date string with time (e.g. "15 sept. 14:30")
 */
export function formatDateTime(isoDate?: string): string {
  if (!isoDate) return "À l'instant";
  try {
    return new Date(isoDate).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return isoDate;
  }
}

/**
 * Format file size in Bytes to readable string (e.g. "2.4 MB")
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculate days remaining until a given target ISO date
 */
export function getDaysRemaining(isoDate: string): number {
  try {
    return Math.ceil((new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
}

/**
 * Generate a deterministic unique class chat channel ID from program, course, and level names
 */
export function getClassChatId(programName?: string | null, courseName?: string | null, levelName?: string | null): string {
  const c = (courseName || 'general').trim().toLowerCase();
  const l = (levelName || 'L1').trim().toLowerCase();
  const key = `course___${c}___${l}`;

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return `cls_${Math.abs(hash)}`;
}

/**
 * HTML Sanitization Helper to escape unsafe strings
 */
export function escapeHtml(unsafe: string): string {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
