/// <reference types="react" />
import { Steps } from './utils';
export declare const AuthorizeBloc: React.FC<{
    step: Steps;
    hostUrl: string;
    publicKey: string;
    providerConfigKey: string;
    connectionId: string;
    onProgress: (id: number) => Promise<void> | void;
}>;
