export interface Left<T, E extends Error> {
    error: E;
    isErr(this: Result<T, E>): this is Left<T, E>;
    isOk(this: Result<T, E>): this is Right<T, E>;
    unwrap(): T;
    map<U>(fn: (value: T) => U): Result<T, E>;
    mapError<U extends Error>(fn: (error: E) => U): Result<T, U>;
}
export interface Right<T, E extends Error> {
    value: T;
    isErr(this: Result<T, E>): this is Left<T, E>;
    isOk(this: Result<T, E>): this is Right<T, E>;
    unwrap(): T;
    map<U>(fn: (value: T) => U): Result<U, E>;
    mapError<U extends Error>(fn: (error: E) => U): Result<T, U>;
}
export declare type Result<T, E extends Error = Error> = Left<T, E> | Right<T, E>;
export declare function Ok<T, E extends Error>(value: T): Result<T, E>;
export declare function Err<T, E extends Error>(error: E | string): Result<T, E>;
