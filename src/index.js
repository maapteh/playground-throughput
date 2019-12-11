const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

const port = process.env.PORT || 3000;

const memcacheMiddleware = require('./middleware/mem-cache/index');
const ratelimitMiddleware = require('./middleware/rate-limit/index');

// mock two pages
const html = require('./constants/sample-html');
const errorHtml = require('./constants/error-html');

const on = 'on';
const rateLimit = process.env.RATELIMIT ? parseInt(process.env.RATELIMIT, 10) : 34;
const toggleRateLimit = process.env.TOGGLE_RATELIMIT || 'off';
const toggleCaching = process.env.TOGGLE_CACHING || 'off';

// leave no paper trail
app.disable('x-powered-by');

// first our static assets, so not passing middleware!
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
    dotfiles: 'ignore',
    etag: false,
    index: false,
    maxAge: '1y',
    redirect: false,
    immutable: true,
    // thank me later, else non existing assets will go through your next route handler when you use wildcards
    fallthrough: false, 
}));

app.use(cookieParser());

// FAILSAVE, DISABLE WHEN STRESS TESTING FOR MAX HEALTHY LOAD!
if (toggleRateLimit === on) {
    app.use(ratelimitMiddleware(rateLimit));
}
if (toggleCaching === on) {
    app.use(memcacheMiddleware(600)); // ten minutes
}


/**
 * OUR MAIN ROUTES
 */
app.get('/', function (req, res) {
    res.send(html);
});

app.get('/error', function (req, res) {
    res.status(404).send(errorHtml)
});

app.get('/none', function (req, res) {
    res.status(501).send('No known entry...')
});

app.listen({ port }, () => {
    console.log(
        `🚀 application up at http://localhost:${port}\n`,
        `Rate limitter is ${toggleRateLimit === on ? `on with ${rateLimit} tps` : 'off'}\n`,
        `Caching is ${toggleCaching === on ? 'on' : 'off'}\n`,
        );
});
