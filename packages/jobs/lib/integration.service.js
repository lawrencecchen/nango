var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { integrationFilesAreRemote, isCloud, isProd, getLogger, stringifyError } from '@nangohq/utils';
import { createActivityLogMessage, localFileService, remoteFileService, NangoError, formatScriptError } from '@nangohq/shared';
import tracer from 'dd-trace';
import { logContextGetter } from '@nangohq/logs';
import { getOrStartRunner, getRunnerId } from './runner/runner.js';
const logger = getLogger('integration.service');
class IntegrationService {
    constructor() {
        this.runningScripts = new Map();
        this.sendHeartbeat();
    }
    cancelScript(syncId, environmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const scriptObject = this.runningScripts.get(syncId);
            if (!scriptObject) {
                return;
            }
            const { runner, activityLogId } = scriptObject;
            const res = yield runner.client.cancel.mutate({
                syncId
            });
            if (res.isOk()) {
                this.runningScripts.set(syncId, Object.assign(Object.assign({}, scriptObject), { cancelled: true }));
            }
            else {
                if (activityLogId && environmentId) {
                    yield createActivityLogMessage({
                        level: 'error',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        content: `Failed to cancel script`,
                        timestamp: Date.now()
                    });
                    const logCtx = logContextGetter.getStateLess({ id: String(activityLogId) });
                    yield logCtx.error('Failed to cancel script');
                }
            }
        });
    }
    runScript({ syncName, syncId, activityLogId, nangoProps, integrationData, environmentId, writeToDb, isInvokedImmediately, isWebhook, optionalLoadLocation, input, temporalContext }) {
        return __awaiter(this, void 0, void 0, function* () {
            const span = tracer
                .startSpan('runScript')
                .setTag('accountId', nangoProps.accountId)
                .setTag('environmentId', nangoProps.environmentId)
                .setTag('connectionId', nangoProps.connectionId)
                .setTag('providerConfigKey', nangoProps.providerConfigKey)
                .setTag('syncId', nangoProps.syncId)
                .setTag('syncName', syncName);
            const logCtx = activityLogId ? logContextGetter.getStateLess({ id: String(activityLogId) }) : null;
            try {
                const script = (isCloud || integrationFilesAreRemote) && !optionalLoadLocation
                    ? yield remoteFileService.getFile(integrationData.fileLocation, environmentId)
                    : localFileService.getIntegrationFile(syncName, nangoProps.providerConfigKey, optionalLoadLocation);
                if (!script) {
                    const content = `Unable to find integration file for ${syncName}`;
                    if (activityLogId && writeToDb) {
                        yield createActivityLogMessage({
                            level: 'error',
                            environment_id: environmentId,
                            activity_log_id: activityLogId,
                            content,
                            timestamp: Date.now()
                        });
                        yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.error(content));
                    }
                    const error = new NangoError('Unable to find integration file', 404);
                    return { success: false, error, response: null };
                }
                if (nangoProps.accountId == null) {
                    throw new Error(`No accountId provided (instead ${nangoProps.accountId})`);
                }
                const accountId = nangoProps.accountId;
                // a runner per account in prod only
                const runnerId = isProd ? getRunnerId(`${accountId}`) : getRunnerId('default');
                // fallback to default runner if account runner isn't ready yet
                const runner = yield getOrStartRunner(runnerId).catch(() => getOrStartRunner(getRunnerId('default')));
                if (temporalContext) {
                    this.runningScripts.set(syncId, { context: temporalContext, runner, activityLogId });
                }
                else {
                    this.runningScripts.set(syncId, { context: null, runner, activityLogId });
                }
                const runSpan = tracer.startSpan('runner.run', { childOf: span }).setTag('runnerId', runner.id);
                try {
                    // TODO: request sent to the runner for it to run the script is synchronous.
                    // TODO: Make the request return immediately and have the runner ping the job service when it's done.
                    // https://github.com/trpc/trpc/blob/66d7db60e59b7c758709175a53765c9db0563dc0/packages/tests/server/abortQuery.test.ts#L26
                    const res = yield runner.client.run.mutate({
                        nangoProps,
                        code: script,
                        codeParams: input,
                        isInvokedImmediately,
                        isWebhook
                    });
                    if (res && res.response && res.response.cancelled) {
                        const error = new NangoError('script_cancelled');
                        runSpan.setTag('error', error);
                        return { success: false, error, response: null };
                    }
                    // TODO handle errors from the runner more gracefully and this service doesn't have to handle them
                    if (res && !res.success && res.error) {
                        const { error } = res;
                        runSpan.setTag('error', error);
                        const err = new NangoError(error.type, error.payload, error.status);
                        return { success: false, error: err, response: null };
                    }
                    return { success: true, error: null, response: res };
                }
                catch (err) {
                    runSpan.setTag('error', err);
                    const scriptObject = this.runningScripts.get(syncId);
                    if (scriptObject) {
                        const { cancelled } = scriptObject;
                        if (cancelled) {
                            this.runningScripts.delete(syncId);
                            return { success: false, error: new NangoError('script_cancelled'), response: null };
                        }
                    }
                    let errorType = 'sync_script_failure';
                    if (isWebhook) {
                        errorType = 'webhook_script_failure';
                    }
                    else if (isInvokedImmediately) {
                        errorType = 'action_script_failure';
                    }
                    const { success, error, response } = formatScriptError(err, errorType, syncName);
                    if (activityLogId && writeToDb) {
                        yield createActivityLogMessage({
                            level: 'error',
                            environment_id: environmentId,
                            activity_log_id: activityLogId,
                            content: error.message,
                            timestamp: Date.now()
                        });
                        yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.error(error.message, { error }));
                    }
                    return { success, error, response };
                }
                finally {
                    runSpan.finish();
                }
            }
            catch (err) {
                span.setTag('error', err);
                const errorMessage = stringifyError(err, { pretty: true });
                const content = `There was an error running integration '${syncName}': ${errorMessage}`;
                if (activityLogId && writeToDb) {
                    yield createActivityLogMessage({
                        level: 'error',
                        environment_id: environmentId,
                        activity_log_id: activityLogId,
                        content,
                        timestamp: Date.now()
                    });
                    yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.error(content, { error: err }));
                }
                return { success: false, error: new NangoError(content, 500), response: null };
            }
            finally {
                this.runningScripts.delete(syncId);
                span.finish();
            }
        });
    }
    sendHeartbeat() {
        setInterval(() => {
            this.runningScripts.forEach((script, syncId) => {
                const { context } = script;
                if (context) {
                    try {
                        context.heartbeat();
                    }
                    catch (error) {
                        logger.error(`Error sending heartbeat for syncId: ${syncId}`, error);
                    }
                }
                else {
                    logger.error(`Error sending heartbeat for syncId ${syncId}: context not found`);
                }
            });
        }, 300000);
    }
}
export default new IntegrationService();
//# sourceMappingURL=integration.service.js.map