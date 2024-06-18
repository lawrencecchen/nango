var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getLogger } from '@nangohq/utils';
import { RedisKVStore } from './kvstore/RedisStore.js';
import { getRedisUrl } from './utils.js';
const logger = getLogger('FeatureFlags');
class FeatureFlags {
    constructor(redis) {
        try {
            this.redis = redis;
        }
        catch (_a) {
            logger.error('Feature flags not enabled');
        }
    }
    isEnabled(key, distinctId, fallback, isExcludingFlag = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redis) {
                return fallback;
            }
            return this.redis.exists(`flag:${key}:${distinctId}`).then((r) => {
                return isExcludingFlag ? !r : r;
            }, (_) => {
                return fallback;
            });
        });
    }
}
const redis = await (() => __awaiter(void 0, void 0, void 0, function* () {
    let redis;
    const url = getRedisUrl();
    if (url) {
        redis = new RedisKVStore(url);
        yield redis.connect();
    }
    return redis;
}))();
export default new FeatureFlags(redis);
//# sourceMappingURL=featureflags.js.map