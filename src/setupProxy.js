// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createProxyMiddleware } = require('http-proxy-middleware');

const targetDomain = 'qa.genialis.io';
const logLevel = 'debug';

const proxyConfig = {
    target: `https://${targetDomain}`,
    secure: false,
    clientLogLevel: logLevel,
    logLevel,
    changeOrigin: true,
    headers: {
        Host: targetDomain,
        Origin: `https://${targetDomain}`,
        Connection: 'keep-alive',
    },
};

const wsProxyConfig = {
    target: 'wss://ws.qa.genialis.io',
    clientLogLevel: logLevel,
    ws: true,
    headers: {
        Host: 'ws.qa.genialis.io',
    },
    secure: false,
    pathRewrite: {
        '^/ws-proxy': '/ws/v2',
    },
};

// eslint-disable-next-line no-undef
module.exports = (app) => {
    app.use(createProxyMiddleware('/api', proxyConfig));
    app.use(createProxyMiddleware('/saml-auth', proxyConfig));
    app.use(createProxyMiddleware('/ws-proxy', wsProxyConfig));
};
