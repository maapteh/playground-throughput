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
    setHeaders: function (res, path, stat) {
        if (res.statusCode === 404) {
            res.statusCode(404).send();
            return;
        }
    }
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
    res.status(200).send(html);
});

app.get('/error', function (req, res) {
    res.status(404).send(errorHtml)
});

app.get('/none', function (req, res) {
    res.status(501).send('No known entry...')
});


const cluster = require('cluster');
if (cluster.isMaster) { 
    const numWorkers = require('os').cpus().length;
    console.log(`Master cluster setting up ${numWorkers} workers...`); 
    for(var i = 0; i < numWorkers; i++) { 
        cluster.fork();
    }
    cluster.on('online', (worker) => { 
        console.log(`Worker ${worker.process.pid}`);
    });
    cluster.on('exit', (worker, code, signal) => {

        console.log(`Worker ${worker.process.pid} died ${code}, ${signal}. Starting up new one`);
        cluster.fork();
    });
} else { 
    console.log(`Process ${process.pid} is listening to all incoming requests`);

    app.listen({ port }, () => {
        console.log(
            `🚀 application up at http://localhost:${port}\n`,
            `Rate limitter is ${toggleRateLimit === on ? `on with ${rateLimit} tps` : 'off'}\n`,
            `Caching is ${toggleCaching === on ? 'on' : 'off'}\n`,
        );
    });
}