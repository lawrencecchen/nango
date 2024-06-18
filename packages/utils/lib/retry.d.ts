interface RetryConfig {
    maxAttempts: number;
    delayMs: number | ((attempt: number) => number);
    retryIf: (error: Error) => boolean;
}
export declare function retry<T>(fn: () => T, config: RetryConfig): Promise<T>;
export {};
