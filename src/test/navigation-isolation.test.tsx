import { memo } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { LibraryShell } from '@/components/library-shell';
const routerMock = vi.hoisted(() => ({ navigate: vi.fn(), history: { back: vi.fn() } }));

const treeRender = vi.hoisted(() => vi.fn());
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => routerMock,
  useRouterState: ({ select }: { select: (state: { status: string }) => unknown }) => select({ status: 'idle' }),
  Link: ({ to, children, ...props }: { to: string; children?: unknown } & Record<string, unknown>) => <a href={to} {...props}>{children as never}</a>,
  useLocation: ({ select }: { select: (location: { pathname: string }) => string }) => select({ pathname: '/' }),
}));
vi.mock('@/components/navigation/nav-tree', async importOriginal => {
  const actual = await importOriginal<typeof import('@/components/navigation/nav-tree')>();
  return {
    ...actual,
    NavTree: memo(function TrackedTree(props: React.ComponentProps<typeof actual.NavTree>) {
      treeRender();
      return <actual.NavTree {...props} />;
    }),
  };
});

afterEach(() => { cleanup(); treeRender.mockClear(); });

it('does not redraw the navigation tree for the install card, drawer visibility, or page-content updates', () => {
  const view = render(<LibraryShell>Page one</LibraryShell>);
  const initialRenders = treeRender.mock.calls.length;
  expect(initialRenders).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'Install the app' }));
  fireEvent.click(screen.getByRole('button', { name: 'Close install card' }));
  fireEvent.click(screen.getByRole('button', { name: 'Toggle class menu' }));
  view.rerender(<LibraryShell>Page two</LibraryShell>);
  expect(treeRender).toHaveBeenCalledTimes(initialRenders);
  fireEvent.click(screen.getByRole('button', { name: 'Nursery Section' }));
  expect(treeRender.mock.calls.length).toBeGreaterThan(initialRenders);
});