import { expect, it } from 'vitest';
import { homepageShelves } from '@/data/homepage-shelves';

it('puts four classes on every homepage shelf without dropping or reordering classes', () => {
  expect(homepageShelves.map(shelf => shelf.length)).toEqual([4, 4, 4, 4]);
  expect(homepageShelves.flat().map(([href]) => href)).toEqual([
    '/baby.html', '/middle.html', '/top.html', '/p1.html',
    '/p2.html', '/p3.html', '/p4.html', '/p5.html',
    '/p6.html', '/p7.html', '/s1.html', '/s2.html',
    '/s3.html', '/s4.html', '/s5.html', '/s6.html',
  ]);
});