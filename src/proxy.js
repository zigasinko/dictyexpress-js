/* eslint-disable */

const args = process.argv.slice(2);
const appName = args[0] || 'QA2 proxied server';
const appUrl = args[1] || 'https://qa2.genialis.com';
const myLocalhost = args[2] || 'localhost';
const myPort = args[3] || 8001;
const notSpdy = args[4] || true;
const distMode = args[5] || false;
const websocketUrl = `${appUrl.replace('https://', 'wss://').replace('http://', 'ws://')}/ws/`;
const myUrl = `${appUrl.match(/(https?:\/\/)/)[1] + myLocalhost}:${myPort}`;
const appsConfCode = `
    window.GENJS_CONFIG = {
        REST_URL: '${myUrl}',
        WEBSOCKET_URL: '${websocketUrl}',
        TITLE: '${appName}',
    };
`;
console.log({ appName, appUrl, myLocalhost, myPort, notSpdy, distMode, websocketUrl, myUrl });
console.log(appsConfCode);
const bs = require('browser-sync').create();

bs.init(
    ifDistMode({
        [notSpdy ? '' : 'httpModule']: 'spdy',
        proxy: {
            target: appUrl,
            reqHeaders: {
                Referer: appUrl,
                // 'Origin': appUrl,
            },
            proxyRes: [
                (proxyRes, req, res) => {
                    delete proxyRes.headers['content-security-policy'];
                    proxyRes.headers['content-security-policy'] = 'upgrade-insecure-requests;';
                },
            ],
        },
        serveStatic: ['.', '../../', '../../genjs/'],
        serveStaticOptions: {
            index: 'index.html',
        },
        rewriteRules: [
            {
                match: /\<script src="app\-[0-9a-zA-Z]+\.js"\>\<\/script\>/g,
                replace: `
            <script src="jspm_packages/system.src.js"></script>
            <script src="jspm.conf.js"></script>
            <script>
                System.import('genjs/views/base/index').catch(function (error) {
                    console.error("Error while importing GenJs modules", error);
                });
            </script>
        `,
            },
            {
                match: /\<script src="\/apps\.conf\.js"\>\<\/script\>/g,
                replace: `
            <script>${appsConfCode}</script>
        `,
            },
            {
                match: /<ui-view name="application" class="application gen-loading-container" layout="column" layout-fill>/g,
                replace: `
            <gen-login-required-detector></gen-login-required-detector>
​
            <ui-view name="application" class="application gen-loading-container" layout="column" layout-fill>
        `,
            },
        ],
        port: myPort,
        open: false,
        ghostMode: false,
        notify: false,
        ui: false,
    }),
);
function ifDistMode(opts) {
    if (!distMode) return opts;
    const fs = require('fs');
    console.log(`
        dist mode
        It serves from dist folder.
    `);
    opts.serveStatic = ['../../dist/'];
    opts.rewriteRules[0].replace = fs // take <script src="app-????"> from dist/index.html
        .readFileSync('../../dist/index.html', 'utf-8')
        .match(opts.rewriteRules[0].match)[0];
    return opts;
}
bs.emitter.on('init', () => {
    setTimeout(() => {
        console.log(`
            Open: ${myUrl} and confirm unsafe certificate. Then ${myUrl} will work correctly.
            It serves from .build folder, so keep your "gulp serve" active.
        `);
    }, 10);
});
