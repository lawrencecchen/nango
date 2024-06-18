var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import db from '@nangohq/database';
import { convertJsonKeysToCamelCase, convertJsonKeysToSnakeCase } from '../utils/utils.js';
class OAuthSessionService {
    create(oAuthSession) {
        return __awaiter(this, void 0, void 0, function* () {
            const authSession = convertJsonKeysToSnakeCase(oAuthSession);
            yield this.queryBuilder().insert(Object.assign({}, authSession));
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.queryBuilder().where({ id }).first();
            return convertJsonKeysToCamelCase(session);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.findById(id);
            if (!session) {
                return;
            }
            yield this.queryBuilder().where({ id }).delete();
        });
    }
    /**
     * This will clear the sessions that have been created for more than 24hrs,
     * it's possible that some sessions are created but at the end the callback url
     * was not called hence the sessions still remains.
     * We will use the method to clean such for now its cleans in the last 24hrs
     */
    clearStaleSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTime = new Date().getTime();
            const time24HoursAgo = new Date(currentTime - 24 * 60 * 60 * 1000);
            return this.queryBuilder().where('created_at', '<', time24HoursAgo).delete();
        });
    }
    queryBuilder() {
        return db.knex.select('*').from('_nango_oauth_sessions');
    }
}
export default new OAuthSessionService();
//# sourceMappingURL=oauth-session.service.js.map