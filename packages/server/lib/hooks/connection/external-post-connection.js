var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createActivityLog, LogActionEnum, postConnectionScriptService } from '@nangohq/shared';
import { getOrchestrator } from '../../utils/utils.js';
export function externalPostConnection(createdConnection, provider, logContextGetter) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!createdConnection) {
            return;
        }
        const { environment, account, connection } = createdConnection;
        const { config_id } = connection;
        if (!config_id || !connection.id) {
            return;
        }
        const postConnectionScripts = yield postConnectionScriptService.getByConfig(config_id);
        if (!postConnectionScripts || postConnectionScripts.length === 0) {
            return;
        }
        const log = {
            level: 'info',
            success: false,
            action: LogActionEnum.POST_CONNECTION_SCRIPT,
            start: Date.now(),
            end: Date.now(),
            timestamp: Date.now(),
            connection_id: connection.connection_id,
            provider,
            provider_config_key: connection.provider_config_key,
            environment_id: environment.id,
            operation_name: 'post-connection-script'
        };
        const activityLogId = yield createActivityLog(log);
        const logCtx = yield logContextGetter.create({ id: String(activityLogId), operation: { type: 'auth', action: 'post_connection' }, message: 'Start external post connection script' }, {
            account,
            environment,
            integration: { id: config_id, name: connection.provider_config_key, provider },
            connection: { id: connection.id, name: connection.connection_id }
        });
        let failed = false;
        for (const postConnectionScript of postConnectionScripts) {
            const { name, file_location: fileLocation } = postConnectionScript;
            const res = yield getOrchestrator().triggerPostConnectionScript({
                connection: createdConnection.connection,
                name,
                fileLocation,
                activityLogId: activityLogId,
                logCtx
            });
            if (res.isErr()) {
                failed = true;
            }
        }
        if (failed) {
            yield logCtx.failed();
        }
        else {
            yield logCtx.success();
        }
    });
}
//# sourceMappingURL=external-post-connection.js.map