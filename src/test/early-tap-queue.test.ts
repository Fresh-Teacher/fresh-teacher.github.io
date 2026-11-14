import { describe, expect, it, vi } from 'vitest';
import { installEarlyTapQueue } from '@/lib/early-tap-queue';

const markReady = (el: Element, onClick: () => void) => {
  (el as unknown as Record<string, unknown>)['__reactProps$test'] = {};
  el.addEventListener('click', onClick);
};

describe('early tap queue', () => {
  it('repeats one tap made before a menu button is ready, exactly once', () => {
    vi.useFakeTimers();
    installEarlyTapQueue();
    document.body.innerHTML = '<button data-toggle="dropdown">LESSON NOTES</button>';
    const button = document.querySelector('button')!;
    button.click();
    button.click();
    button.click();
    const opened = vi.fn();
    markReady(button, opened);
    vi.advanceTimersByTime(200);
    expect(opened).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('only repeats the latest tap when switching menus early', () => {
    vi.useFakeTimers();
    installEarlyTapQueue();
    document.body.innerHTML = '<button data-toggle="dropdown">A</button><button data-toggle="dropdown">B</button>';
    const [first, second] = Array.from(document.querySelectorAll('button')) as [HTMLButtonElement, HTMLButtonElement];
    first.click();
    second.click();
    const a = vi.fn(); const b = vi.fn();
    markReady(first, a); markReady(second, b);
    vi.advanceTimersByTime(200);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('never intercepts real links', () => {
    installEarlyTapQueue();
    document.body.innerHTML = '<a href="/p6.html">Go</a>';
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    document.querySelector('a')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('early door', () => {
  it('opens the door and unlocks the shelves on a tap made before the page is ready', () => {
    vi.useFakeTimers();
    installEarlyTapQueue();
    document.body.innerHTML = '<div class="leftcurtain" role="button"></div><div class="page-wrapper" inert></div>';
    document.querySelector<HTMLElement>('.leftcurtain')!.click();
    expect(document.documentElement.hasAttribute('data-early-door')).toBe(true);
    expect(document.querySelector('.page-wrapper')!.hasAttribute('inert')).toBe(false);
    vi.advanceTimersByTime(21000);
    document.documentElement.removeAttribute('data-early-door');
    vi.useRealTimers();
  });
});

describe('early door sound', () => {
  it('starts the door sound inside the tap, before the page is ready', () => {
    vi.useFakeTimers();
    installEarlyTapQueue();
    document.body.innerHTML = '<audio id="audiocracker"></audio><div class="rope" role="button"></div>';
    const audio = document.getElementById('audiocracker') as HTMLAudioElement;
    const play = vi.fn(() => Promise.resolve());
    audio.play = play;
    document.documentElement.removeAttribute('data-early-door');
    document.querySelector<HTMLElement>('.rope')!.click();
    expect(play).toHaveBeenCalledTimes(1);
    expect(audio.hasAttribute('data-early-played')).toBe(true);
    vi.advanceTimersByTime(21000);
    document.documentElement.removeAttribute('data-early-door');
    vi.useRealTimers();
  });
});

describe('early dropdown display', () => {
  it('shows the tapped dropdown list immediately before the page is ready', () => {
    installEarlyTapQueue();
    document.body.innerHTML = '<div class="btn-group"><button data-toggle="dropdown">PAST PAPERS</button><ul class="dropdown-menu" hidden></ul></div>';
    document.querySelector('button')!.click();
    expect(document.querySelector('.btn-group')!.hasAttribute('data-early-open')).toBe(true);
    expect((document.querySelector('.dropdown-menu') as HTMLElement).style.display).toBe('block');
  });

  it('a second early tap on the same button closes it and cancels the replay', () => {
    vi.useFakeTimers();
    installEarlyTapQueue();
    document.body.innerHTML = '<div class="btn-group"><button data-toggle="dropdown">X</button><ul class="dropdown-menu" hidden></ul></div>';
    const button = document.querySelector('button')!;
    button.click(); button.click();
    const opened = vi.fn(); markReady(button, opened);
    vi.advanceTimersByTime(200);
    expect(opened).not.toHaveBeenCalled();
    expect((document.querySelector('.dropdown-menu') as HTMLElement).style.display).toBe('');
    vi.useRealTimers();
  });
});
