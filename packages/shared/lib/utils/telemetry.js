var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { v2, client } from '@datadog/datadog-api-client';
import { isCloud } from '@nangohq/utils';
export var LogTypes;
(function (LogTypes) {
    LogTypes["AUTH_TOKEN_REFRESH_START"] = "auth_token_refresh_start";
    LogTypes["AUTH_TOKEN_REFRESH_SUCCESS"] = "auth_token_refresh_success";
    LogTypes["AUTH_TOKEN_REFRESH_FAILURE"] = "auth_token_refresh_failure";
    LogTypes["AUTH_TOKEN_REQUEST_START"] = "auth_token_request_start";
    LogTypes["AUTH_TOKEN_REQUEST_CALLBACK_RECEIVED"] = "auth_token_request_callback_received";
    LogTypes["AUTH_TOKEN_REQUEST_SUCCESS"] = "auth_token_request_success";
    LogTypes["AUTH_TOKEN_REQUEST_FAILURE"] = "auth_token_request_failure";
    LogTypes["ACTION_SUCCESS"] = "action_success";
    LogTypes["ACTION_FAILURE"] = "action_failure";
    LogTypes["SYNC_OVERLAP"] = "sync_overlap";
    LogTypes["SYNC_FAILURE"] = "sync_failure";
    LogTypes["SYNC_SUCCESS"] = "sync_success";
    LogTypes["SYNC_SCRIPT_RETURN_USED"] = "sync_script_return_used";
    LogTypes["GET_CONNECTION_FAILURE"] = "get_connection_failure";
    LogTypes["GET_CONNECTION_SUCCESS"] = "get_connection_success";
    LogTypes["SYNC_DEPLOY_SUCCESS"] = "sync_deploy_success";
    LogTypes["SYNC_DEPLOY_FAILURE"] = "sync_deploy_failure";
    LogTypes["SYNC_GET_RECORDS_OFFSET_USED"] = "sync_get_records_offset_used";
    LogTypes["SYNC_GET_RECORDS_SORT_BY_USED"] = "sync_get_records_sort_by_used";
    LogTypes["SYNC_GET_RECORDS_ORDER_USED"] = "sync_get_records_order_used";
    LogTypes["SYNC_GET_RECORDS_INCLUDE_METADATA_USED"] = "sync_get_records_include_metadata_used";
    LogTypes["SYNC_GET_RECORDS_DEPRECATED_METHOD_USED"] = "sync_get_records_deprecated_method_used";
    LogTypes["FLOW_JOB_TIMEOUT_FAILURE"] = "flow_job_failure";
    LogTypes["POST_CONNECTION_SCRIPT_SUCCESS"] = "post_connection_script_success";
    LogTypes["POST_CONNECTION_SCRIPT_FAILURE"] = "post_connection_script_failure";
    LogTypes["INCOMING_WEBHOOK_RECEIVED"] = "incoming_webhook_received";
    LogTypes["INCOMING_WEBHOOK_ISSUE_WRONG_CONNECTION_IDENTIFIER"] = "incoming_webhook_issue_wrong_connection_identifier";
    LogTypes["INCOMING_WEBHOOK_ISSUE_CONNECTION_NOT_FOUND"] = "incoming_webhook_issue_connection_not_found";
    LogTypes["INCOMING_WEBHOOK_PROCESSED_SUCCESSFULLY"] = "incoming_webhook_processed_successfully";
    LogTypes["INCOMING_WEBHOOK_FAILED_PROCESSING"] = "incoming_webhook_failed_processing";
    LogTypes["TEMPORAL_SCHEDULE_MISMATCH_NOT_PAUSED"] = "temporal_schedule_mismatch_not_paused";
    LogTypes["TEMPORAL_SCHEDULE_MISMATCH_NOT_RUNNING"] = "temporal_schedule_mismatch_not_running";
})(LogTypes = LogTypes || (LogTypes = {}));
export var SpanTypes;
(function (SpanTypes) {
    SpanTypes["CONNECTION_TEST"] = "nango.server.hooks.connectionTest";
    SpanTypes["JOBS_IDLE_DEMO"] = "nango.jobs.cron.idleDemos";
    SpanTypes["RUNNER_EXEC"] = "nango.runner.exec";
})(SpanTypes = SpanTypes || (SpanTypes = {}));
class Telemetry {
    constructor() {
        try {
            if (isCloud && process.env['DD_API_KEY'] && process.env['DD_APP_KEY']) {
                const configuration = client.createConfiguration();
                configuration.setServerVariables({
                    site: 'us3.datadoghq.com'
                });
                this.logInstance = new v2.LogsApi(configuration);
            }
        }
        catch (_) {
            return;
        }
    }
    log(eventId, message, operation, context = {}, additionalTags = '') {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const additionalProperties = Object.assign(Object.assign({}, context), { level: context.level || 'info' });
            const params = {
                body: [
                    {
                        ddsource: 'web',
                        ddtags: `${eventId}, environment:${process.env['NODE_ENV']}, ${additionalTags}`,
                        message,
                        service: operation,
                        additionalProperties
                    }
                ]
            };
            yield ((_a = this.logInstance) === null || _a === void 0 ? void 0 : _a.submitLog(params));
        });
    }
}
export default new Telemetry();
//# sourceMappingURL=telemetry.js.map