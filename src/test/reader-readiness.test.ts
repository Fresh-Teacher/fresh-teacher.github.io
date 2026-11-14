import { afterEach, expect, it, vi } from 'vitest';
import { readerIsReady } from '@/lib/reader-readiness';
import { hideViewerLoading, hideViewerLoadingWhenReady, isViewerLoading, showViewerLoading } from '@/lib/viewer-loading';

afterEach(() => { hideViewerLoading(); document.body.innerHTML = ''; vi.useRealTimers(); });

it('does not mistake the initial empty WebGL canvas for a rendered PDF', () => {
  document.body.innerHTML = '<div class="flipbook-preloader" style="display:block"></div><div class="flipbook-bookLayer"><canvas width="800" height="600"></canvas></div>';
  expect(readerIsReady(document)).toBe(false);
  const preloader = document.querySelector<HTMLElement>('.flipbook-preloader');
  if (!preloader) throw new Error('Missing preloader');
  preloader.style.display = 'none';
  expect(readerIsReady(document)).toBe(true);
});

it('recognises a completed vertical page and a failed preview', () => {
  document.body.innerHTML = '<div data-rendered="true"><canvas></canvas></div>';
  expect(readerIsReady(document)).toBe(true);
  document.body.innerHTML = '<div id="reader-status">Preview unavailable</div>';
  expect(readerIsReady(document)).toBe(true);
});

it('hands tap feedback over to the native preloader immediately without a PDF render flag', () => {
  vi.useFakeTimers();
  showViewerLoading();
  expect(isViewerLoading()).toBe(true);
  const native = document.createElement('div');
  native.className = 'flipbook-preloader';
  vi.spyOn(native, 'getClientRects').mockReturnValue([{ width: 360 }] as unknown as DOMRectList);
  document.body.append(native);
  hideViewerLoadingWhenReady();
  expect(isViewerLoading()).toBe(false);
});

it('retains feedback until the native loader actually appears', () => {
  vi.useFakeTimers();
  showViewerLoading();
  hideViewerLoadingWhenReady();
  vi.advanceTimersByTime(100);
  expect(isViewerLoading()).toBe(true);
  const native = document.createElement('div');
  native.className = 'flipbook-preloader';
  vi.spyOn(native, 'getClientRects').mockReturnValue([{ width: 360 }] as unknown as DOMRectList);
  document.body.append(native);
  vi.advanceTimersByTime(16);
  expect(isViewerLoading()).toBe(false);
});