var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import Knex from 'knex';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const SOURCE_DB_URL = process.env['SOURCE_DB_URL'] || '';
const sourceKnex = Knex({
    client: 'pg',
    connection: {
        connectionString: SOURCE_DB_URL,
        ssl: 'no-verify',
        statement_timeout: 60000
    },
    pool: {
        min: 1,
        max: 10
    }
});
const TARGET_DB_URL = process.env['TARGET_DB_URL'] || '';
const targetKnex = Knex({
    client: 'pg',
    connection: {
        connectionString: TARGET_DB_URL,
        ssl: 'no-verify',
        statement_timeout: 60000
    },
    pool: {
        min: 1,
        max: 10
    }
});
const BATCH_SIZE = 1000;
const dirname = path.dirname(fileURLToPath(import.meta.url));
const checkpointFile = path.join(dirname, 'migrate_checkpoint.json');
function readRecords(checkpoint) {
    const batchSize = BATCH_SIZE;
    return sourceKnex
        .select(sourceKnex.raw(`
                    id,
                    external_id,
                    json,
                    data_hash,
                    nango_connection_id as connection_id,
                    model,
                    sync_id,
                    sync_job_id,
                    to_json(created_at) as created_at,
                    to_json(updated_at) as updated_at,
                    to_json(external_deleted_at) as deleted_at,
                    created_at as created_at_raw
                `))
        .from(`nango._nango_sync_data_records`)
        .where((builder) => {
        if (checkpoint.lastCreatedAt && checkpoint.lastId) {
            builder.where(sourceKnex.raw(`(created_at, id) > (?, ?)`, [checkpoint.lastCreatedAt, checkpoint.lastId]));
        }
    })
        .orderBy([
        { column: 'created_at_raw', order: 'asc' },
        { column: 'id', order: 'asc' }
    ])
        .limit(batchSize);
}
function writeRecords(records) {
    return targetKnex
        .insert(records)
        .into(`nango_records.records`)
        .onConflict(['connection_id', 'model', 'external_id'])
        .merge()
        .returning(['id', 'created_at']);
}
function migrate() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting records migration...');
        console.log('Source DB:', SOURCE_DB_URL);
        console.log('Target DB:', TARGET_DB_URL);
        let checkpoint = yield getCheckpoint();
        const more = true;
        let records = undefined;
        while (more) {
            const startRead = Date.now();
            if (!records) {
                records = yield readRecords(checkpoint);
            }
            if (records.length === 0) {
                console.log('No rows to migrate. Sleeping...');
                yield new Promise((resolve) => setTimeout(resolve, 2000));
                records = undefined;
                continue;
            }
            const toInsert = records.map((record) => {
                const { created_at_raw } = record, rest = __rest(record, ["created_at_raw"]);
                return rest;
            });
            const lastRow = toInsert[toInsert.length - 1];
            checkpoint = { lastCreatedAt: lastRow.created_at, lastId: lastRow.id };
            const [res, nextRecords] = yield Promise.all([writeRecords(toInsert), readRecords(checkpoint)]);
            records = nextRecords;
            const endWrite = Date.now();
            try {
                yield saveCheckpoint(checkpoint);
                console.log(`${res.length} rows migrated in ${endWrite - startRead}ms. lastCreatedAt: ${checkpoint.lastCreatedAt}.`);
            }
            catch (error) {
                console.error('Error saving checkpoint:', error);
                process.exit(1);
            }
        }
        console.log('Data migration completed');
    });
}
function getCheckpoint() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield fs.promises.readFile(checkpointFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            if (error['code'] == 'ENOENT') {
                return { lastCreatedAt: null, lastId: null };
            }
            throw error;
        }
    });
}
function saveCheckpoint(checkpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fs.promises.writeFile(checkpointFile, JSON.stringify(checkpoint));
    });
}
// time execution
const start = new Date();
migrate()
    .catch((error) => {
    console.error('Error occurred during data migration:', error);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield sourceKnex.destroy();
    yield targetKnex.destroy();
    const end = new Date();
    console.log('Execution took:', (end.getTime() - start.getTime()) / 1000, 's');
}));
//# sourceMappingURL=migrate.js.map