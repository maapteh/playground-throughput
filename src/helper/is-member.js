module.exports = function (req) {
    return req.cookies['token'] || req.cookies['jsessionId'] || false;
} 