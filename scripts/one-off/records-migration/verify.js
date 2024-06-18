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
const BATCH_SIZE = 1000;
const SOURCE_DB_URL = process.env['SOURCE_DB_URL'] || 'postgresql://nango:nango@localhost:5432/nango';
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
const TARGET_DB_URL = process.env['TARGET_DB_URL'] || 'postgresql://nango:nango@localhost:5432/nango';
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
const dirname = path.dirname(fileURLToPath(import.meta.url));
const checkpointFile = path.join(dirname, 'verify_checkpoint.json');
function readNewRecords(checkpoint, i) {
    const batchSize = BATCH_SIZE;
    return targetKnex
        .select(targetKnex.raw(`
                    id,
                    external_id,
                    json,
                    data_hash,
                    connection_id,
                    model,
                    sync_id,
                    sync_job_id,
                    to_json(created_at) as created_at,
                    to_json(updated_at) as updated_at,
                    to_json(deleted_at) as deleted_at,
                    updated_at as updated_at_raw
                `))
        .from(`nango_records.records_p${i}`)
        .where((builder) => {
        if (checkpoint.lastUpdatedAt && checkpoint.lastId) {
            builder.where(targetKnex.raw(`(updated_at, id) > (?, ?)`, [checkpoint.lastUpdatedAt, checkpoint.lastId]));
        }
    })
        .orderBy([
        { column: 'updated_at_raw', order: 'asc' },
        { column: 'id', order: 'asc' }
    ])
        .limit(batchSize);
}
function getDiffs(newRecords) {
    return __awaiter(this, void 0, void 0, function* () {
        const records = newRecords.map((record) => {
            const { updated_at_raw, json } = record, rest = __rest(record, ["updated_at_raw", "json"]);
            return rest;
        });
        const query = `SELECT t.* FROM (SELECT
            id,
            external_id,
            data_hash,
            connection_id,
            model,
            sync_id,
            sync_job_id,
            created_at::timestamp with time zone AS created_at,
            updated_at::timestamp with time zone AS updated_at,
            deleted_at::timestamp with time zone AS deleted_at
        FROM json_populate_recordset(NULL::record, '${JSON.stringify(records)}')
          	AS (id uuid, external_id character varying(255), data_hash character varying(255), connection_id integer, model character varying(255), sync_id uuid, sync_job_id integer, created_at timestamp with time zone, updated_at timestamp with time zone, deleted_at timestamp with time zone)) AS t
        LEFT JOIN nango._nango_sync_data_records AS r
          ON t.external_id = r.external_id
          AND t.model = r.model
          AND t.connection_id = r.nango_connection_id
        WHERE r.id IS NULL
          OR t.id <> r.id
          OR t.data_hash <> r.data_hash
          OR t.sync_id <> r.sync_id
          OR ABS(EXTRACT(EPOCH FROM (t.created_at - r.created_at))) > 30
          OR ABS(EXTRACT(EPOCH FROM (t.updated_at - r.updated_at))) > 30
          OR (t.deleted_at IS NULL AND r.external_deleted_at IS NOT NULL) OR (t.deleted_at IS NOT NULL AND r.external_deleted_at IS NULL)
          OR ABS(EXTRACT(EPOCH FROM (t.deleted_at - r.external_deleted_at))) > 30
    `;
        const result = yield sourceKnex.raw(query);
        return result.rows;
    });
}
function verify() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting verification...');
        console.log('Source DB:', SOURCE_DB_URL);
        console.log('Target DB:', TARGET_DB_URL);
        let checkpoint = yield getCheckpoint();
        let diffsCount = 0;
        for (let i = 0; i < 256; i++) {
            let more = true;
            while (more) {
                const start = Date.now();
                const newRecords = yield readNewRecords(checkpoint, i);
                if (newRecords.length === 0) {
                    more = false;
                    checkpoint = { lastUpdatedAt: null, lastId: null };
                    continue;
                }
                const lastRow = newRecords[newRecords.length - 1];
                checkpoint = { lastUpdatedAt: lastRow.updated_at, lastId: lastRow.id };
                const diffs = yield getDiffs(newRecords);
                diffsCount += diffs.length;
                if (diffs.length > 0) {
                    console.log(`Found ${diffs.length} diffs (total: ${diffsCount})): `, diffs.slice(0, 5));
                }
                const end = Date.now();
                console.log(`${newRecords.length} rows verified (parition ${i}) in ${end - start}ms. lastUpdatedAt: ${checkpoint.lastUpdatedAt}.`);
            }
        }
        console.log('Verification completed. Total diffs found: ', diffsCount);
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
                return { lastUpdatedAt: null, lastId: null };
            }
            throw error;
        }
    });
}
// time execution
const start = new Date();
verify()
    .catch((error) => {
    console.error('Error occurred during verification:', error);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield sourceKnex.destroy();
    yield targetKnex.destroy();
    const end = new Date();
    console.log('Execution took:', (end.getTime() - start.getTime()) / 1000, 's');
}));
//# sourceMappingURL=verify.js.map