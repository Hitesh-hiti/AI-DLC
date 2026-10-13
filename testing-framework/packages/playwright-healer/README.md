# playwright-healer 0.2.3 — runtime healing, persistent cache, retry and reporting

This package fixes the baseline lookup path used when a locator is intentionally
broken, for example:

    getByTestId("input-origin-broken")

If the historical baseline contains:

    getByTestId("input-origin")

the healer now:

1. tries the exact baseline key;
2. loads all historical baselines if exact lookup misses;
3. extracts and normalizes the broken test id;
4. matches the historical fingerprint test id;
5. prefers the baseline from the same URL;
6. generates candidates from the historical fingerprint;
7. validates the candidates against the live DOM;
8. invokes the selected replacement at runtime.

The package also includes debug logging and an `exports` entry so the package
can be resolved as `playwright-healer`.

## Build

From this package directory:

    npm install
    npm run build

## Important

The application must actually use this built package. If the application has a
copied/linked `node_modules/playwright-healer`, rebuild or reinstall that copy;
changing `packages/playwright-healer/src` alone does not change the already
installed `node_modules/playwright-healer/dist`.

Useful verification:

    node -e "console.log(require.resolve('playwright-healer'))"

The output should point at this package's `dist/index.js`.

At runtime, the important debug messages are:

    [HEALER DEBUG] exact baseline lookup
    [HEALER DEBUG] exact baseline NOT FOUND
    [HEALER DEBUG] historical baseline scan
    [HEALER DEBUG] testId matches
    [HEALER DEBUG] testId baseline SELECTED
    [HEALER DEBUG] generating candidates
    [HEALER DEBUG] candidates generated
    [HEALER DEBUG] HEALED


## Self-updating Page Objects and index-aware healing

A successful runtime heal can update the Page Object/source locator immediately after the healed action succeeds. This is enabled by default:

```ts
createHealer({
  updateSourceOnHeal: true,
  replaceLocator: true,
});
```

The source update is atomic and supports chained locators such as `getByTestId(...).nth(2)`. The framework also persists the successful replacement as a new baseline after the action succeeds.

Healing supports mutated `data-testid` values by comparing the failed locator's historical test ID with live test IDs using fuzzy similarity plus DOM fingerprint signals. For repeated elements, the historical `nth()`/`first()` index is retained and used to prioritize the same occurrence.

Set `updateSourceOnHeal: false` to keep source files unchanged while retaining runtime healing.


## 0.2.3 state model

This version keeps the historical baseline store and adds a separate persistent
healing cache. A mapping is written to the healing cache only after the healed
locator has successfully retried the failed action.

The runtime flow is:

1. Original action fails.
2. Historical baseline is loaded, including testId fallback.
3. Candidates are generated and validated against the live DOM.
4. Equivalent selectors that resolve to the same DOM element are deduplicated
   before ambiguity is calculated.
5. The selected locator is rebound to the active locator proxy.
6. The exact failed action is retried against the replacement locator.
7. Only after that retry succeeds are the baseline aliases, healing cache and
   optional source rewrite persisted.
8. The successful heal and retry are written to the shared event stream.

### Persistent state

- `.healer/baselines/` — historical fingerprints and baseline locators.
- `.healer/cache/` — proven original-locator → replacement-locator mappings.
- `test-results/healer/healing-events.jsonl` — events from all Playwright
  worker processes.
- `test-results/healer/healing-report.html` — final aggregated report.

The cache is validated against the live DOM before it is used. A stale cached
replacement is discarded and the normal baseline/candidate healing path runs.

### Multiple elements

When the original locator includes `.nth(1)`, the second matching element is
retained as the preferred target. `nth()` is zero-based in Playwright. If a
replacement selector has multiple matches, the healer generates index-aware
candidates rather than silently selecting an arbitrary element.
