import 'playwright-testing-library/extend';

enum Selectors {
    expressionsGraph = '[data-testid=genes-expressions-line-chart] svg',
    option = '.MuiAutocomplete-popper [role="option"]',
    genesInputLabel = 'Search for a gene',
}

describe('Expression time courses', () => {
    beforeEach(async () => {
        // Create a new context with the saved localStorageDatastate
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        if (process.env.DICTY_STORAGE) {
            const storageState = JSON.parse(process.env.DICTY_STORAGE);
            context = await browser.newContext({ storageState });
        } else {
            await page.goto(global.baseURL);
            // @ts-ignore
            const document = await page.getDocument();
            await (
                await document.queryAllByRole('button', { name: 'Run dictyExpress' })
            )[0].click();
            await (await document.getByRole('button', { name: 'Login' })).click();
            await (await document.getByLabelText('Username')).fill(process.env.LOGIN_USERNAME);
            await (await document.getByLabelText('Password')).fill(process.env.LOGIN_PASSWORD);
            await (await document.getByRole('button', { name: 'SIGN IN' })).click();
            await page.waitForResponse((response: { url: () => string | string[] }) => {
                return response.url().includes('/relation?category=Time+series');
            });

            const localStorageData = await context.storageState();
            process.env.DICTY_STORAGE = JSON.stringify(localStorageData);
        }
    });

    it('should draw Expression Time Courses graph', async () => {
        const genes = 'eif3L fnkF_ps';
        await page.goto(`${global.baseURL}/bcm`);
        // @ts-ignore
        const document = await page.getDocument();
        await new Promise((resolve) => setTimeout(resolve, 500));
        await (await document.getByRole('gridcell', { name: '307' })).click();
        await (await document.getByPlaceholderText(Selectors.genesInputLabel)).fill('a');
        await page.click(Selectors.option);

        await page.waitForResponse((response: { url: () => string | string[] }) => {
            return response.url().includes('/api/storage');
        });

        await (await document.getByPlaceholderText(Selectors.genesInputLabel)).fill('');

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

        await page.$eval('header', (el: { remove: () => any }) => el.remove());
        const elementHandle = await page.waitForSelector(Selectors.expressionsGraph);
        const graphImg = await elementHandle.screenshot();
        expect(graphImg).toMatchImageSnapshot({
            capture: 'viewport',
            scale: false,
            // threshold for entire image
            failureThreshold: 0.05,
            // percent of image or number of pixels
            failureThresholdType: 'percent',
            // threshold for each pixel
            customDiffConfig: { threshold: 0.1 },
            // should ignore small pixel rectangle differences on different platforms
            allowSizeMismatch: true,
        });
    });
});
