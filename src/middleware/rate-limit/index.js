/**
 * middleware for ratelimiting our application
 * 
 * @example for 20 rps
 * app.use(ratelimitMiddleware(20));
 */

module.exports = function (limit) {

    const RateLimiter = require('limiter').RateLimiter;
    const limiter = new RateLimiter(limit, 'second', true);
    const isMember = require('../../helper/is-member');

    return (req, res, next) => {

        // if not a user go directly to our cache middleware
        if (!isMember(req)) {
            next();
            return;
        }

        // else give VIP to the first "limit" ones per second
        if (limiter.tryRemoveTokens(1)) {
            next();
        } else {
            res.locals.ratelimited = true;
            next();
        }

    }
}

