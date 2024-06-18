var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createClient } from 'redis';
import { RateLimiterRes, RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { getRedisUrl } from '@nangohq/shared';
import { getLogger } from '@nangohq/utils';
const logger = getLogger('RateLimiter');
const rateLimiter = await (() => __awaiter(void 0, void 0, void 0, function* () {
    const opts = {
        keyPrefix: 'middleware',
        points: parseInt(process.env['DEFAULT_RATE_LIMIT_PER_MIN'] || '0') || 2400,
        duration: 60,
        blockDuration: 0
    };
    const url = getRedisUrl();
    if (url) {
        const redisClient = yield createClient({ url: url, disableOfflineQueue: true }).connect();
        redisClient.on('error', (err) => {
            logger.error(`Redis (rate-limiter) error: ${err}`);
        });
        return new RateLimiterRedis(Object.assign({ storeClient: redisClient }, opts));
    }
    return new RateLimiterMemory(opts);
}))();
export const rateLimiterMiddleware = (req, res, next) => {
    const setXRateLimitHeaders = (rateLimiterRes) => {
        const resetEpoch = Math.floor(new Date(Date.now() + rateLimiterRes.msBeforeNext).getTime() / 1000);
        res.setHeader('X-RateLimit-Limit', rateLimiter.points);
        res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
        res.setHeader('X-RateLimit-Reset', resetEpoch);
    };
    const key = getKey(req, res);
    const pointsToConsume = getPointsToConsume(req);
    rateLimiter
        .consume(key, pointsToConsume)
        .then((rateLimiterRes) => {
        setXRateLimitHeaders(rateLimiterRes);
        next();
    })
        .catch((rateLimiterRes) => {
        if (rateLimiterRes instanceof RateLimiterRes) {
            res.setHeader('Retry-After', Math.floor(rateLimiterRes.msBeforeNext / 1000));
            setXRateLimitHeaders(rateLimiterRes);
            logger.info(`Rate limit exceeded for ${key}. Request: ${req.method} ${req.path})`);
            res.status(429).send({ error: { code: 'too_many_request' } });
            return;
        }
        res.status(500).send({ error: { code: 'server_error' } });
    });
};
function getKey(req, res) {
    if ('account' in res.locals) {
        return `account-${res.locals['account'].id}`;
    }
    else if (req.user) {
        return `user-${req.user.id}`;
    }
    return `ip-${req.ip}`;
}
function getPointsToConsume(req) {
    const paths = ['/api/v1/account'];
    if (paths.some((path) => req.path.startsWith(path))) {
        // limiting to 6 requests per period to avoid brute force attacks
        return rateLimiter.points / 6;
    }
    return 1;
}
//# sourceMappingURL=ratelimit.middleware.js.map