import { describe, expect, it } from 'vitest';
import { requestAdOnce, shouldRequestManualAd, showCatalogAd } from '@/lib/manual-ads';
import units from '@/data/ad-units.json';
import tracking from '@/data/site-tracking.json';

describe('manual ad safeguards', () => {
  it('uses the supplied Catalog Feed unit', () => {
    expect(units.catalog).toBe('6708057658');
  });
  it('uses the supplied Document Detail unit', () => {
    expect(units.document).toBe('7993219163');
  });
  it('uses the supplied publisher for units and the shared script', () => {
    expect(tracking.adsensePublisher).toBe('ca-pub-8782637659456848');
    expect(new URL(tracking.adsenseScript).searchParams.get('client')).toBe('ca-pub-8782637659456848');
  });
  it('places a single catalog ad after eight documents, only when more follow', () => {
    expect(Array.from({ length: 12 }, (_, i) => i).filter(i => showCatalogAd(i, 12))).toEqual([7]);
    expect(showCatalogAd(7, 8)).toBe(false);
    expect(showCatalogAd(0, 0)).toBe(false);
  });
  it('never requests manual ads on previews or disabled builds', () => {
    expect(shouldRequestManualAd(true, 'localhost', 'accepted', '1234567890')).toBe(false);
    expect(shouldRequestManualAd(false, 'fresh-teacher.github.io', 'accepted', '1234567890')).toBe(false);
  });
  it('requires accepted consent on production', () => {
    expect(shouldRequestManualAd(true, 'fresh-teacher.github.io', 'essential', '1234567890')).toBe(false);
    expect(shouldRequestManualAd(true, 'fresh-teacher.github.io', null, '1234567890')).toBe(false);
    expect(shouldRequestManualAd(true, 'fresh-teacher.github.io', 'accepted', '1234567890')).toBe(true);
  });
  it('does not send requests for missing or invalid unit IDs', () => {
    for (const slot of [null, '', 'placeholder', '123x']) {
      expect(shouldRequestManualAd(true, 'fresh-teacher.github.io', 'accepted', slot)).toBe(false);
    }
  });
  it('queues each physical element only once, including after failure', () => {
    const node = document.createElement('ins');
    let calls = 0;
    const push = () => { calls++; };
    expect(requestAdOnce(node, push)).toBe(true);
    expect(requestAdOnce(node, push)).toBe(false);
    expect(calls).toBe(1);
    const failed = document.createElement('ins');
    requestAdOnce(failed, () => { throw new Error('Network unavailable'); });
    expect(requestAdOnce(failed, push)).toBe(false);
    expect(calls).toBe(1);
  });
});