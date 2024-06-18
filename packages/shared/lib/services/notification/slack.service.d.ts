import type { SlackNotification } from '@nangohq/models/SlackNotification.js';
import type { NangoConnection } from '@nangohq/models/Connection.js';
import type { ServiceResponse } from '@nangohq/models/Generic.js';
import type { LogContextGetter } from '@nangohq/logs';

import type { OrchestratorClientInterface } from '../../clients/orchestrator.js';
interface NotificationResponse {
    id: number;
    isOpen: boolean;
    connectionCount: number;
    slack_timestamp?: string;
    admin_slack_timestamp?: string;
}
export declare const generateSlackConnectionId: (accountUUID: string, environmentName: string) => string;
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
export declare class SlackService {
    private orchestrator;
    private logContextGetter;
    private actionName;
    private adminConnectionId;
    private integrationKey;
    private nangoAdminUUID;
    private env;
    constructor({ orchestratorClient, logContextGetter }: { orchestratorClient: OrchestratorClientInterface; logContextGetter: LogContextGetter });
    /**
     * Get Nango Admin Connection
     * @desc get the admin connection information to be able to send a duplicate
     * notification to the Nango admin account
     */
    private getNangoAdminConnection;
    private getAdminEnvironmentId;
    /**
     * Send Duplicate Notification to Nango Admins
     * @desc append the account and environment information to the notification content,
     * add the payload timestamp if available and send the notification to the Nango Admins
     * and with the action response update the slack timestamp to the notification
     * record. This is so future notifications can be sent as updates to the original
     */
    private sendDuplicateNotificationToNangoAdmins;
    /**
     * Update Notification with Timestamp
     * @desc used to keep the slack_timestamp up to date to be able to
     * send updates to the original notification
     */
    private updateNotificationWithTimestamp;
    /**
     * Update Notification with Admin Timestamp
     * @desc used to keep the admin_slack_timestamp up to date to be able to
     * send updates to the original notification
     */
    private updateNotificationWithAdminTimestamp;
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
    reportFailure(
        nangoConnection: NangoConnection,
        name: string,
        type: string,
        originalActivityLogId: number,
        environment_id: number,
        provider: string
    ): Promise<void>;
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
    reportResolution(
        nangoConnection: NangoConnection,
        syncName: string,
        type: string,
        originalActivityLogId: number | null,
        environment_id: number,
        provider: string,
        slack_timestamp: string,
        admin_slack_timestamp: string,
        connectionCount: number
    ): Promise<void>;
    /**
     * Has Open Notification
     * @desc Check if there is an open notification for the given name
     * and environment id and if so return the necessary information to be able
     * to update the notification.
     */
    hasOpenNotification(
        nangoConnection: NangoConnection,
        name: string
    ): Promise<Pick<SlackNotification, 'id' | 'connection_list' | 'slack_timestamp' | 'admin_slack_timestamp'> | null>;
    /**
     * Create Notification
     * @desc create a new notification for the given name and environment id
     * and return the id of the created notification.
     */
    createNotification(nangoConnection: NangoConnection, name: string, type: string): Promise<Pick<SlackNotification, 'id'> | null>;
    /**
     * Add Failing Connection
     * @desc check if there is an open notification for the given name and environment id
     * and if so add the connection id to the connection list.
     */
    addFailingConnection(nangoConnection: NangoConnection, name: string, type: string): Promise<ServiceResponse<NotificationResponse>>;
    /**
     * Remove Failing Connection
     * @desc check if there is an open notification for the given name and environment id
     * and if so remove the connection id from the connection list and report
     * resolution to the slack channel.
     */
    removeFailingConnection(
        nangoConnection: NangoConnection,
        name: string,
        type: string,
        originalActivityLogId: number | null,
        environment_id: number,
        provider: string
    ): Promise<void>;
    closeAllOpenNotifications(environment_id: number): Promise<void>;
    private getLogUrl;
    private getMessage;
}
export {};
