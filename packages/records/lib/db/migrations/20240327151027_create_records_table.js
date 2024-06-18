var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const TABLE = 'records';
const PARTITION_COUNT = 256;
function partitionTable(i) {
    return `${TABLE}_p${i}`;
}
export function up(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        yield knex.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            // TABLE
            yield trx.raw(`
            CREATE TABLE "${TABLE}" (
            id uuid NOT NULL,
            external_id character varying(255) NOT NULL,
            json jsonb,
            data_hash character varying(255) NOT NULL,
            connection_id integer NOT NULL,
            model character varying(255) NOT NULL,
            created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
            deleted_at timestamp with time zone,
            sync_id uuid,
            sync_job_id integer
            ) PARTITION BY HASH (connection_id, model)
        `);
            for (let i = 0; i < PARTITION_COUNT; i++) {
                yield trx.raw(`
                CREATE TABLE "${partitionTable(i)}" PARTITION OF "${TABLE}"
                FOR VALUES WITH (MODULUS ${PARTITION_COUNT}, REMAINDER ${i});
            `);
            }
            // TRIGGERS
            yield trx.raw(`
             CREATE OR REPLACE FUNCTION ${TABLE}_undelete()
             RETURNS TRIGGER AS $$
             BEGIN
                 IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
                     NEW.created_at = NOW();
                     NEW.updated_at = NOW();
                 END IF;
                 RETURN NEW;
             END;
             $$ LANGUAGE plpgsql;
        `);
            yield trx.raw(`
                     CREATE TRIGGER ${TABLE}_undelete_trigger
                     BEFORE UPDATE ON ${TABLE}
                     FOR EACH ROW
                     EXECUTE FUNCTION ${TABLE}_undelete();
        `);
            yield knex.raw(`
            CREATE OR REPLACE FUNCTION ${TABLE}_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                IF OLD.data_hash IS DISTINCT FROM NEW.data_hash THEN
                    NEW.updated_at = NOW();
                END IF;

                RETURN NEW;
            END;
          $$ LANGUAGE plpgsql;
        `);
            yield knex.raw(`
            CREATE TRIGGER ${TABLE}_updated_at_trigger
            BEFORE UPDATE ON ${TABLE}
            FOR EACH ROW
            EXECUTE FUNCTION ${TABLE}_updated_at();
        `);
            // INDEXES
            yield knex.schema.alterTable(TABLE, function (table) {
                table.unique(['connection_id', 'model', 'external_id']);
                table.index(['connection_id', 'model', 'updated_at', 'id']);
                table.index('sync_id');
                table.index('sync_job_id');
                table.unique(['connection_id', 'model', 'id']);
            });
        }));
    });
}
export function down(knex) {
    return __awaiter(this, void 0, void 0, function* () {
        // TABLE
        // INDEXES are dropped automatically
        yield knex.raw(`DROP TABLE IF EXISTS "${TABLE}"`);
        for (let i = 0; i < PARTITION_COUNT; i++) {
            yield knex.raw(`DROP TABLE IF EXISTS "${partitionTable(i)}"`);
        }
        // TRIGGERS
        yield knex.raw(`DROP TRIGGER IF EXISTS ${TABLE}_undelete_trigger ON ${TABLE};`);
        yield knex.raw(`DROP FUNCTION IF EXISTS ${TABLE}_undelete();`);
        yield knex.raw(`DROP TRIGGER IF EXISTS ${TABLE}_updated_at_trigger ON ${TABLE};`);
        yield knex.raw(`DROP FUNCTION IF EXISTS ${TABLE}_updated_at();`);
    });
}
//# sourceMappingURL=20240327151027_create_records_table.js.map