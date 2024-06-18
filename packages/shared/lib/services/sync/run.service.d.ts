import type { Context } from '@temporalio/activity';
import type { NangoConnection } from '@nangohq/models/Connection.js';
import type { Account } from '@nangohq/models/Admin.js';
import type { Metadata, ErrorPayload } from '@nangohq/types';
import type { SyncType, IntegrationServiceInterface } from '@nangohq/models/Sync.js';
import type { ServiceResponse } from '@nangohq/models/Generic.js';
import type { Environment } from '@nangohq/models/Environment.js';
import type { LogContext } from '@nangohq/logs';
import type { UpsertSummary } from '@nangohq/records';
import type { SendSyncParams } from '@nangohq/webhooks';

import type { NangoProps } from '../../sdk/sync.js';
import type { SlackService } from '../notification/slack.service.js';
interface BigQueryClientInterface {
    insert(row: RunScriptRow): Promise<void>;
}
interface RunScriptRow {
    executionType: string;
    internalConnectionId: number | undefined;
    connectionId: string;
    accountId: number | undefined;
    accountName: string;
    scriptName: string;
    scriptType: string;
    environmentId: number;
    environmentName: string;
    providerConfigKey: string;
    status: string;
    syncId: string;
    content: string;
    runTimeInSeconds: number;
    createdAt: number;
}
export declare type SyncRunConfig = {
    bigQueryClient?: BigQueryClientInterface;
    integrationService: IntegrationServiceInterface;
    recordsService: RecordsServiceInterface;
    dryRunService?: NangoProps['dryRunService'];
    isAction?: boolean;
    isInvokedImmediately?: boolean;
    isWebhook?: boolean;
    isPostConnectionScript?: boolean;
    nangoConnection: NangoConnection;
    syncName: string;
    syncType: SyncType;
    syncId?: string;
    syncJobId?: number;
    provider?: string;
    loadLocation?: string;
    fileLocation?: string;
    debug?: boolean;
    input?: object;
    logMessages?:
        | {
              counts: {
                  updated: number;
                  added: number;
                  deleted: number;
              };
              messages: unknown[];
          }
        | undefined;
    stubbedMetadata?: Metadata | undefined;
    account?: Account;
    environment?: Environment;
    temporalContext?: Context;
} & (
    | {
          writeToDb: true;
          activityLogId: number;
          logCtx: LogContext;
          slackService: SlackService;
          sendSyncWebhook: (params: SendSyncParams) => Promise<void>;
      }
    | {
          writeToDb: false;
      }
);
export interface RecordsServiceInterface {
    markNonCurrentGenerationRecordsAsDeleted({
        connectionId,
        model,
        syncId,
        generation
    }: {
        connectionId: number;
        model: string;
        syncId: string;
        generation: number;
    }): Promise<string[]>;
}
export default class SyncRun {
    bigQueryClient?: BigQueryClientInterface;
    integrationService: IntegrationServiceInterface;
    recordsService: RecordsServiceInterface;
    dryRunService?: NangoProps['dryRunService'];
    slackNotificationService?: SlackService;
    sendSyncWebhook?: (params: SendSyncParams) => Promise<void>;
    writeToDb: boolean;
    isAction: boolean;
    isPostConnectionScript: boolean;
    isInvokedImmediately: boolean;
    nangoConnection: NangoConnection;
    syncName: string;
    syncType: SyncType;
    syncId?: string;
    syncJobId?: number;
    activityLogId?: number;
    provider?: string;
    loadLocation?: string;
    fileLocation?: string;
    debug?: boolean;
    input?: object;
    logMessages?:
        | {
              counts: {
                  updated: number;
                  added: number;
                  deleted: number;
              };
              messages: unknown[];
          }
        | undefined;
    stubbedMetadata?: Metadata | undefined;
    account?: Account;
    environment?: Environment;
    temporalContext?: Context;
    isWebhook: boolean;
    logCtx?: LogContext;
    constructor(config: SyncRunConfig);
    run(
        optionalLastSyncDate?: Date | null,
        bypassEnvironment?: boolean,
        optionalSecretKey?: string,
        optionalHost?: string
    ): Promise<ServiceResponse<boolean | object>>;
    finishFlow(models: string[], syncStartDate: Date, version: string, totalRunTime: number, trackDeletes?: boolean): Promise<void>;
    reportResults(
        model: string,
        responseResults: UpsertSummary,
        index: number,
        numberOfModels: number,
        syncStartDate: Date,
        version: string,
        totalRunTime: number
    ): Promise<void>;
    reportFailureForResults({
        content,
        runTime,
        isCancel,
        models,
        syncStartDate,
        error
    }: {
        content: string;
        runTime: number;
        isCancel?: true;
        models: string[];
        syncStartDate: Date;
        error: ErrorPayload;
    }): Promise<void>;
    private determineExecutionType;
    private determineErrorType;
}
export {};
