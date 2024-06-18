import type { AxiosResponse } from 'axios';

import type { Pagination, UserProvidedProxyConfiguration, CursorPagination, OffsetPagination, LinkPagination } from '../models/Proxy.js';
declare class PaginationService {
    validateConfiguration(paginationConfig: Pagination): void;
    cursor<T>(
        config: UserProvidedProxyConfiguration,
        paginationConfig: CursorPagination,
        updatedBodyOrParams: Record<string, any>,
        passPaginationParamsInBody: boolean,
        proxy: (config: UserProvidedProxyConfiguration) => Promise<AxiosResponse>
    ): AsyncGenerator<T[], undefined, void>;
    link<T>(
        config: UserProvidedProxyConfiguration,
        paginationConfig: LinkPagination,
        updatedBodyOrParams: Record<string, any>,
        passPaginationParamsInBody: boolean,
        proxy: (config: UserProvidedProxyConfiguration) => Promise<AxiosResponse>
    ): AsyncGenerator<T[], undefined, void>;
    offset<T>(
        config: UserProvidedProxyConfiguration,
        paginationConfig: OffsetPagination,
        updatedBodyOrParams: Record<string, any>,
        passPaginationParamsInBody: boolean,
        proxy: (config: UserProvidedProxyConfiguration) => Promise<AxiosResponse>
    ): AsyncGenerator<T[], undefined, void>;
    private updateConfigBodyOrParams;
    private getNextPageLinkFromBodyOrHeaders;
}
declare const _default: PaginationService;
export default _default;
