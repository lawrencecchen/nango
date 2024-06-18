var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isTest } from '@nangohq/utils';
import { envs } from '../env.js';
import { logger } from '../utils.js';
import { client } from './client.js';
import { getDailyIndexPipeline, indexMessages, policyRetention } from './schema.js';
import { createMessage } from '../models/messages.js';
import { getFormattedMessage } from '../models/helpers.js';
export function start() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!envs.NANGO_LOGS_ENABLED) {
            logger.warning('OpenSearch is disabled, skipping');
            return;
        }
        logger.info('🔄 OpenSearch service starting...');
        yield migrateMapping();
        logger.info('✅ OpenSearch');
    });
}
export function migrateMapping() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const index = indexMessages;
            logger.info(`Migrating index "${index.index}"...`);
            // -- Policy
            logger.info(`  Updating policy`);
            yield client.ilm.putLifecycle(policyRetention());
            // -- Index
            const existsTemplate = yield client.indices.existsIndexTemplate({ name: `${index.index}-template` });
            logger.info(`  ${existsTemplate ? 'updating' : 'creating'} index template "${index.index}"...`);
            yield client.indices.putIndexTemplate({
                name: `${index.index}-template`,
                index_patterns: `${index.index}.*`,
                template: {
                    settings: index.settings,
                    mappings: index.mappings,
                    aliases: { [index.index]: {} }
                }
            });
            // -- Pipeline
            // Pipeline will automatically create an index based on a field
            // In our case we create a daily index based on "createdAt"
            logger.info(`  Updating pipeline`);
            yield client.ingest.putPipeline(getDailyIndexPipeline(index.index));
            const existsAlias = yield client.indices.exists({ index: index.index });
            if (!existsAlias) {
                // insert a dummy record to create first index
                logger.info(`  Inserting dummy record`);
                yield createMessage(getFormattedMessage({}));
            }
        }
        catch (err) {
            logger.error(err);
            throw new Error('failed_to_init_elasticsearch');
        }
    });
}
export function deleteIndex({ prefix }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!isTest) {
            throw new Error('Trying to delete stuff in prod');
        }
        try {
            const indices = yield client.cat.indices({ format: 'json' });
            yield Promise.all(indices.map((index) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                if (!((_a = index.index) === null || _a === void 0 ? void 0 : _a.startsWith(prefix))) {
                    return;
                }
                yield client.indices.delete({ index: index.index, ignore_unavailable: true });
            })));
        }
        catch (err) {
            logger.error(err);
            throw new Error('failed_to_deleteIndex');
        }
    });
}
//# sourceMappingURL=helpers.js.map