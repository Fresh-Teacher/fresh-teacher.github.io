import { describe, expect, it } from 'vitest';
import { absoluteUrl, breadcrumbJsonLd, classOf, pageMeta, SHARE_IMAGE, SITE_URL } from '../lib/site';
import { SITEMAP_BASE_URL } from '../lib/sitemap';
import { pageTrail } from '../lib/page-seo';
import { readFileSync } from 'node:fs';

describe('public site address', () => {
  it('is the GitHub Pages origin for canonicals and the sitemap', () => {
    expect(SITE_URL).toBe('https://fresh-teacher.github.io');
    expect(SITEMAP_BASE_URL).toBe('https://fresh-teacher.github.io');
  });
  it('robots.txt points crawlers at the production sitemap', () => {
    expect(readFileSync('public/robots.txt', 'utf8')).toContain('Sitemap: https://fresh-teacher.github.io/sitemap.xml');
  });
  it('builds absolute, encoded page URLs', () => {
    expect(absoluteUrl('/menu p3.html')).toBe('https://fresh-teacher.github.io/menu%20p3.html');
    expect(absoluteUrl('about')).toBe('https://fresh-teacher.github.io/about');
  });
});

describe('page meta', () => {
  const head = pageMeta({ path: '/p.6.html', title: 'P6', description: 'd', canonical: '/p6.html' });
  it('emits an absolute canonical and matching og:url', () => {
    expect(head.links).toEqual([{ rel: 'canonical', href: 'https://fresh-teacher.github.io/p6.html' }]);
    expect(head.meta).toContainEqual({ property: 'og:url', content: 'https://fresh-teacher.github.io/p6.html' });
  });
  it('omits generic share images that are not displayed page covers', () => {
    expect(SHARE_IMAGE).toMatch(/^https:\/\/raw\.githubusercontent\.com\/Fresh-Teacher\/.*\/public\/og-image\.jpg$/);
    expect(head.meta.some(tag => 'property' in tag && tag.property === 'og:image')).toBe(false);
    expect(head.meta.some(tag => 'name' in tag && tag.name === 'twitter:image')).toBe(false);
  });
  it('can omit the canonical for hidden pages', () => {
    expect(pageMeta({ path: '/x', title: 't', description: 'd', canonical: false }).links).toEqual([]);
  });
});

describe('breadcrumbs', () => {
  it('reads the class from catalog file names', () => {
    expect(classOf('PrimarySevenMTCPastPapers.html')).toBe('p7');
    expect(classOf('EnglishPrimarySevenClassPastPapers.html')).toBe('p7');
    expect(classOf('ChooseSeniorTwoPastPapers.html')).toBe('s2');
    expect(classOf('ChooseTopClassLessonNotes.html')).toBe('top');
    expect(classOf('menu p3.html')).toBe('p3');
    expect(classOf('p.6.html')).toBe('p6');
    expect(classOf('movie.html')).toBeUndefined();
  });
  it('links a document list back to its class page', () => {
    expect(pageTrail('PrimarySevenMTCPastPapers.html', 'Primary Seven MTC Past Papers | Fresh Teacher')).toEqual([
      { name: 'Primary Seven (P7)', path: '/p7.html' },
      { name: 'Primary Seven MTC Past Papers', path: '/PrimarySevenMTCPastPapers.html' },
    ]);
    expect(pageTrail('p7.html', 'x | Fresh Teacher')).toEqual([{ name: 'Primary Seven (P7)', path: '/p7.html' }]);
  });
  it('starts every trail at the absolute homepage', () => {
    const data = JSON.parse(breadcrumbJsonLd([{ name: 'Primary Seven (P7)', path: '/p7.html' }]).children);
    expect(data.itemListElement[0]).toEqual({ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://fresh-teacher.github.io/' });
    expect(data.itemListElement[1].item).toBe('https://fresh-teacher.github.io/p7.html');
  });
});
