var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LogActionEnum, LogTypes, proxyService, connectionService, telemetry } from '@nangohq/shared';
import { stringifyError } from '@nangohq/utils';
import * as postConnectionHandlers from './index.js';
import { connectionRefreshFailed as connectionRefreshFailedHook, connectionRefreshSuccess as connectionRefreshSuccessHook } from '../hooks.js';
const handlers = postConnectionHandlers;
function execute(createdConnection, provider, logContextGetter) {
    return __awaiter(this, void 0, void 0, function* () {
        const { connection: upsertedConnection, environment, account } = createdConnection;
        let logCtx;
        try {
            const credentialResponse = yield connectionService.getConnectionCredentials({
                account,
                environment,
                connectionId: upsertedConnection.connection_id,
                providerConfigKey: upsertedConnection.provider_config_key,
                logContextGetter,
                instantRefresh: false,
                onRefreshSuccess: connectionRefreshSuccessHook,
                onRefreshFailed: connectionRefreshFailedHook
            });
            if (credentialResponse.isErr()) {
                return;
            }
            const { value: connection } = credentialResponse;
            const internalConfig = {
                connection,
                provider
            };
            const externalConfig = {
                endpoint: '',
                connectionId: connection.connection_id,
                providerConfigKey: connection.provider_config_key,
                method: 'GET',
                data: {}
            };
            const internalNango = {
                getConnection: () => __awaiter(this, void 0, void 0, function* () {
                    const { response: connection } = yield connectionService.getConnection(upsertedConnection.connection_id, upsertedConnection.provider_config_key, environment.id);
                    return connection;
                }),
                proxy: ({ method, endpoint, data }) => __awaiter(this, void 0, void 0, function* () {
                    const finalExternalConfig = Object.assign(Object.assign({}, externalConfig), { method: method || externalConfig.method, endpoint });
                    if (data) {
                        finalExternalConfig.data = data;
                    }
                    const { response } = yield proxyService.route(finalExternalConfig, internalConfig);
                    return response;
                }),
                updateConnectionConfig: (connectionConfig) => {
                    return connectionService.updateConnectionConfig(connection, connectionConfig);
                }
            };
            const handler = handlers[`${provider.replace(/-/g, '')}PostConnection`];
            if (handler) {
                logCtx = yield logContextGetter.create({ operation: { type: 'auth', action: 'post_connection' }, message: 'Start internal post connection script' }, {
                    account,
                    environment,
                    integration: { id: upsertedConnection.config_id, name: upsertedConnection.provider_config_key, provider },
                    connection: { id: upsertedConnection.id, name: upsertedConnection.connection_id }
                });
                try {
                    yield handler(internalNango);
                    yield logCtx.info('Success');
                    yield logCtx.success();
                }
                catch (e) {
                    const errorDetails = e instanceof Error
                        ? {
                            message: e.message || 'Unknown error',
                            name: e.name || 'Error',
                            stack: e.stack || 'No stack trace'
                        }
                        : 'Unknown error';
                    const errorString = JSON.stringify(errorDetails);
                    yield logCtx.error('Post connection script failed', { error: e });
                    yield logCtx.failed();
                    yield telemetry.log(LogTypes.POST_CONNECTION_SCRIPT_FAILURE, `Post connection script failed, ${errorString}`, LogActionEnum.AUTH, {
                        environmentId: String(environment.id),
                        connectionId: upsertedConnection.connection_id,
                        providerConfigKey: upsertedConnection.provider_config_key,
                        provider: provider,
                        level: 'error'
                    });
                }
            }
        }
        catch (err) {
            yield telemetry.log(LogTypes.POST_CONNECTION_SCRIPT_FAILURE, `Post connection manager failed, ${stringifyError(err)}`, LogActionEnum.AUTH, {
                environmentId: String(environment.id),
                connectionId: upsertedConnection.connection_id,
                providerConfigKey: upsertedConnection.provider_config_key,
                provider: provider,
                level: 'error'
            });
            yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.error('Post connection script failed', { error: err }));
            yield (logCtx === null || logCtx === void 0 ? void 0 : logCtx.failed());
        }
    });
}
export default execute;
//# sourceMappingURL=post-connection.js.map