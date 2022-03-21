// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createProxyMiddleware } = require('http-proxy-middleware');

const targetDomain = 'qa2.genialis.com';
const logLevel = 'debug';

const proxyConfig = {
    target: `https://${targetDomain}`,
    secure: false,
    clientLogLevel: logLevel,
    logLevel,
    changeOrigin: true,
    headers: {
        Host: targetDomain,
        Origin: targetDomain,
        Connection: 'keep-alive',
    },
};

const wsProxyConfig = {
    target: `wss://${targetDomain}`,
    clientLogLevel: logLevel,
    ws: true,
    headers: {
        Host: targetDomain,
    },
    pathRewrite: {
        '^/ws-proxy': '/ws',
    },
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = (app) => {
    app.use(createProxyMiddleware('/api', proxyConfig));
    app.use(createProxyMiddleware('/rest-auth', proxyConfig));
    app.use(createProxyMiddleware('/ws-proxy', wsProxyConfig));
};
