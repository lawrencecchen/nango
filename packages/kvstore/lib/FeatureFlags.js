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
const logger = getLogger('FeatureFlags');
export class FeatureFlags {
    constructor(kvstore) {
        if (!kvstore) {
            logger.error('Feature flags not enabled');
        }
        this.kvstore = kvstore;
    }
    isEnabled({ key, distinctId, fallback, isExcludingFlag = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.kvstore) {
                return fallback;
            }
            try {
                const exists = yield this.kvstore.exists(`flag:${key}:${distinctId}`);
                return isExcludingFlag ? !exists : exists;
            }
            catch (_a) {
                return fallback;
            }
        });
    }
}
//# sourceMappingURL=FeatureFlags.js.map