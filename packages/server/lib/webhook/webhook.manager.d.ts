import type { LogContextGetter } from '@nangohq/logs';
declare function execute(
    environmentUuid: string,
    providerConfigKey: string,
    headers: Record<string, any>,
    body: any,
    rawBody: string,
    logContextGetter: LogContextGetter
): Promise<unknown>;
export default execute;
