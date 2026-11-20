import { describe, expect, it } from 'vitest';
import { pageSeo } from '@/lib/page-seo';

const boilerplate = "Welcome To Fresh Teacher's Library, one stop center for academic needs of Ugandan schools.";

describe('pageSeo', () => {
  it('names class menu pages instead of "menu p3"', () => {
    const seo = pageSeo({ path: 'menu p3.html', title: 'menu p3 | Fresh Teacher', description: boilerplate });
    expect(seo.title).toBe('Primary Three (P3) Resources: Notes, Exams & Videos | Fresh Teacher');
  });

  it('names class pages instead of "p7"', () => {
    const seo = pageSeo({ path: 'p7.html', title: 'p7 | Fresh Teacher', description: boilerplate, sections: ['EXAMINATIONS', 'LESSON NOTES', 'MORE ITEMS'] });
    expect(seo.title).toBe('Primary Seven (P7) Notes & Past Papers | Fresh Teacher');
    expect(seo.description).toBe("Free Primary Seven (P7) examinations and lesson notes for Ugandan schools, all in one place on Fresh Teacher's e-Library.");
  });

  it('treats p.6.html as Primary Six', () => {
    expect(pageSeo({ path: 'p.6.html', title: 'p.6 | Fresh Teacher' }).title).toBe('Primary Six (P6) Notes & Past Papers | Fresh Teacher');
  });

  it('replaces the shared boilerplate description with one naming the page and its document count', () => {
    const seo = pageSeo({ path: 'BabyAllLessonNotes.html', title: 'Baby All Lesson Notes | Fresh Teacher', description: boilerplate, count: 125 });
    expect(seo.description).toBe("Download 125 free Baby All Lesson Notes for Ugandan schools from Fresh Teacher's e-Library.");
  });

  it('keeps a specific existing description', () => {
    const seo = pageSeo({ path: 'x.html', title: 'X Notes', description: 'Handwritten X notes for term one.' });
    expect(seo).toEqual({ title: 'X Notes | Fresh Teacher', description: 'Handwritten X notes for term one.' });
  });
});

describe('pageSeo generic one-liners', () => {
  it('replaces "Browse X from Fresh Teacher’s e-Library." with a count', () => {
    const seo = pageSeo({ path: 'BabyClassPastPapers.html', title: 'Baby Class Past Papers', description: 'Browse Baby Class Past Papers from Fresh Teacher’s e-Library.', count: 60 });
    expect(seo.description).toBe("Download 60 free Baby Class Past Papers for Ugandan schools from Fresh Teacher's e-Library.");
  });
});

describe('pageSeo run-together words', () => {
  it('splits "MTCPast Papers" and "Schemesof Work"', () => {
    expect(pageSeo({ path: 'a.html', title: 'Primary Seven MTCPast Papers | Fresh Teacher' }).title).toBe('Primary Seven MTC Past Papers | Fresh Teacher');
    expect(pageSeo({ path: 'b.html', title: 'Primary Five PESchemesof Work | Fresh Teacher' }).title).toBe('Primary Five PE Schemes of Work | Fresh Teacher');
  });
});

describe('pageSeo duplicates and abbreviations', () => {
  it('points p.6.html at p6.html', () => {
    expect(pageSeo({ path: 'p.6.html', title: 'p.6' }).canonical).toBe('/p6.html');
    expect(pageSeo({ path: 'p6.html', title: 'p6' }).canonical).toBeUndefined();
  });
  it('spells out Literacy', () => {
    expect(pageSeo({ path: 'c.html', title: 'Primary Two Lit1Schemes of Work' }).title).toBe('Primary Two Literacy 1 Schemes of Work | Fresh Teacher');
    expect(pageSeo({ path: 'd.html', title: 'Primary One Lit2LSchemes of Work' }).title).toBe('Primary One Literacy 2 Schemes of Work | Fresh Teacher');
  });
});

describe('pages kept out of search', () => {
  it('leaves the Google verification page and the duplicate P6 page out of the sitemap', async () => {
    const { publicCatalogPaths } = await import('@/lib/sitemap');
    const paths = publicCatalogPaths();
    expect(paths).not.toContain('/google1cb382fb81fc9248.html');
    expect(paths).not.toContain('/p.6.html');
    expect(paths).toContain('/p6.html');
    expect(paths).toContain('/menu p3.html');
  });
});
