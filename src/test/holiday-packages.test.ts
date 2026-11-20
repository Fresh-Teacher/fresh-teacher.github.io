import { describe, expect, it } from 'vitest';
import { findMoreDocumentsRepo, moreDocumentsClass, packagesHrefForClass } from '@/data/more-documents';
import { loadRepositoryDocuments } from '@/lib/repository-catalog';
import type { ClassHubData } from '@/lib/class-hubs';

const hubs = import.meta.glob<{ default: ClassHubData }>('@/data/class-hubs/*.json', { eager: true });

describe('Holiday Packages', () => {
  it('opens the packages documents page from every class Holiday Packages button', () => {
    for (const [path, hub] of Object.entries(hubs)) {
      const menu = hub.default.menus.find(item => item.label === 'HOLIDAY PACKAGES');
      if (!menu) continue;
      const key = moreDocumentsClass(path.split('/').at(-1)?.replace(/\.json$/, '') ?? '');
      expect(key, path).toBeTruthy();
      expect(menu.href, path).toBe(packagesHrefForClass(key ?? ''));
      expect(menu.items, path).toEqual([]);
    }
  });
  it('has an empty packages catalog while the repository is empty', async () => {
    expect(findMoreDocumentsRepo('packages')?.label).toBe('Holiday Packages');
    expect(await loadRepositoryDocuments('packages')).toEqual([]);
  });
});
