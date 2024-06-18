import type { AxiosError, AxiosResponse } from 'axios';
import type { RecentlyCreatedConnection, Connection, ConnectionConfig, UserProvidedProxyConfiguration } from '@nangohq/shared';
import type { LogContextGetter } from '@nangohq/logs';
export interface InternalNango {
    getConnection: () => Promise<Connection>;
    proxy: ({ method, endpoint, data }: UserProvidedProxyConfiguration) => Promise<AxiosResponse | AxiosError>;
    updateConnectionConfig: (config: ConnectionConfig) => Promise<ConnectionConfig>;
}
declare function execute(createdConnection: RecentlyCreatedConnection, provider: string, logContextGetter: LogContextGetter): Promise<void>;
export default execute;
