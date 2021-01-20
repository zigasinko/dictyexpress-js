// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createProxyMiddleware } = require('http-proxy-middleware');

const TargetUrl = 'https://qa2.genialis.com';
const LogLevel = 'trace';
const secure = false;
const headers = {
    Referrer: TargetUrl,
};

const proxyConfig = {
    target: TargetUrl,
    changeOrigin: true,
    secure,
    clientLogLevel: LogLevel,
    headers,
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
module.exports = (app) => {
    app.use('/api', createProxyMiddleware(proxyConfig));
    app.use('/rest-auth', createProxyMiddleware(proxyConfig));
};
