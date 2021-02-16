// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createProxyMiddleware } = require('http-proxy-middleware');

const targetUrl = 'https://qa2.genialis.com';
const logLevel = 'debug';
const secure = false;
const headers = {
    Referrer: targetUrl,
};

const proxyConfig = {
    target: targetUrl,
    changeOrigin: false,
    secure,
    clientLogLevel: logLevel,
    headers,
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = (app) => {
    app.use('/api', createProxyMiddleware(proxyConfig));
    app.use('/rest-auth', createProxyMiddleware(proxyConfig));
};
