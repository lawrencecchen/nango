import type { Knex } from 'knex';
export declare class KnexDatabase {
    knex: Knex;
    constructor({ timeoutMs }?: { timeoutMs: number });
    /**
     * Not enabled by default because shared is imported by everything
     */
    enableMetrics(): void;
    migrate(directory: string): Promise<any>;
    schema(): string;
}
declare const db: KnexDatabase;
export default db;
export { db as database };
export declare const schema: () => Knex.QueryBuilder;
export declare const dbNamespace = '_nango_';
export type { Knex };
export declare const multipleMigrations: () => Promise<void>;
