import md5 from 'md5';
import * as uuid from 'uuid';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { Err, Ok } from '@nangohq/utils';
dayjs.extend(utc);
export const formatRecords = ({ data, connectionId, model, syncId, syncJobId, softDelete = false }) => {
    // hashing unique composite key (connection, model, external_id)
    // to generate stable record ids across script executions
    const stableId = (unencryptedData) => {
        const namespace = uuid.v5(`${connectionId}${model}`, uuid.NIL);
        return uuid.v5(`${connectionId}${model}${unencryptedData.id}`, namespace);
    };
    const formattedRecords = [];
    const now = new Date();
    for (const datum of data) {
        const data_hash = md5(JSON.stringify(datum));
        if (!datum) {
            break;
        }
        if (!datum['id']) {
            const error = new Error(`Missing id field in record: ${JSON.stringify(datum)}. Model: ${model}`);
            return Err(error);
        }
        const formattedRecord = {
            id: stableId(datum),
            json: datum,
            external_id: String(datum['id']),
            data_hash,
            model,
            connection_id: connectionId,
            sync_id: syncId,
            sync_job_id: syncJobId
        };
        if (softDelete) {
            const deletedAt = datum['deletedAt'];
            formattedRecord.updated_at = now;
            formattedRecord.deleted_at = deletedAt ? dayjs(deletedAt).toDate() : now;
        }
        else {
            formattedRecord.deleted_at = null;
        }
        formattedRecords.push(formattedRecord);
    }
    return Ok(formattedRecords);
};
//# sourceMappingURL=format.js.map