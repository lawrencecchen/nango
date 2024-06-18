import type { Result } from '@nangohq/utils';
import type { JsonValue } from 'type-fest';

import type {
    ClientError,
    ImmediateProps,
    ExecuteActionProps,
    ExecuteReturn,
    ExecuteWebhookProps,
    ExecutePostConnectionProps,
    OrchestratorTask,
    RecurringProps,
    ExecuteSyncProps,
    VoidReturn,
    SchedulesReturn
} from './types.js';
export declare class OrchestratorClient {
    private baseUrl;
    constructor({ baseUrl }: { baseUrl: string });
    private routeFetch;
    immediate(props: ImmediateProps): Promise<
        Result<
            {
                taskId: string;
            },
            ClientError
        >
    >;
    recurring(props: RecurringProps): Promise<
        Result<
            {
                scheduleId: string;
            },
            ClientError
        >
    >;
    pauseSync({ scheduleName }: { scheduleName: string }): Promise<VoidReturn>;
    unpauseSync({ scheduleName }: { scheduleName: string }): Promise<VoidReturn>;
    deleteSync({ scheduleName }: { scheduleName: string }): Promise<VoidReturn>;
    private setSyncState;
    updateSyncFrequency({ scheduleName, frequencyMs }: { scheduleName: string; frequencyMs: number }): Promise<VoidReturn>;
    executeSync(props: ExecuteSyncProps): Promise<VoidReturn>;
    private execute;
    executeAction(props: ExecuteActionProps): Promise<ExecuteReturn>;
    executeWebhook(props: ExecuteWebhookProps): Promise<ExecuteReturn>;
    executePostConnection(props: ExecutePostConnectionProps): Promise<ExecuteReturn>;
    searchTasks({ ids, groupKey, limit }: { ids?: string[]; groupKey?: string; limit?: number }): Promise<Result<OrchestratorTask[], ClientError>>;
    searchSchedules({ scheduleNames, limit }: { scheduleNames: string[]; limit: number }): Promise<SchedulesReturn>;
    dequeue({ groupKey, limit, longPolling }: { groupKey: string; limit: number; longPolling: boolean }): Promise<Result<OrchestratorTask[], ClientError>>;
    heartbeat({ taskId }: { taskId: string }): Promise<Result<void, ClientError>>;
    succeed({ taskId, output }: { taskId: string; output: JsonValue }): Promise<Result<OrchestratorTask, ClientError>>;
    failed({ taskId, error }: { taskId: string; error: Error }): Promise<Result<OrchestratorTask, ClientError>>;
    cancel({ taskId, reason }: { taskId: string; reason: string }): Promise<Result<OrchestratorTask, ClientError>>;
}
