export interface ApiError<TCode extends string, TErrors = undefined, P = unknown> {
    error: {
        code: TCode;
        message?: string | undefined;
        errors?: TErrors;
        payload?: P;
    };
}
export interface ValidationError {
    code: string;
    message: string;
    path: (string | number)[];
}

export type ResDefaultErrors =
    | ApiError<'not_found'>
    | ApiError<'invalid_query_params', ValidationError[]>
    | ApiError<'invalid_body', ValidationError[]>
    | ApiError<'invalid_uri_params', ValidationError[]>
    | ApiError<'feature_disabled'>
    | ApiError<'missing_auth_header'>
    | ApiError<'generic_error_support', undefined, string>;

export type EndpointMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
/**
 * API Request/Response type
 */
export interface EndpointDefinition {
    Method: EndpointMethod;
    Path: string;
    Params?: Record<string, unknown>;
    Body?: Record<string, unknown>;
    Querystring?: Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    Error?: ApiError<string> | never;
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    Success: Record<string, unknown> | never;
}
export interface Endpoint<T extends EndpointDefinition> {
    // ------------
    // ------------ Request
    Method: T['Method'];
    Path: T['Path'];
    /**
     * URL params
     */
    Params: T['Params'] extends Record<string, unknown> ? T['Params'] : never;

    /**
     * URL query string
     */
    Querystring: T['Querystring'] extends Record<string, unknown> ? T['Querystring'] : never;

    /**
     * Helpers: Querystring + Params
     */
    QP: (T['Params'] extends Record<string, unknown> ? T['Params'] : never) & (T['Querystring'] extends Record<string, unknown> ? T['Querystring'] : never);

    /**
     * Received body
     */
    Body: T['Body'] extends Record<string, unknown> ? T['Body'] : never;

    // ------------
    // ------------ Response
    /**
     * Response body for success
     */
    Success: T['Success'];

    /**
     * Response body for any error
     */
    Errors: T['Error'] extends ApiError<string> ? ResDefaultErrors | T['Error'] : ResDefaultErrors;

    /**
     * Response body (success + error)
     */
    Reply: ResDefaultErrors | (T['Error'] extends ApiError<string> ? T['Error'] | T['Success'] : T['Success']);
}

export interface ErrorPayload {
    type: string;
    description: string;
}
