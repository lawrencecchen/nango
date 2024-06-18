import type { Knex } from 'knex';
export declare const defaultSchema: string;
export declare function getDbConfig({ timeoutMs }: { timeoutMs: number }): Knex.Config;
