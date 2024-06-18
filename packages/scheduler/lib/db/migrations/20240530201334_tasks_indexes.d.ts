import type { Knex } from 'knex';
export declare const config: {
    transaction: boolean;
};
export declare function up(knex: Knex): Promise<void>;
export declare function down(knex: Knex): Promise<void>;
