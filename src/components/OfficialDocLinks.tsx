import { DownloadIcon } from './Icons';

type DocVariant = 'mscfe' | 'ambassador';

interface OfficialDocLinksProps {
  variant: DocVariant;
  compact?: boolean;
}

const MSCFE_DOCS = [
  {
    href: '/IDLA_Official_Scholarship_Policy_MScFE_2026_2027.pdf',
    download: 'IDLA_Politique_Bourse_MScFE_2026_2027_FR.pdf',
    label: 'Politique officielle (FR)',
  },
  {
    href: '/IDLA_Official_Scholarship_Policy_MScFE_2026_2027_EN.pdf',
    download: 'IDLA_Official_Scholarship_Policy_MScFE_2026_2027_EN.pdf',
    label: 'Official Policy (EN)',
  },
] as const;

const AMBASSADOR_DOCS = [
  {
    href: '/IDLA_Ambassador_Program_MScFE_FR.pdf',
    download: 'IDLA_Programme_Ambassadeurs_MScFE_FR.pdf',
    label: 'Guide ambassadeur (FR)',
  },
  {
    href: '/IDLA_Ambassador_Program_MScFE_EN.pdf',
    download: 'IDLA_Ambassador_Program_MScFE_EN.pdf',
    label: 'Ambassador Guide (EN)',
  },
] as const;

/**
 * Toujours les deux versions linguistiques, quel que soit l’UI FR/EN.
 */
export default function OfficialDocLinks({ variant, compact = false }: OfficialDocLinksProps) {
  const docs = variant === 'mscfe' ? MSCFE_DOCS : AMBASSADOR_DOCS;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : 'pt-1'}`}>
      {docs.map((doc) => (
        <a
          key={doc.href}
          href={doc.href}
          download={doc.download}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-bg-primary hover:bg-border-primary/40 text-text-primary border border-border-primary font-bold text-[11px] px-3 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <DownloadIcon className="w-3.5 h-3.5 text-brand-primary" />
          <span>{doc.label}</span>
        </a>
      ))}
    </div>
  );
}
