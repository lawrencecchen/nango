import type { AxiosError, AxiosResponse } from 'axios';

import type { ServiceResponse } from '../models/Generic.js';
import type { ApplicationConstructedProxyConfiguration, UserProvidedProxyConfiguration, InternalProxyConfiguration } from '../models/Proxy.js';
import type { ActivityLogMessage } from '../models/Activity.js';
interface Activities {
    activityLogs: ActivityLogMessage[];
}
interface RouteResponse {
    response: AxiosResponse | AxiosError;
}
interface RetryHandlerResponse {
    shouldRetry: boolean;
}
declare class ProxyService {
    route(
        externalConfig: ApplicationConstructedProxyConfiguration | UserProvidedProxyConfiguration,
        internalConfig: InternalProxyConfiguration
    ): Promise<RouteResponse & Activities>;
    configure(
        externalConfig: ApplicationConstructedProxyConfiguration | UserProvidedProxyConfiguration,
        internalConfig: InternalProxyConfiguration
    ): ServiceResponse<ApplicationConstructedProxyConfiguration> & Activities;
    retryHandler: (
        activityLogId: number | null,
        environment_id: number,
        error: AxiosError,
        type: 'at' | 'after',
        retryHeader: string
    ) => Promise<RetryHandlerResponse & Activities>;
    /**
     * Retry
     * @desc if retries are set the retry function to determine if retries are
     * actually kicked off or not
     * @param {AxiosError} error
     * @param {attemptNumber} number
     */
    retry: (
        activityLogId: number | null,
        environment_id: number,
        config: ApplicationConstructedProxyConfiguration,
        activityLogs: ActivityLogMessage[],
        error: AxiosError,
        attemptNumber: number
    ) => Promise<boolean>;
    /**
     * Send to http method
     * @desc route the call to a HTTP request based on HTTP method passed in
     * @param {Request} req Express request object
     * @param {Response} res Express response object
     * @param {NextFuncion} next callback function to pass control to the next middleware function in the pipeline.
     * @param {HTTP_VERB} method
     * @param {ApplicationConstructedProxyConfiguration} configBody
     */
    private sendToHttpMethod;
    stripSensitiveHeaders(
        headers: ApplicationConstructedProxyConfiguration['headers'],
        config: ApplicationConstructedProxyConfiguration
    ): {
        [x: string]: string;
    };
    private request;
    /**
     * Construct URL
     * @param {ApplicationConstructedProxyConfiguration} config
     *
     */
    constructUrl(config: ApplicationConstructedProxyConfiguration): string;
    /**
     * Construct Headers
     * @param {ApplicationConstructedProxyConfiguration} config
     */
    constructHeaders(config: ApplicationConstructedProxyConfiguration): {};
    private handleResponse;
    private reportError;
    private handleErrorResponse;
}
declare const _default: ProxyService;
export default _default;
