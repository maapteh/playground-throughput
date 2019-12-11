/**
 * middleware for caching on our own node
 * 
 * @example for one year:
 * app.use(memcacheMiddleware(86400));
 *
 */

const cache = require('memory-cache');
let memCache = new cache.Cache();

// TODO: instead of mem-cache use centralised mongo-db
module.exports = function (duration) {

    const errorPage = require('../../constants/error-html');
    const urls = require('../../constants/urls');
    const cacheKeyHeader = require('../../constants/cache-key-header');
    const isMember = require('../../helper/is-member');

    return (req, res, next) => {

        const url = req.originalUrl || req.url;
        const member = isMember(req);

        let key = `__mpth__${url}`;
        let cacheContent = memCache.get(key);

        // Not known url's will not pass
        if (!urls.includes(url) && !res.locals.ratelimited) {
            res.status(404).send(errorPage);
            return;
        }

        // do not try to resolve from cache when rate is still good and user is not anonymous
        if (!res.locals.ratelimited && member) {
            next();
            return;
        }

        // when our rate limit boundary is reached try to resolve the rest by cache
        if (res.locals.ratelimited) {
            if (cacheContent) {
                res.setHeader(cacheKeyHeader, 'HIT');
                // FIXME: 201 is used for our load test overview to see what is served from cache
                res.status(201).send(cacheContent);
                return;
            } else {
                // when we dont have the request in cache stop the flow immediately for that request
                res.status(500).send(errorPage);
                return;
            }
        }

        // we serve all our anonymous with cached version
        if (!member && cacheContent) {
            res.setHeader(cacheKeyHeader, 'HIT');
            // FIXME: 201 is used for our load test overview to see what is served from cache
            res.status(201).send(cacheContent);
            return;
        }

        // store known url when not in cache
        if (!cacheContent) {
            res.sendResponse = res.send;

            res.send = (body) => {
                // only store html when we have a succesCode
                if (res.statusCode === 200) {
                    memCache.put(key, body, duration * 1000);
                } 

                res.sendResponse(body);
            }
        }

        next();
    }
}