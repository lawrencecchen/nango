var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { records as recordsService, format as recordsFormatter } from '@nangohq/records';
import { errorManager, ErrorSourceEnum, LogActionEnum, updateSyncJobResult, getSyncConfigByJobId } from '@nangohq/shared';
import tracer from 'dd-trace';
import { logContextGetter, oldLevelToNewLevel } from '@nangohq/logs';
import { Err, Ok, metrics, stringifyError } from '@nangohq/utils';
const MAX_LOG_CHAR = 10000;
class PersistController {
    saveActivityLog(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { params: { environmentId }, body: { activityLogId, level, msg, timestamp } } = req;
            const truncatedMsg = msg.length > MAX_LOG_CHAR ? `${msg.substring(0, MAX_LOG_CHAR)}... (truncated)` : msg;
            const logCtx = logContextGetter.getStateLess({ id: String(activityLogId) }, { logToConsole: false });
            const result = yield logCtx.log({
                type: 'log',
                message: truncatedMsg,
                environmentId: environmentId,
                level: oldLevelToNewLevel[level],
                source: 'user',
                createdAt: (timestamp ? new Date(timestamp) : new Date()).toISOString()
            });
            if (result) {
                res.status(201).send();
            }
            else {
                next(new Error(`Failed to save log ${activityLogId}`));
            }
        });
    }
    saveRecords(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { params: { environmentId, nangoConnectionId, syncId, syncJobId }, body: { model, records, providerConfigKey, connectionId, activityLogId } } = req;
            const persist = (records) => __awaiter(this, void 0, void 0, function* () {
                return recordsService.upsert({ records, connectionId: nangoConnectionId, model, softDelete: false });
            });
            const result = yield PersistController.persistRecords({
                persistType: 'save',
                environmentId,
                connectionId,
                providerConfigKey,
                nangoConnectionId,
                syncId,
                syncJobId,
                model,
                records,
                activityLogId,
                softDelete: false,
                persistFunction: persist
            });
            if (result.isOk()) {
                res.status(201).send();
            }
            else {
                next(new Error(`'Failed to save records': ${result.error.message}`));
            }
        });
    }
    deleteRecords(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { params: { environmentId, nangoConnectionId, syncId, syncJobId }, body: { model, records, providerConfigKey, connectionId, activityLogId } } = req;
            const persist = (records) => __awaiter(this, void 0, void 0, function* () {
                return recordsService.upsert({ records, connectionId: nangoConnectionId, model, softDelete: true });
            });
            const result = yield PersistController.persistRecords({
                persistType: 'delete',
                environmentId,
                connectionId,
                providerConfigKey,
                nangoConnectionId,
                syncId,
                syncJobId,
                model,
                records,
                activityLogId,
                softDelete: true,
                persistFunction: persist
            });
            if (result.isOk()) {
                res.status(201).send();
            }
            else {
                next(new Error(`'Failed to delete records': ${result.error.message}`));
            }
        });
    }
    updateRecords(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const { params: { environmentId, nangoConnectionId, syncId, syncJobId }, body: { model, records, providerConfigKey, connectionId, activityLogId } } = req;
            const persist = (records) => __awaiter(this, void 0, void 0, function* () {
                return recordsService.update({ records, connectionId: nangoConnectionId, model });
            });
            const result = yield PersistController.persistRecords({
                persistType: 'update',
                environmentId,
                connectionId,
                providerConfigKey,
                nangoConnectionId,
                syncId,
                syncJobId,
                model,
                records,
                activityLogId,
                softDelete: false,
                persistFunction: persist
            });
            if (result.isOk()) {
                res.status(201).send();
            }
            else {
                next(new Error(`'Failed to update records': ${result.error.message}`));
            }
        });
    }
    static persistRecords({ persistType, environmentId, connectionId, providerConfigKey, nangoConnectionId, syncId, syncJobId, model, records, activityLogId, softDelete, persistFunction }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const active = tracer.scope().active();
            const recordsSizeInBytes = Buffer.byteLength(JSON.stringify(records), 'utf8');
            const span = tracer.startSpan('persistRecords', {
                childOf: active,
                tags: {
                    persistType,
                    environmentId,
                    connectionId,
                    providerConfigKey,
                    nangoConnectionId,
                    syncId,
                    syncJobId,
                    model,
                    activityLogId,
                    'records.count': records.length,
                    'records.sizeInBytes': recordsSizeInBytes
                }
            });
            const formatting = recordsFormatter.formatRecords({
                data: records,
                connectionId: nangoConnectionId,
                model,
                syncId,
                syncJobId,
                softDelete
            });
            const logCtx = logContextGetter.getStateLess({ id: String(activityLogId) });
            if (formatting.isErr()) {
                yield logCtx.error('There was an issue with the batch', { error: formatting.error, persistType });
                const err = new Error(`Failed to ${persistType} records ${activityLogId}`);
                span.setTag('error', err).finish();
                return Err(err);
            }
            const syncConfig = yield getSyncConfigByJobId(syncJobId);
            if (syncConfig && !(syncConfig === null || syncConfig === void 0 ? void 0 : syncConfig.models.includes(model))) {
                const err = new Error(`The model '${model}' is not included in the declared sync models: ${syncConfig.models}.`);
                yield logCtx.error(`The model '${model}' is not included in the declared sync models`);
                span.setTag('error', err).finish();
                return Err(err);
            }
            const persistResult = yield persistFunction(formatting.value);
            if (persistResult.isOk()) {
                const summary = persistResult.value;
                const updatedResults = {
                    [model]: {
                        added: summary.addedKeys.length,
                        updated: summary.updatedKeys.length,
                        deleted: ((_a = summary.deletedKeys) === null || _a === void 0 ? void 0 : _a.length) || 0
                    }
                };
                for (const nonUniqueKey of summary.nonUniqueKeys) {
                    yield logCtx.error(`Found duplicate key '${nonUniqueKey}' for model ${model}. The record was ignored.`);
                }
                yield logCtx.info('Batch saved successfully', { persistType, updatedResults });
                yield updateSyncJobResult(syncJobId, updatedResults, model);
                metrics.increment(metrics.Types.PERSIST_RECORDS_COUNT, records.length);
                metrics.increment(metrics.Types.PERSIST_RECORDS_SIZE_IN_BYTES, recordsSizeInBytes);
                span.finish();
                return Ok(void 0);
            }
            else {
                const content = `There was an issue with the batch ${persistType}. ${stringifyError(persistResult.error)}`;
                yield logCtx.error('There was an issue with the batch', { error: persistResult.error, persistType });
                errorManager.report(content, {
                    environmentId: environmentId,
                    source: ErrorSourceEnum.CUSTOMER,
                    operation: LogActionEnum.SYNC,
                    metadata: {
                        connectionId: connectionId,
                        providerConfigKey: providerConfigKey,
                        syncId: syncId,
                        nangoConnectionId: nangoConnectionId,
                        syncJobId: syncJobId
                    }
                });
                span.setTag('error', persistResult.error).finish();
                return Err(persistResult.error);
            }
        });
    }
}
export default new PersistController();
//# sourceMappingURL=persist.controller.js.map