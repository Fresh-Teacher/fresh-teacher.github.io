import { act, cleanup, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { AppBar } from '@/components/navigation/app-bar';

const mocks = vi.hoisted(() => ({ preload: vi.fn(() => Promise.resolve([])) }));
vi.mock('@/lib/library-search', () => ({ preloadLibrarySearch: mocks.preload }));
vi.mock('@/components/navigation/quick-search', () => ({ QuickSearch: () => null }));
vi.mock('@/components/navigation/install-card', () => ({ InstallCard: () => null }));
vi.mock('@tanstack/react-router', () => ({ Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a> }));

afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); Reflect.deleteProperty(navigator, 'connection'); });

function renderAppBar() {
  return render(<AppBar triggerRef={createRef<HTMLButtonElement>()} menuExpanded installOpen={false} onToggleMenu={vi.fn()} onToggleInstall={vi.fn()} onCloseInstall={vi.fn()} />);
}

it('loads the search index during browser idle time', () => {
  let idle: (() => void) | undefined;
  const request = vi.fn((callback: () => void) => { idle = callback; return 17; });
  const cancel = vi.fn();
  vi.stubGlobal('requestIdleCallback', request);
  vi.stubGlobal('cancelIdleCallback', cancel);
  const view = renderAppBar();
  expect(request).toHaveBeenCalledExactlyOnceWith(expect.any(Function), { timeout: 4000 });
  expect(mocks.preload).not.toHaveBeenCalled();
  act(() => idle?.());
  expect(mocks.preload).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(cancel).toHaveBeenCalledExactlyOnceWith(17);
});

it('does not download the idle index when the user requests reduced data', () => {
  const request = vi.fn();
  vi.stubGlobal('requestIdleCallback', request);
  Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true } });
  renderAppBar();
  expect(request).not.toHaveBeenCalled();
  expect(mocks.preload).not.toHaveBeenCalled();
  Reflect.deleteProperty(navigator, 'connection');
});
