import type { BigQuery as BigQueryType } from '@google-cloud/bigquery';
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
declare class BigQueryClient {
    private client;
    private datasetName;
    private tableName;
    constructor({ datasetName, tableName }: { datasetName: string; tableName: string });
    static createInstance({ datasetName, tableName }: { datasetName?: string; tableName: string }): Promise<BigQueryClient>;
    private initialize;
    private createDataSet;
    private createTable;
    insert(data: RunScriptRow, tableName?: string): Promise<void>;
}
export { BigQueryClient, BigQueryType };
