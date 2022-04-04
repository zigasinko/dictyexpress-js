import { test as baseTest } from '@playwright/test';
import { fixtures, TestingLibraryFixtures } from '@playwright-testing-library/test/fixture';

const test = baseTest.extend<TestingLibraryFixtures>(fixtures);
const { expect } = test;

enum Selectors {
    expressionsGraph = '[data-testid=genes-expressions-line-chart] svg',
    option = '.MuiAutocomplete-popper [role="option"]',
    genesInputLabel = 'Search for a gene',
}

test.describe('Expression time courses', () => {
    test.beforeEach(
        async ({
            browser,
            context,
            page,
            queries: { getByLabelText, getByRole, queryAllByRole },
        }) => {
            // Create a new context with the saved localStorageDatastate
            await context.grantPermissions(['clipboard-read', 'clipboard-write']);
            if (process.env.DICTY_STORAGE) {
                const storageState = JSON.parse(process.env.DICTY_STORAGE);
                context = await browser.newContext({ storageState });
            } else {
                await page.goto('http://localhost:3000');
                await (await queryAllByRole('button', { name: 'Run dictyExpress' }))[0].click();
                await (await getByRole('button', { name: 'Login' })).click();
                await (
                    await getByLabelText('E-mail *')
                ).fill(process.env.LOGIN_EMAIL ?? 'not-provided');
                await (
                    await getByLabelText('Password *')
                ).fill(process.env.LOGIN_PASSWORD ?? 'not-provided');
                await (await getByRole('button', { name: 'SIGN IN' })).click();
                await page.waitForResponse(
                    (response: { url: () => string | string[] }) => {
                        return response.url().includes('/relation?category=Time+series');
                    },
                    { timeout: 30000 },
                );

                const localStorageData = await context.storageState();
                process.env.DICTY_STORAGE = JSON.stringify(localStorageData);
            }
        },
    );

    test('should draw Expression Time Courses graph', async ({
        page,
        queries: { getByRole, getByPlaceholderText },
    }) => {
        const genes = 'eif3L fnkF_ps';

        await (await getByRole('gridcell', { name: '307' })).click();

        await page.waitForResponse((response: { url: () => string | string[] }) => {
            return response.url().includes('/api/storage');
        });

        await (await getByPlaceholderText(Selectors.genesInputLabel)).fill('a');
        await page.click(Selectors.option);

        await (await getByPlaceholderText(Selectors.genesInputLabel)).fill('');

        // Playwright cross browser support for ClipboardEvent:paste isn't implemented yet therefore manual implementation
        await page.evaluate(async (text: string) => {
            await navigator.clipboard.writeText(text);
            const clipText = await navigator.clipboard.readText();
            const el = document.querySelector('[data-testid="genes-multiselect-input"] input');
            if (el) {
                // for windows
                (el as HTMLInputElement).value = clipText;
                // for macos
                const pasteEvent = Object.assign(
                    new Event('paste', { bubbles: true, cancelable: true }),
                    {
                        clipboardData: {
                            getData: () => text,
                        },
                    },
                );
                el.dispatchEvent(pasteEvent);
            }
        }, genes);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.$eval('header', (el: { remove: () => any }) => el.remove());

        await page.waitForSelector(Selectors.expressionsGraph);

        const graphPoints = page.locator("g[role='graphics-symbol'].genesExpressionsPoints");
        const graphLines = page.locator("g[role='graphics-symbol'].genesExpressionsLines");
        await expect(graphPoints).toHaveCount(1);
        await expect(graphLines).toHaveCount(1);
    });
});
