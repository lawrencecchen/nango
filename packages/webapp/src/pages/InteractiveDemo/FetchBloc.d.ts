/// <reference types="react" />
import { Steps } from './utils';
export declare const FetchBloc: React.FC<{
    step: Steps;
    providerConfigKey: string;
    connectionId: string;
    secretKey: string;
    records: Record<string, unknown>[];
    onProgress: (records: Record<string, unknown>[]) => void;
}>;
