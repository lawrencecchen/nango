interface Env {
    name: string;
}
interface State {
    env: string;
    baseUrl: string;
    envs: Env[];
    email: string;
    showInteractiveDemo: boolean;
    debugMode: boolean;
    setEnv: (value: string) => void;
    setEnvs: (envs: Env[]) => void;
    setBaseUrl: (value: string) => void;
    setEmail: (value: string) => void;
    setShowInteractiveDemo: (value: boolean) => void;
    setDebugMode: (value: boolean) => void;
}
export declare const useStore: import('zustand').UseBoundStore<import('zustand').StoreApi<State>>;
export {};
