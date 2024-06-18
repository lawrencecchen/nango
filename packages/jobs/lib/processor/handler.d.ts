import type { OrchestratorTask } from '@nangohq/nango-orchestrator';
import type { JsonValue } from 'type-fest';
import type { Result } from '@nangohq/utils';
export declare function handler(task: OrchestratorTask): Promise<Result<JsonValue>>;
