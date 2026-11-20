export type ClassHubItem = { href: string; label: string } | { divider: true } | { empty: string };
export interface ClassHubData {
  title: string;
  description: string;
  heading: string;
  /** A menu with `href` renders as a plain button link instead of a dropdown. */
  menus: { label: string; featured: boolean; href?: string; items: ClassHubItem[] }[];
}

/** The original resource-specific Animate.css entrances, independent of menu order. */
export const classMenuAnimations: Readonly<Record<string, string>> = {
  'EXAMINATIONS': 'bounceInDown',
  'HOLIDAY PACKAGES': 'slideInUp',
  'LESSON NOTES': 'flipInY',
  'PAST PAPERS': 'flipInX',
  'SCHEMES OF WORK': 'lightSpeedIn',
  'MORE ITEMS': 'slideInUp',
};