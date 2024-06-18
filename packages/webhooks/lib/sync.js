var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { deliver, shouldSend } from './utils.js';
dayjs.extend(utc);
export const sendSync = ({ connection, environment, webhookSettings, syncName, model, now, responseResults, success, operation, error, activityLogId, logCtx }) => __awaiter(void 0, void 0, void 0, function* () {
    if (!webhookSettings) {
        return;
    }
    if (!shouldSend({ success, type: 'sync', webhookSettings, operation })) {
        return;
    }
    const body = {
        from: 'nango',
        type: 'sync',
        connectionId: connection.connection_id,
        providerConfigKey: connection.provider_config_key,
        syncName,
        model,
        syncType: operation
    };
    let successBody = {};
    let errorBody = {};
    let endingMessage = '';
    if (success) {
        const noChanges = (responseResults === null || responseResults === void 0 ? void 0 : responseResults.added) === 0 && (responseResults === null || responseResults === void 0 ? void 0 : responseResults.updated) === 0 && (responseResults.deleted === 0 || responseResults.deleted === undefined);
        if (!webhookSettings.on_sync_completion_always && noChanges) {
            yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.info('There were no added, updated, or deleted results. No webhook sent, as per your environment settings'));
            return;
        }
        successBody = Object.assign(Object.assign({}, body), { success: true, responseResults: {
                added: responseResults.added,
                updated: responseResults.updated,
                deleted: 0
            }, modifiedAfter: dayjs(now).toDate().toISOString(), queryTimeStamp: operation !== 'INITIAL' ? now : null });
        if (responseResults.deleted && responseResults.deleted > 0) {
            successBody.responseResults.deleted = responseResults.deleted;
        }
        endingMessage = noChanges ? 'with no data changes as per your environment settings.' : 'with data changes.';
    }
    else {
        errorBody = Object.assign(Object.assign({}, body), { success: false, error: error, startedAt: dayjs(now).toDate().toISOString(), failedAt: new Date().toISOString() });
    }
    const webhooks = [
        { url: webhookSettings.primary_url, type: 'webhook url' },
        { url: webhookSettings.secondary_url, type: 'secondary webhook url' }
    ].filter((webhook) => webhook.url);
    yield deliver({
        webhooks,
        body: success ? successBody : errorBody,
        webhookType: 'sync',
        activityLogId,
        endingMessage: success ? endingMessage : '',
        environment,
        logCtx
    });
});
//# sourceMappingURL=sync.js.map