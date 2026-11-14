import { ClassHubLayout } from '@/components/class-hub';
import { classHubLayouts } from '@/data/class-hub-layouts';

export type MenuSkeletonVariant = 'shelf' | 'resource' | 'list';

/** Picks the skeleton that matches the real page layout, using the legacy file naming scheme. */
export function menuVariantFor(path: string): MenuSkeletonVariant {
  let name = path;
  try { name = decodeURIComponent(path); } catch { /* keep the raw path */ }
  if (classHubLayouts[name]) return 'resource';
  if (/^Choose/i.test(name) || name === 'index2.html') return 'shelf';
  if (/^menu /i.test(name)) return 'resource';
  return 'list';
}

const SHELF_COVERS = [5, 1] as const;
const COVER_SLOTS = 5;
const RESOURCE_ROW_WIDTHS = [150, 110, 170, 140, 160];
const LIST_ROW_WIDTHS = [180, 150, 230, 170, 200, 140, 220, 160, 190, 150];

function ShelfSkeleton() {
  return (
    <>
      <div className="menu-skeleton__block menu-skeleton__marquee" />
      <div className="menu-skeleton__block menu-skeleton__heading" style={{ width: 400 }} />
      {SHELF_COVERS.map((covers, shelf) => (
        <div className="menu-skeleton__shelf" key={shelf}>
          <div className="menu-skeleton__covers">
            {Array.from({ length: COVER_SLOTS }, (_, slot) => (
              <div
                className={slot < covers ? 'menu-skeleton__block menu-skeleton__cover' : 'menu-skeleton__cover menu-skeleton__cover--empty'}
                key={slot}
              />
            ))}
          </div>
          <div className="menu-skeleton__shelf-bar" />
        </div>
      ))}
    </>
  );
}

function ResourceSkeleton() {
  return (
    <>
      <div className="menu-skeleton__block menu-skeleton__heading" style={{ width: 300 }} />
      <div className="menu-skeleton__group">
        {RESOURCE_ROW_WIDTHS.map((width, index) => (
          <div
            className={index === RESOURCE_ROW_WIDTHS.length - 1 ? 'menu-skeleton__row menu-skeleton__row--return' : 'menu-skeleton__row'}
            key={index}
          >
            <span className="menu-skeleton__icon" />
            <span className="menu-skeleton__text" style={{ width }} />
          </div>
        ))}
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <>
      <div className="menu-skeleton__block menu-skeleton__heading menu-skeleton__heading--large" style={{ width: 360 }} />
      <div className="menu-skeleton__list">
        {LIST_ROW_WIDTHS.map((width, index) => (
          <div className="menu-skeleton__list-row" key={index}>
            <span className="menu-skeleton__bullet" />
            <span className="menu-skeleton__text" style={{ width }} />
          </div>
        ))}
      </div>
    </>
  );
}

export function MenuSkeleton({ variant = 'list', path }: { variant?: MenuSkeletonVariant; path?: string }) {
  const layout = path ? classHubLayouts[path] : undefined;
  if (layout) return <ClassHubLayout heading={layout.heading} loading>
    {Array.from({ length: layout.menuCount }, (_, index) => <div className="btn-group" key={index} aria-hidden="true"><div className="menu-skeleton__row legacy-dropdown-trigger menu-skeleton__pulse"><span className="menu-skeleton__icon" /><span className="menu-skeleton__text" /></div></div>)}
  </ClassHubLayout>;
  return (
    <div className={`menu-skeleton menu-skeleton--${variant}`} role="status" aria-label="Loading menu options">
      <div className="menu-skeleton__pulse" aria-hidden="true">
        {variant === 'shelf' ? <ShelfSkeleton /> : variant === 'resource' ? <ResourceSkeleton /> : <ListSkeleton />}
      </div>
    </div>
  );
}
