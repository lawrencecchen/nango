/// <reference types="react" />
import { Steps } from './utils';
export declare const WebhookBloc: React.FC<{
    step: Steps;
    connectionId: string;
    records: Record<string, unknown>[];
    onProgress: () => void;
}>;
