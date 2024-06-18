/// <reference types="node" resolution-mode="require"/>
import superjson from 'superjson';
export declare const t: {
    _config: import('@trpc/server').RootConfig<{
        ctx: object;
        meta: object;
        errorShape: never;
        transformer: typeof superjson;
    }>;
    procedure: import('@trpc/server').ProcedureBuilder<{
        _config: import('@trpc/server').RootConfig<{
            ctx: object;
            meta: object;
            errorShape: never;
            transformer: typeof superjson;
        }>;
        _ctx_out: object;
        _input_in: typeof import('@trpc/server').unsetMarker;
        _input_out: typeof import('@trpc/server').unsetMarker;
        _output_in: typeof import('@trpc/server').unsetMarker;
        _output_out: typeof import('@trpc/server').unsetMarker;
        _meta: object;
    }>;
    middleware: <
        TNewParams extends import('@trpc/server').ProcedureParams<import('@trpc/server').AnyRootConfig, unknown, unknown, unknown, unknown, unknown, unknown>
    >(
        fn: import('@trpc/server').MiddlewareFunction<
            {
                _config: import('@trpc/server').RootConfig<{
                    ctx: object;
                    meta: object;
                    errorShape: never;
                    transformer: typeof superjson;
                }>;
                _ctx_out: {};
                _input_out: typeof import('@trpc/server').unsetMarker;
                _input_in: unknown;
                _output_in: unknown;
                _output_out: unknown;
                _meta: object;
            },
            TNewParams
        >
    ) => import('@trpc/server').MiddlewareBuilder<
        {
            _config: import('@trpc/server').RootConfig<{
                ctx: object;
                meta: object;
                errorShape: never;
                transformer: typeof superjson;
            }>;
            _ctx_out: {};
            _input_out: typeof import('@trpc/server').unsetMarker;
            _input_in: unknown;
            _output_in: unknown;
            _output_out: unknown;
            _meta: object;
        },
        TNewParams
    >;
    router: <TProcRouterRecord extends import('@trpc/server').ProcedureRouterRecord>(
        procedures: TProcRouterRecord
    ) => import('@trpc/server').CreateRouterInner<
        import('@trpc/server').RootConfig<{
            ctx: object;
            meta: object;
            errorShape: never;
            transformer: typeof superjson;
        }>,
        TProcRouterRecord
    >;
    mergeRouters: typeof import('@trpc/server').mergeRouters;
};
declare const appRouter: import('@trpc/server').CreateRouterInner<
    import('@trpc/server').RootConfig<{
        ctx: object;
        meta: object;
        errorShape: never;
        transformer: typeof superjson;
    }>,
    {
        health: import('@trpc/server').BuildProcedure<
            'query',
            {
                _config: import('@trpc/server').RootConfig<{
                    ctx: object;
                    meta: object;
                    errorShape: never;
                    transformer: typeof superjson;
                }>;
                _ctx_out: object;
                _input_in: typeof import('@trpc/server').unsetMarker;
                _input_out: typeof import('@trpc/server').unsetMarker;
                _output_in: typeof import('@trpc/server').unsetMarker;
                _output_out: typeof import('@trpc/server').unsetMarker;
                _meta: object;
            },
            {
                status: string;
            }
        >;
        idle: import('@trpc/server').BuildProcedure<
            'mutation',
            {
                _config: import('@trpc/server').RootConfig<{
                    ctx: object;
                    meta: object;
                    errorShape: never;
                    transformer: typeof superjson;
                }>;
                _meta: object;
                _ctx_out: object;
                _input_in: {
                    runnerId?: string;
                    idleTimeMs?: number;
                };
                _input_out: {
                    runnerId?: string;
                    idleTimeMs?: number;
                };
                _output_in: typeof import('@trpc/server').unsetMarker;
                _output_out: typeof import('@trpc/server').unsetMarker;
            },
            {
                status: string;
            }
        >;
    }
>;
export declare type AppRouter = typeof appRouter;
export declare const server: {
    server: import('http').Server<typeof import('http').IncomingMessage, typeof import('http').ServerResponse>;
    listen: (
        port?: number,
        hostname?: string
    ) => {
        port: number;
    };
};
export {};
