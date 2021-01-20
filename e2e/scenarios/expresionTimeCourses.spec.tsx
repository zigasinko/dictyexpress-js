import { jest } from '@jest/globals';

jest.setTimeout(300e3);

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
enum selectors {
    expressionsGraph = '[data-testid=genes-expressions-line-chart] canvas',
    timeSeries1Row = '[data-testid="time-series-and-gene-selection-box"] [role="rowgroup"] [row-id="307"]',
    option = '.MuiAutocomplete-popper [role="option"]',
    genesInput = '[data-testid="genes-multiselect-input"] input',
}

describe('Expression time courses', () => {
    it('should draw Expression Time Courses graph', async () => {
        const genes = 'aplA, eif3L, fnkF_ps';

        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('http://localhost:3000');
        await page.click('[data-testid=enter-app]');
        await page.click('[data-testid=open-login-modal]');
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        await page.fill('[data-testid=username] input', process.env.LOGIN_USERNAME);
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        await page.fill('[data-testid=password] input', process.env.LOGIN_PASSWORD);
        await page.click('[data-testid=submit-credentials]');
        await page.waitForResponse((response: { url: () => string | string[] }) => {
            return response.url().includes('/relation?category=Time+series');
        });

        await page.click(selectors.timeSeries1Row);
        await page.fill(selectors.genesInput, 'a');
        await page.click(selectors.option);

        await page.waitForResponse((response: { url: () => string | string[] }) => {
            return response.url().includes('/api/storage');
        });
        await page.fill(selectors.genesInput, '');

        // Playwright cross browser support for ClipboardEvent:paste isn't implemented yet therefore manual implementation
        await page.evaluate(async (text) => {
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
        const elementHandle = await page.waitForSelector(selectors.expressionsGraph);
        const graphImg = await elementHandle.screenshot({ timeout: 4000 });
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
