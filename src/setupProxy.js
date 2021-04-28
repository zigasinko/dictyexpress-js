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

const wsProxyConfig = {
    target: 'wss://qa2.genialis.com',
    clientLogLevel: logLevel,
    ws: true,
    headers: {
        Host: 'qa2.genialis.com',
    },
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = (app) => {
    app.use(createProxyMiddleware('/api', proxyConfig));
    app.use(createProxyMiddleware('/rest-auth', proxyConfig));
    app.use(createProxyMiddleware('/ws', wsProxyConfig));
};
