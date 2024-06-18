/// <reference types="react" />
import { Steps } from './utils';
export declare const ActionBloc: React.FC<{
    step: Steps;
    providerConfigKey: string;
    connectionId: string;
    secretKey: string;
    onProgress: () => void;
}>;
