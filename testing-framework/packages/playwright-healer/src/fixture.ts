import type {
  Page,
  TestInfo,
} from '@playwright/test';

import type {
  PlaywrightHealer,
} from './healer.js';

export function extendWithHealer(
  healer: PlaywrightHealer
): any {
  return {
    page: async (
      {
        page,
      }: {
        page: Page;
      },
      use: (
        page: Page
      ) => Promise<void>,
      testInfo: TestInfo
    ) => {
      await use(
        healer.wrapPage(
          page,
          testInfo
        )
      );
    },
  };
}