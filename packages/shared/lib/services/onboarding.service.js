var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import db, { dbNamespace } from '@nangohq/database';
import configService from './config.service.js';
export const DEFAULT_GITHUB_CLIENT_ID = process.env['DEFAULT_GITHUB_CLIENT_ID'] || '';
export const DEFAULT_GITHUB_CLIENT_SECRET = process.env['DEFAULT_GITHUB_CLIENT_SECRET'] || '';
export const DEMO_GITHUB_CONFIG_KEY = 'github-demo';
export const DEMO_SYNC_NAME = 'issues-demo';
export const DEMO_ACTION_NAME = 'create-demo-issue';
export const DEMO_MODEL = 'GithubIssueDemo';
const TABLE = `${dbNamespace}onboarding_demo_progress`;
export const getOnboardingId = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db.knex.from(TABLE).select('id').where({ user_id }).first();
    return result ? result.id : null;
});
export const initOnboarding = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const onboardingId = yield getOnboardingId(user_id);
    if (onboardingId) {
        return onboardingId;
    }
    const result = yield db.knex
        .from(TABLE)
        .insert({
        user_id,
        progress: 0,
        complete: false
    })
        .returning('id');
    if (!result || result.length == 0 || !result[0]) {
        return null;
    }
    return result[0].id;
});
export const updateOnboardingProgress = (id, progress) => __awaiter(void 0, void 0, void 0, function* () {
    const q = db.knex.from(TABLE).update({ progress }).where({ id });
    if (progress >= 5) {
        void q.update('complete', true);
    }
    yield q;
});
export const getOnboardingProgress = (user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield db.knex
        .from(TABLE)
        .select('progress', 'id', 'complete')
        .where({ user_id })
        .first();
    return result;
});
/**
 * Create Default Provider Config
 * @desc create a default Github config only for the dev environment
 */
export function createOnboardingProvider({ envId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = {
            environment_id: envId,
            unique_key: DEMO_GITHUB_CONFIG_KEY,
            provider: 'github',
            oauth_client_id: DEFAULT_GITHUB_CLIENT_ID,
            oauth_client_secret: DEFAULT_GITHUB_CLIENT_SECRET,
            oauth_scopes: 'public_repo'
        };
        yield configService.createProviderConfig(config);
    });
}
export function getOnboardingProvider({ envId }) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield configService.getProviderConfig(DEMO_GITHUB_CONFIG_KEY, envId);
    });
}
//# sourceMappingURL=onboarding.service.js.map