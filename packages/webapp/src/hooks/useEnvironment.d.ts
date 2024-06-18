export declare function useEnvironment(env: string): {
    loading: boolean;
    error: any;
    environmentAndAccount: EnvironmentAndAccount;
    mutate: import('swr/_internal').KeyedMutator<{
        environmentAndAccount: EnvironmentAndAccount;
    }>;
};
