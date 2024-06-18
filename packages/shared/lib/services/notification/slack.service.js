var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import db, { schema, dbNamespace } from '@nangohq/database';
import { LogActionEnum } from '@nangohq/models/Activity.js';
import { basePublicUrl, getLogger } from '@nangohq/utils';
import environmentService from '../environment.service.js';
import { updateSuccess as updateSuccessActivityLog, createActivityLogMessage, createActivityLog } from '../activity/activity.service.js';
import connectionService from '../connection.service.js';
import accountService from '../account.service.js';
import { Orchestrator } from '../../clients/orchestrator.js';
const logger = getLogger('SlackService');
const TABLE = dbNamespace + 'slack_notifications';
export const generateSlackConnectionId = (accountUUID, environmentName) => `account-${accountUUID}-${environmentName}`;
/**
 * _nango_slack_notifications
 * @desc persistence layer for slack notifications and the connection list
 * to be able to trigger or resolve notifications
 *
 *  index:
 *      - open
 *      - environment_id
 *      - name
 */
export class SlackService {
    constructor({ orchestratorClient, logContextGetter }) {
        this.actionName = 'flow-result-notifier-action';
        this.adminConnectionId = process.env['NANGO_ADMIN_CONNECTION_ID'] || 'admin-slack';
        this.integrationKey = process.env['NANGO_SLACK_INTEGRATION_KEY'] || 'slack';
        this.nangoAdminUUID = process.env['NANGO_ADMIN_UUID'];
        this.env = 'prod';
        this.orchestrator = new Orchestrator(orchestratorClient);
        this.logContextGetter = logContextGetter;
    }
    /**
     * Get Nango Admin Connection
     * @desc get the admin connection information to be able to send a duplicate
     * notification to the Nango admin account
     */
    getNangoAdminConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield accountService.getAccountAndEnvironmentIdByUUID(this.nangoAdminUUID, this.env);
            const { success, response: slackConnection } = yield connectionService.getConnection(this.adminConnectionId, this.integrationKey, info === null || info === void 0 ? void 0 : info.environmentId);
            if (!success || !slackConnection) {
                return null;
            }
            return slackConnection;
        });
    }
    getAdminEnvironmentId() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield accountService.getAccountAndEnvironmentIdByUUID(this.nangoAdminUUID, this.env);
            return info === null || info === void 0 ? void 0 : info.environmentId;
        });
    }
    /**
     * Send Duplicate Notification to Nango Admins
     * @desc append the account and environment information to the notification content,
     * add the payload timestamp if available and send the notification to the Nango Admins
     * and with the action response update the slack timestamp to the notification
     * record. This is so future notifications can be sent as updates to the original
     */
    sendDuplicateNotificationToNangoAdmins(payload, activityLogId, environment_id, logCtx, // TODO: we should not reuse this ctx
    id, ts) {
        return __awaiter(this, void 0, void 0, function* () {
            const nangoAdminConnection = yield this.getNangoAdminConnection();
            if (!nangoAdminConnection) {
                return;
            }
            const account = yield environmentService.getAccountFromEnvironment(environment_id);
            if (!account) {
                throw new Error('failed_to_get_account');
            }
            payload.content = `${payload.content} [Account ${account.uuid} Environment ${environment_id}]`;
            if (ts) {
                payload.ts = ts;
            }
            const actionResponse = yield this.orchestrator.triggerAction({
                connection: nangoAdminConnection,
                actionName: this.actionName,
                input: payload,
                activityLogId,
                environment_id: nangoAdminConnection === null || nangoAdminConnection === void 0 ? void 0 : nangoAdminConnection.environment_id,
                logCtx
            });
            if (id && actionResponse.isOk() && actionResponse.value.ts) {
                yield this.updateNotificationWithAdminTimestamp(id, actionResponse.value.ts);
            }
        });
    }
    /**
     * Update Notification with Timestamp
     * @desc used to keep the slack_timestamp up to date to be able to
     * send updates to the original notification
     */
    updateNotificationWithTimestamp(id, ts) {
        return __awaiter(this, void 0, void 0, function* () {
            yield schema()
                .from(TABLE)
                .update({
                slack_timestamp: ts
            })
                .where('id', id);
        });
    }
    /**
     * Update Notification with Admin Timestamp
     * @desc used to keep the admin_slack_timestamp up to date to be able to
     * send updates to the original notification
     */
    updateNotificationWithAdminTimestamp(id, ts) {
        return __awaiter(this, void 0, void 0, function* () {
            yield schema()
                .from(TABLE)
                .update({
                admin_slack_timestamp: ts
            })
                .where('id', id);
        });
    }
    /**
     * Report Failure
     * @desc
     *      1) if slack notifications are enabled and the name is not itself (to avoid an infinite loop)
     *      add the connection to the notification list, grab the connection information
     *      of the admin slack notification action and send the notification to the slack channel
     *      by triggering the action.
     *      2) Update the notification record with the slack timestamp
     *      so future notifications can be sent as updates to the original.
     *      3) Send a duplicate notification to the Nango Admins
     *      4) Add an activity log entry for the notification to the admin account
     */
    reportFailure(nangoConnection, name, type, originalActivityLogId, environment_id, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            const slackNotificationsEnabled = yield environmentService.getSlackNotificationsEnabled(nangoConnection.environment_id);
            if (!slackNotificationsEnabled) {
                return;
            }
            if (name === this.actionName) {
                return;
            }
            const envName = (yield environmentService.getEnvironmentName(nangoConnection.environment_id));
            const { success, error, response: slackNotificationStatus } = yield this.addFailingConnection(nangoConnection, name, type);
            const account = yield environmentService.getAccountFromEnvironment(environment_id);
            if (!account) {
                throw new Error('failed_to_get_account');
            }
            const slackConnectionId = generateSlackConnectionId(account.uuid, envName);
            const nangoEnvironmentId = yield this.getAdminEnvironmentId();
            // we get the connection on the nango admin account to be able to send the notification
            const { success: connectionSuccess, error: slackConnectionError, response: slackConnection } = yield connectionService.getConnection(slackConnectionId, this.integrationKey, nangoEnvironmentId);
            if (!connectionSuccess || !slackConnection) {
                logger.error(slackConnectionError);
                return;
            }
            const log = {
                level: 'info',
                success: false,
                action: LogActionEnum.ACTION,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.connection_id,
                provider_config_key: slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.provider_config_key,
                provider: this.integrationKey,
                environment_id: slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.environment_id,
                operation_name: this.actionName
            };
            const activityLogId = yield createActivityLog(log);
            const logCtx = yield this.logContextGetter.create({ id: String(activityLogId), operation: { type: 'action' }, message: 'Start action' }, {
                account,
                environment: { id: environment_id, name: envName },
                integration: { id: slackConnection.config_id, name: slackConnection.provider_config_key, provider: 'slack' },
                connection: { id: slackConnection.id, name: slackConnection.connection_id }
            });
            if (!success || !slackNotificationStatus) {
                yield createActivityLogMessage({
                    level: 'error',
                    environment_id,
                    activity_log_id: activityLogId,
                    content: `Failed looking up the slack notification using the slack notification service. The error was: ${error}`,
                    timestamp: Date.now()
                });
                yield logCtx.error('Failed looking up the slack notification using the slack notification service', { error });
                yield logCtx.failed();
                return;
            }
            const count = slackNotificationStatus.connectionCount;
            const connectionWord = count === 1 ? 'connection' : 'connections';
            const flowType = type;
            const date = new Date();
            const payload = {
                content: this.getMessage({ type, count, connectionWord, flowType, name, envName, originalActivityLogId, date, resolved: false }),
                status: 'open',
                providerConfigKey: nangoConnection.provider_config_key,
                provider
            };
            if (slackNotificationStatus.slack_timestamp) {
                payload.ts = slackNotificationStatus.slack_timestamp;
            }
            try {
                const actionResponse = yield this.orchestrator.triggerAction({
                    connection: slackConnection,
                    actionName: this.actionName,
                    input: payload,
                    activityLogId: activityLogId,
                    environment_id,
                    logCtx
                });
                if (actionResponse.isOk() && actionResponse.value.ts) {
                    yield this.updateNotificationWithTimestamp(slackNotificationStatus.id, actionResponse.value.ts);
                }
                yield this.sendDuplicateNotificationToNangoAdmins(payload, originalActivityLogId, environment_id, logCtx, slackNotificationStatus.id, slackNotificationStatus.admin_slack_timestamp);
                const content = actionResponse.isOk()
                    ? `The action ${this.actionName} was successfully triggered for the ${flowType} ${name} for environment ${slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.environment_id} for account ${account.uuid}.`
                    : `The action ${this.actionName} failed to trigger for the ${flowType} ${name} with the error: ${actionResponse.error.message} for environment ${slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.environment_id} for account ${account.uuid}.`;
                yield createActivityLogMessage({
                    level: actionResponse.isOk() ? 'info' : 'error',
                    activity_log_id: activityLogId,
                    environment_id: slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.environment_id,
                    timestamp: Date.now(),
                    content,
                    params: payload
                });
                yield updateSuccessActivityLog(activityLogId, actionResponse.isOk());
                if (actionResponse.isOk()) {
                    yield logCtx.info(`The action ${this.actionName} was successfully triggered for the ${flowType} ${name} for environment ${slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.environment_id} for account ${account.uuid}.`, { payload });
                    yield logCtx.success();
                }
                else {
                    yield logCtx.error(`The action ${this.actionName} failed to trigger for the ${flowType} ${name} with the error: ${actionResponse.error.message} for environment ${slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.environment_id} for account ${account.uuid}.`, { error: actionResponse.error, payload });
                    yield logCtx.failed();
                }
            }
            catch (error) {
                yield logCtx.error('Failed to trigger slack notification', { error });
                yield logCtx.failed();
            }
        });
    }
    /**
     * Report Resolution
     * @desc
     *      1) if there are no more connections that are failing then send
     *      a resolution notification to the slack channel, otherwise update the message
     *      with the decremented connection count.
     *      2) Send a duplicate notification to the Nango Admins
     *      3) Add an activity log entry for the notification to the admin account
     *
     */
    reportResolution(nangoConnection, syncName, type, originalActivityLogId, environment_id, provider, slack_timestamp, admin_slack_timestamp, connectionCount) {
        return __awaiter(this, void 0, void 0, function* () {
            if (syncName === this.actionName) {
                return;
            }
            const envName = (yield environmentService.getEnvironmentName(nangoConnection.environment_id));
            let payloadContent = '';
            if (connectionCount === 0) {
                payloadContent = this.getMessage({
                    type,
                    count: connectionCount,
                    connectionWord: 'connections',
                    flowType: type,
                    name: syncName,
                    envName,
                    originalActivityLogId,
                    date: new Date(),
                    resolved: true
                });
            }
            else {
                const count = connectionCount;
                const connection = count === 1 ? 'connection' : 'connections';
                payloadContent = this.getMessage({
                    type,
                    count,
                    connectionWord: connection,
                    flowType: type,
                    name: syncName,
                    envName,
                    originalActivityLogId,
                    date: new Date(),
                    resolved: false
                });
            }
            const payload = {
                content: payloadContent,
                status: connectionCount === 0 ? 'closed' : 'open',
                providerConfigKey: nangoConnection.provider_config_key,
                provider,
                ts: slack_timestamp
            };
            const account = yield environmentService.getAccountFromEnvironment(environment_id);
            if (!account) {
                throw new Error('failed_to_get_account');
            }
            const nangoEnvironmentId = yield this.getAdminEnvironmentId();
            const slackConnectionId = generateSlackConnectionId(account.uuid, envName);
            const { success: connectionSuccess, response: slackConnection } = yield connectionService.getConnection(slackConnectionId, this.integrationKey, nangoEnvironmentId);
            if (!connectionSuccess || !slackConnection) {
                return;
            }
            const log = {
                level: 'info',
                success: false,
                action: LogActionEnum.ACTION,
                start: Date.now(),
                end: Date.now(),
                timestamp: Date.now(),
                connection_id: slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.connection_id,
                provider_config_key: slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.provider_config_key,
                provider: this.integrationKey,
                environment_id: slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.environment_id,
                operation_name: this.actionName
            };
            const activityLogId = yield createActivityLog(log);
            const logCtx = yield this.logContextGetter.create({ id: String(activityLogId), operation: { type: 'action' }, message: 'Start action' }, {
                account,
                environment: { id: environment_id, name: envName },
                integration: { id: slackConnection.config_id, name: slackConnection.provider_config_key, provider: 'slack' },
                connection: { id: slackConnection.id, name: slackConnection.connection_id }
            });
            try {
                const actionResponse = yield this.orchestrator.triggerAction({
                    connection: slackConnection,
                    actionName: this.actionName,
                    input: payload,
                    activityLogId: activityLogId,
                    environment_id,
                    logCtx
                });
                yield this.sendDuplicateNotificationToNangoAdmins(payload, activityLogId, environment_id, logCtx, undefined, admin_slack_timestamp);
                const content = actionResponse.isOk()
                    ? `The action ${this.actionName} was successfully triggered for the ${type} ${syncName} for environment ${slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.environment_id} for account ${account.uuid}.`
                    : `The action ${this.actionName} failed to trigger for the ${type} ${syncName} with the error: ${actionResponse.error.message} for environment ${slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.environment_id} for account ${account.uuid}.`;
                yield createActivityLogMessage({
                    level: actionResponse.isOk() ? 'info' : 'error',
                    activity_log_id: activityLogId,
                    environment_id: slackConnection === null || slackConnection === void 0 ? void 0 : slackConnection.environment_id,
                    timestamp: Date.now(),
                    content,
                    params: payload
                });
                yield updateSuccessActivityLog(activityLogId, actionResponse.isOk());
                if (actionResponse.isOk()) {
                    yield logCtx.info(content, payload);
                    yield logCtx.success();
                }
                else {
                    yield logCtx.error(content, { error: actionResponse.error });
                    yield logCtx.failed();
                }
            }
            catch (error) {
                yield logCtx.error('Failed to trigger slack notification', { error });
                yield logCtx.failed();
            }
        });
    }
    /**
     * Has Open Notification
     * @desc Check if there is an open notification for the given name
     * and environment id and if so return the necessary information to be able
     * to update the notification.
     */
    hasOpenNotification(nangoConnection, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const hasOpenNotification = yield schema()
                .select('id', 'connection_list', 'slack_timestamp', 'admin_slack_timestamp')
                .from(TABLE)
                .where({
                open: true,
                environment_id: nangoConnection.environment_id,
                name
            });
            if (!hasOpenNotification || !hasOpenNotification.length) {
                return null;
            }
            return hasOpenNotification[0];
        });
    }
    /**
     * Create Notification
     * @desc create a new notification for the given name and environment id
     * and return the id of the created notification.
     */
    createNotification(nangoConnection, name, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield schema()
                .from(TABLE)
                .insert({
                open: true,
                environment_id: nangoConnection.environment_id,
                name,
                type,
                connection_list: [nangoConnection.id]
            })
                .returning('id');
            if (result && result.length > 0 && result[0]) {
                return result[0];
            }
            return null;
        });
    }
    /**
     * Add Failing Connection
     * @desc check if there is an open notification for the given name and environment id
     * and if so add the connection id to the connection list.
     */
    addFailingConnection(nangoConnection, name, type) {
        return __awaiter(this, void 0, void 0, function* () {
            const isOpen = yield this.hasOpenNotification(nangoConnection, name);
            logger.info(`Notifying ${nangoConnection.id} type:${type} name:${name}`);
            if (!isOpen) {
                const created = yield this.createNotification(nangoConnection, name, type);
                return {
                    success: true,
                    error: null,
                    response: {
                        id: created === null || created === void 0 ? void 0 : created.id,
                        isOpen: false,
                        connectionCount: 1
                    }
                };
            }
            const { id, connection_list } = isOpen;
            if (connection_list.includes(nangoConnection.id)) {
                return {
                    success: true,
                    error: null,
                    response: {
                        id: id,
                        isOpen: true,
                        slack_timestamp: isOpen.slack_timestamp,
                        admin_slack_timestamp: isOpen.admin_slack_timestamp,
                        connectionCount: connection_list.length
                    }
                };
            }
            connection_list.push(nangoConnection.id);
            yield schema()
                .from(TABLE)
                .where({ id: id })
                .update({
                connection_list,
                updated_at: new Date()
            });
            return {
                success: true,
                error: null,
                response: {
                    id: id,
                    isOpen: true,
                    slack_timestamp: isOpen.slack_timestamp,
                    admin_slack_timestamp: isOpen.admin_slack_timestamp,
                    connectionCount: connection_list.length
                }
            };
        });
    }
    /**
     * Remove Failing Connection
     * @desc check if there is an open notification for the given name and environment id
     * and if so remove the connection id from the connection list and report
     * resolution to the slack channel.
     */
    removeFailingConnection(nangoConnection, name, type, originalActivityLogId, environment_id, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            const slackNotificationsEnabled = yield environmentService.getSlackNotificationsEnabled(nangoConnection.environment_id);
            if (!slackNotificationsEnabled) {
                return;
            }
            const isOpen = yield this.hasOpenNotification(nangoConnection, name);
            if (!isOpen) {
                return;
            }
            const { id, connection_list, slack_timestamp, admin_slack_timestamp } = isOpen;
            const index = connection_list.indexOf(nangoConnection.id);
            if (index === -1) {
                return;
            }
            logger.info(`Resolving ${nangoConnection.id} type:${type} name:${name}`);
            connection_list.splice(index, 1);
            yield db.knex
                .from(TABLE)
                .where({ id: id })
                .update({
                open: connection_list.length > 0,
                connection_list,
                updated_at: new Date()
            });
            // we report resolution to the slack channel which could be either
            // 1) The slack notification is resolved, connection_list === 0
            // 2) The list of failing connections has been decremented
            yield this.reportResolution(nangoConnection, name, type, originalActivityLogId, environment_id, provider, slack_timestamp, admin_slack_timestamp, connection_list.length);
        });
    }
    closeAllOpenNotifications(environment_id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield schema()
                .from(TABLE)
                .where({
                environment_id,
                open: true
            })
                .update({
                open: false,
                updated_at: new Date()
            });
        });
    }
    getLogUrl({ envName, originalActivityLogId, name, date, type }) {
        const usp = new URLSearchParams();
        if (originalActivityLogId) {
            usp.set('operationId', String(originalActivityLogId));
        }
        const from = new Date(date);
        from.setHours(0, 0);
        const to = new Date(date);
        to.setHours(23, 59);
        usp.set('from', from.toISOString());
        usp.set('to', to.toISOString());
        if (type === 'auth') {
            usp.set('connections', name);
        }
        else {
            usp.set('syncs', name);
        }
        return `${basePublicUrl}/${envName}/logs?${usp.toString()}`;
    }
    getMessage({ type, count, connectionWord, flowType, name, envName, originalActivityLogId, date, resolved }) {
        switch (type) {
            case 'sync':
            case 'action': {
                if (resolved) {
                    return `[Resolved] *${name}* (${flowType.toLowerCase()}) in *${envName}* failed. Read <${this.getLogUrl({ envName, originalActivityLogId, name, date, type })}|logs>.`;
                }
                else {
                    return `*${name}* (${flowType.toLowerCase()}) is failing for ${count} ${connectionWord} in *${envName}*. Read <${this.getLogUrl({ envName, originalActivityLogId, name, date, type })}|logs>.`;
                }
            }
            case 'auth': {
                if (resolved) {
                    return `[Resolved] connection *${name}* in *${envName}* refresh failed.`;
                }
                else {
                    return `Could not refresh token of connection *${name}* in *${envName}*. Read <${this.getLogUrl({ envName, originalActivityLogId, name, date, type })}|logs>.`;
                }
            }
        }
        return '';
    }
}
//# sourceMappingURL=slack.service.js.map