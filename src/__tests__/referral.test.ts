import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildReferralLink,
  parseReferralCodeFromLocation,
  captureReferralFromLocation,
  migrateLegacyReferralHash,
  withReferralQuery,
  isReferralUsable,
  getCapturedReferralProgram,
} from '../lib/referral';
import { getDefaultReferralProgramTitle, MSCFE_PROGRAM_TITLE } from '../lib/referralPrograms';
import { ReferralCode } from '../types';

const setLocation = (url: string) => {
  window.history.replaceState({}, '', url);
};

describe('referral tracking', () => {
  beforeEach(() => {
    sessionStorage.clear();
    setLocation('/');
  });

  it('builds a path-based candidature link with the ref query', () => {
    const link = buildReferralLink('idla-jea-x8k2p');
    expect(link).toContain('/candidature?');
    expect(link).toContain('ref=IDLA-JEA-X8K2P');
    expect(link).toContain('program=');
    expect(link).toContain('MScFE');
    expect(link).not.toContain('#candidature');
  });

  it('reads the referral code from /candidature?ref=', () => {
    setLocation('/candidature?ref=IDLA-JEAN-ABC12');
    expect(parseReferralCodeFromLocation()).toBe('IDLA-JEAN-ABC12');
  });

  it('reads the referral code from the legacy hash URL', () => {
    setLocation('/#candidature?ref=IDLA-PAUL-ZZ9');
    expect(parseReferralCodeFromLocation()).toBe('IDLA-PAUL-ZZ9');
  });

  it('keeps the code in session after leaving the query string', () => {
    setLocation('/candidature?ref=IDLA-KEEP-1');
    expect(captureReferralFromLocation()).toBe('IDLA-KEEP-1');
    setLocation('/programmes');
    expect(captureReferralFromLocation()).toBe('IDLA-KEEP-1');
  });

  it('migrates #candidature?ref= to /candidature?ref=', () => {
    setLocation('/#candidature?ref=IDLA-MIG-1');
    const result = migrateLegacyReferralHash();
    expect(result.tab).toBe('candidature');
    expect(result.code).toBe('IDLA-MIG-1');
    expect(window.location.pathname).toBe('/candidature');
    expect(new URLSearchParams(window.location.search).get('ref')).toBe('IDLA-MIG-1');
    expect(new URLSearchParams(window.location.search).get('program')).toContain('MScFE');
  });

  it('adds the captured ref when opening /candidature', () => {
    setLocation('/?ref=IDLA-HOME-1');
    captureReferralFromLocation();
    const next = withReferralQuery('/candidature');
    expect(next).toContain('/candidature?');
    expect(next).toContain('ref=IDLA-HOME-1');
    expect(next).toContain('MScFE');
  });

  it('rejects expired or paused codes', () => {
    const base: ReferralCode = {
      id: '1',
      code: 'IDLA-X',
      sponsorEmail: 'a@b.c',
      sponsorName: 'A',
      currentUses: 0,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    expect(isReferralUsable({ ...base, status: 'Paused' }).ok).toBe(false);
    expect(isReferralUsable({ ...base, expiresAt: '2020-01-01' }).ok).toBe(false);
    expect(isReferralUsable({ ...base, maxUses: 1, currentUses: 1 }).ok).toBe(false);
    expect(isReferralUsable(base).ok).toBe(true);
  });

  it('defaults the referral destination to MScFE', () => {
    expect(getDefaultReferralProgramTitle()).toBe(MSCFE_PROGRAM_TITLE);
    setLocation('/candidature?ref=IDLA-HOME-1');
    captureReferralFromLocation();
    expect(getCapturedReferralProgram()).toBe(MSCFE_PROGRAM_TITLE);
  });
});
