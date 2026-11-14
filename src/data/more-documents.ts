// "More Documents" dropdown: which Fresh-Teacher GitHub repositories each class page offers.
export interface MoreDocumentsRepo { repo: string; label: string }

const set = (short: string, extra: MoreDocumentsRepo[] = []): MoreDocumentsRepo[] => [
  { repo: short.toLowerCase().replace(/\s+class$/i, ''), label: `Mixed ${short} Documents` },
  ...extra,
];
const std = (short: string, key: string) => set(short, [
  { repo: `${key}-notes`, label: `Mixed ${short} Lesson Notes` },
  { repo: `${key}-past-papers`, label: `Mixed ${short} Past Papers` },
]);

export const MORE_DOCUMENTS: Record<string, MoreDocumentsRepo[]> = {
  baby: [{ repo: 'baby', label: 'Mixed Baby Class Documents' }, { repo: 'baby-class-past-papers', label: 'Mixed Baby Class Past Papers' }],
  middle: [{ repo: 'middle', label: 'Mixed Middle Class Documents' }, { repo: 'middle-class-past-papers', label: 'Mixed Middle Class Past Papers' }],
  top: [{ repo: 'top', label: 'Mixed Top Class Documents' }, { repo: 'top-class-past-papers', label: 'Mixed Top Class Past Papers' }],
  p1: std('P1', 'p1'), p2: std('P2', 'p2'), p3: std('P3', 'p3'), p4: std('P4', 'p4'),
  p5: std('P5', 'p5'), p6: std('P6', 'p6'),
  p7: [
    ...std('P7', 'p7'),
    { repo: 'p.7', label: 'More Mixed P7 Documents' },
    { repo: 'p7-eng-past-papers', label: 'Mixed P7 English Past Papers' },
    { repo: 'p7-mtc-past-papers', label: 'Mixed P7 MTC Past Papers' },
    { repo: 'p7-science-past-papers', label: 'Mixed P7 Science Past Papers' },
    { repo: 'p7-sst-past-papers', label: 'Mixed P7 SST Past Papers' },
  ],
  s1: std('S1', 's1'), s2: std('S2', 's2'), s3: std('S3', 's3'), s4: std('S4', 's4'),
  s5: std('S5', 's5'), s6: std('S6', 's6'),
};

/** Class key for a class landing page path such as "p5.html" or "p.6.html". */
export function moreDocumentsClass(path: string): string | null {
  const key = path.replace(/^\//, '').replace(/\.html$/i, '').replace('.', '').toLowerCase();
  return key in MORE_DOCUMENTS ? key : null;
}

export function findMoreDocumentsRepo(repo: string): MoreDocumentsRepo | null {
  for (const list of Object.values(MORE_DOCUMENTS)) {
    const hit = list.find(item => item.repo === repo);
    if (hit) return hit;
  }
  return null;
}

export const moreDocumentsHref = (repo: string) => `/more/${encodeURIComponent(repo)}`;
