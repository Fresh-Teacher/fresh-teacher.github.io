/** Reuse audited class links without changing the imported catalog fragments. */
export function addClassResourceMenus(source: string): string {
  // A stray non-breaking space after each button reads as its own row once the menu stacks, so drop it before anything else.
  source = source.replace(/<\/button>(?:\s|\u00a0|&nbsp;)*<ul class="dropdown-menu/g, '</button><ul class="dropdown-menu');
  const groups = source.match(/<div class="btn-group[^>]*>.*?<\/ul>\s*<\/div>/gs) ?? [];
  const papers = groups.find(group => /<b>PAST PAPERS<\/b>/i.test(group));
  const originalHoliday = groups.find(group => /<b>HOLIDAY PACKAGES<\/b>/i.test(group));
  if (!papers || !originalHoliday) return source;
  const links = Array.from(papers.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g), match => ({ href: match[1] ?? '', label: match[2] ?? '' }));
  const holidays = links.filter(link => /packages/i.test(link.label));
  const exams = links.filter(link => !/packages/i.test(link.label));
  const menu = (label: string, animation: string, items: typeof links) => `<div class="btn-group m-r-10 class-resource-featured"><button class="btn btn-info dropdown-toggle waves-effect waves-light" data-toggle="dropdown" type="button"><b>${label}</b> <span class="class-resource-new"><span>NEW!</span></span></button><ul class="dropdown-menu animated ${animation}" role="menu">${items.length ? items.map(item => `<li><a href="${item.href}">${item.label}</a></li>`).join('') : '<li><span class="class-resource-empty" role="status">No holiday packages listed yet.</span></li>'}</ul></div>`;
  const holidayAnimation = originalHoliday.match(/dropdown-menu animated ([\w]+)/)?.[1] ?? 'slideInUp';
  // Keep audited controls intact while moving featured resources first and extras last.
  const remaining = groups.filter(group => group !== originalHoliday);
  const first = remaining[0];
  const last = remaining.at(-1);
  if (!first || !last) return source;
  const featured = `${menu('EXAMINATIONS', 'bounceInDown', exams)}${menu('HOLIDAY PACKAGES', holidayAnimation, holidays)}`;
  const extras = originalHoliday.replace(/HOLIDAY PACKAGES/g, 'MORE ITEMS');
  return source.replace(originalHoliday, '').replace(first, `${featured}${first}`).replace(last, `${last}${extras}`)
    .replace(/<button\b[^>]*data-toggle="dropdown"[^>]*>.*?<\/button>/gs, button => button
      .replace(/<span\b[^>]*class="(?:fa[^"\n]*|caret)"[^>]*>.*?<\/span>/gs, '')
      .replace(/\|/g, ''));
}