import type { PlaywrightHealer } from './healer.js';

let activeHealer: PlaywrightHealer | undefined;

export function registerHealer(healer: PlaywrightHealer): void {
  activeHealer = healer;
}

export function getRegisteredHealer(): PlaywrightHealer {
  if (!activeHealer) {
    throw new Error(
      '[PLAYWRIGHT HEALER] No healer instance has been registered. ' +
        'Call createHealer(...) before the Playwright run.'
    );
  }

  return activeHealer;
}

export function clearRegisteredHealer(): void {
  activeHealer = undefined;
}

export function hasRegisteredHealer(): boolean {
  return activeHealer !== undefined;
}