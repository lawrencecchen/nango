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
export function get(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield db.knex.select('*').from('_nango_external_webhooks').where({ environment_id: id }).first();
        return result || null;
    });
}
export function update(environment_id, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.knex
            .from('_nango_external_webhooks')
            .insert({
            environment_id,
            on_sync_completion_always: data.alwaysSendWebhook,
            on_auth_creation: data.sendAuthWebhook,
            on_auth_refresh_error: data.sendRefreshFailedWebhook,
            on_sync_error: data.sendSyncFailedWebhook
        })
            .onConflict('environment_id')
            .merge();
    });
}
export function updatePrimaryUrl(environment_id, primaryUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.knex.from('_nango_external_webhooks').insert({ environment_id, primary_url: primaryUrl }).onConflict('environment_id').merge();
    });
}
export function updateSecondaryUrl(environment_id, secondaryUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        yield db.knex
            .from('_nango_external_webhooks')
            .insert({ environment_id, secondary_url: secondaryUrl })
            .onConflict('environment_id')
            .merge();
    });
}
//# sourceMappingURL=external-webhook.service.js.map