# playwright-healer 0.2.1 fixed package

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
