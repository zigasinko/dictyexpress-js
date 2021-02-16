// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const proxyConfig = require('./setupProxy');

const app = express();

const options = {
    root: './',
};

proxyConfig(app);
app.use(express.static('build'));
app.get('/*', function (req, res) {
    res.sendFile('./build/index.html', options, function (err) {
        if (err) {
            res.status(500).send(err);
        }
    });
});

app.listen('PORT' in process.env ? Number(process.env.PORT) : 3000);
