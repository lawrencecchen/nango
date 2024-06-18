import type { ConnectionList } from '@nangohq/server';
export declare function useConnections(env: string): {
    loading: boolean;
    error: any;
    data: {
        connections: ConnectionList[];
    };
    mutate: import('swr/_internal').KeyedMutator<{
        connections: ConnectionList[];
    }>;
    errorNotifications: number;
};
