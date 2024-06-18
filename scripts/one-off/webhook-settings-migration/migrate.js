var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import './loadEnv.js';
import { database } from '@nangohq/database';
function migrate() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting webhook settings migration...');
        let id = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const environments = yield database.knex.select('*').from('_nango_environments').where('id', '>', id).orderBy('id').limit(1000);
            if (environments.length === 0) {
                break;
            }
            for (const environment of environments) {
                const { id, webhook_url, webhook_url_secondary, always_send_webhook, send_auth_webhook } = environment;
                yield database
                    .knex('_nango_external_webhooks')
                    .insert({
                    environment_id: id,
                    primary_url: webhook_url,
                    secondary_url: webhook_url_secondary,
                    on_sync_completion_always: always_send_webhook,
                    on_auth_creation: send_auth_webhook
                })
                    .onConflict('environment_id')
                    .merge();
            }
            id = environments[environments.length - 1].id;
        }
    });
}
const start = new Date();
migrate()
    .catch((error) => {
    console.error('Error occurred during webhook settings migration:', error);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    const end = new Date();
    console.log('Execution took:', (end.getTime() - start.getTime()) / 1000, 's');
    process.exit(0);
}));
//# sourceMappingURL=migrate.js.map