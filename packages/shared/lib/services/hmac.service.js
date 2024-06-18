var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as crypto from 'node:crypto';
import { schema } from '@nangohq/database';
class HmacService {
    constructor() {
        this.algorithm = 'sha256';
    }
    isEnabled(id) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield schema().select('hmac_enabled').from('_nango_environments').where({ id });
            const enabled = (_b = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.hmac_enabled) !== null && _b !== void 0 ? _b : false;
            return enabled;
        });
    }
    getKey(id) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield schema().select('hmac_key').from('_nango_environments').where({ id });
            const key = (_b = (_a = result[0]) === null || _a === void 0 ? void 0 : _a.hmac_key) !== null && _b !== void 0 ? _b : '';
            return key;
        });
    }
    verify(expectedDigest, id, ...values) {
        return __awaiter(this, void 0, void 0, function* () {
            const actualDigest = yield this.digest(id, ...values);
            return expectedDigest === actualDigest;
        });
    }
    digest(id, ...values) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = yield this.getKey(id);
            const hmac = crypto.createHmac(this.algorithm, key);
            const data = values.join(':');
            hmac.update(data);
            return hmac.digest('hex');
        });
    }
}
export default new HmacService();
//# sourceMappingURL=hmac.service.js.map