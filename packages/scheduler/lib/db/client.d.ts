import knex from 'knex';
export declare class DatabaseClient {
    db: knex.Knex;
    schema: string;
    url: string;
    private config;
    constructor({ url, schema, poolMax }: { url: string; schema: string; poolMax?: number });
    migrate(): Promise<void>;
    /*********************************/
    /*********************************/
    clearDatabase(): Promise<void>;
}
