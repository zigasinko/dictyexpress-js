// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const proxyConfig = require('./setupProxy');

const app = express();

const options = {
    root: './',
};

proxyConfig(app);
app.use(express.static('build'));
app.get('/*', (_req, res) => {
    res.sendFile('./build/index.html', options, (err) => {
        if (err) {
            res.status(500).send(err);
        }
    });
});

app.listen('PORT' in process.env ? Number(process.env.PORT) : 3000);
