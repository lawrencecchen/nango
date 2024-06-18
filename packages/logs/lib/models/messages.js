var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { errors } from '@elastic/elasticsearch';
import { isTest } from '@nangohq/utils';
import { getFullIndexName, createCursor, parseCursor } from './helpers.js';
import { indexMessages } from '../es/schema.js';
import { client } from '../es/client.js';
export const ResponseError = errors.ResponseError;
/**
 * Create one message
 */
export function createMessage(row) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield client.create({
            index: indexMessages.index,
            id: row.id,
            document: row,
            refresh: row.operation ? true : isTest,
            pipeline: `daily.${indexMessages.index}`
        });
        return { index: res._index };
    });
}
/**
 * List operations
 */
export function listOperations(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = {
            bool: {
                must: [{ term: { accountId: opts.accountId } }],
                must_not: { exists: { field: 'parentId' } },
                should: []
            }
        };
        if (opts.environmentId) {
            query.bool.must.push({ term: { environmentId: opts.environmentId } });
        }
        if (opts.states && (opts.states.length > 1 || opts.states[0] !== 'all')) {
            // Where or
            query.bool.must.push({
                bool: {
                    should: opts.states.map((state) => {
                        return { term: { state } };
                    })
                }
            });
        }
        if (opts.integrations && (opts.integrations.length > 1 || opts.integrations[0] !== 'all')) {
            // Where or
            query.bool.must.push({
                bool: {
                    should: opts.integrations.map((integration) => {
                        return { term: { 'integrationName.keyword': integration } };
                    })
                }
            });
        }
        if (opts.connections && (opts.connections.length > 1 || opts.connections[0] !== 'all')) {
            // Where or
            query.bool.must.push({
                bool: {
                    should: opts.connections.map((connection) => {
                        return { term: { 'connectionName.keyword': connection } };
                    })
                }
            });
        }
        if (opts.syncs && (opts.syncs.length > 1 || opts.syncs[0] !== 'all')) {
            // Where or
            query.bool.must.push({
                bool: {
                    should: opts.syncs.map((sync) => {
                        return { term: { 'syncConfigName.keyword': sync } };
                    })
                }
            });
        }
        if (opts.types && (opts.types.length > 1 || opts.types[0] !== 'all')) {
            const types = [];
            for (const couple of opts.types) {
                const [type, action] = couple.split(':');
                if (action && type) {
                    types.push({ bool: { must: [{ term: { 'operation.action': action } }, { term: { 'operation.type': type } }], should: [] } });
                }
                else if (type) {
                    types.push({ term: { 'operation.type': type } });
                }
            }
            // Where or
            query.bool.must.push({
                bool: {
                    should: types
                }
            });
        }
        if (opts.period) {
            query.bool.must.push({
                range: {
                    createdAt: { gte: opts.period.from, lte: opts.period.to }
                }
            });
        }
        const cursor = opts.cursor ? parseCursor(opts.cursor) : undefined;
        const res = yield client.search({
            index: indexMessages.index,
            size: opts.limit,
            sort: [{ createdAt: 'desc' }, 'id'],
            track_total_hits: true,
            search_after: cursor,
            query
        });
        const hits = res.hits;
        const total = typeof hits.total === 'object' ? hits.total.value : hits.hits.length;
        const totalPage = hits.hits.length;
        return {
            count: total,
            items: hits.hits.map((hit) => {
                return hit._source;
            }),
            cursor: totalPage > 0 && total > totalPage && opts.limit <= totalPage ? createCursor(hits.hits[hits.hits.length - 1]) : null
        };
    });
}
/**
 * Get a single operation
 */
export function getOperation(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        if (opts.indexName) {
            const res = yield client.get({ index: opts.indexName, id: opts.id });
            return res._source;
        }
        // Can't perform a getById because we don't know in which index the operation is in
        const res = yield client.search({
            index: indexMessages.index,
            size: 1,
            query: {
                term: { id: opts.id }
            }
        });
        if (res.hits.hits.length <= 0) {
            throw new ResponseError({ statusCode: 404, warnings: [], meta: {} });
        }
        return res.hits.hits[0]._source;
    });
}
/**
 * Update a row (can be a partial update)
 */
export function update(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.update({
            index: getFullIndexName(indexMessages.index, opts.data.createdAt),
            id: opts.id,
            refresh: isTest,
            body: {
                doc: Object.assign(Object.assign({}, opts.data), { updatedAt: new Date().toISOString() })
            }
        });
    });
}
/**
 * Set an operation as currently running
 */
export function setRunning(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield update({ id: opts.id, data: { createdAt: opts.createdAt, state: 'running', startedAt: new Date().toISOString() } });
    });
}
/**
 * Set an operation as success
 */
export function setSuccess(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield update({ id: opts.id, data: { createdAt: opts.createdAt, state: 'success', endedAt: new Date().toISOString() } });
    });
}
/**
 * Set an operation as failed
 */
export function setFailed(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield update({ id: opts.id, data: { createdAt: opts.createdAt, state: 'failed', endedAt: new Date().toISOString() } });
    });
}
/**
 * Set an operation as failed
 */
export function setCancelled(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield update({ id: opts.id, data: { createdAt: opts.createdAt, state: 'cancelled', endedAt: new Date().toISOString() } });
    });
}
/**
 * Set an operation as timeout
 */
export function setTimeouted(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield update({ id: opts.id, data: { createdAt: opts.createdAt, state: 'timeout', endedAt: new Date().toISOString() } });
    });
}
/**
 * List messages
 */
export function listMessages(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = {
            bool: {
                must: [{ term: { parentId: opts.parentId } }],
                should: []
            }
        };
        if (opts.states && (opts.states.length > 1 || opts.states[0] !== 'all')) {
            // Where or
            query.bool.must.push({
                bool: {
                    should: opts.states.map((state) => {
                        return { term: { state } };
                    })
                }
            });
        }
        if (opts.search) {
            query.bool.must.push({
                match_phrase_prefix: { message: { query: opts.search } }
            });
        }
        // Sort and cursor
        let cursor;
        let sort = [{ createdAt: 'desc' }, { id: 'desc' }];
        if (opts.cursorBefore) {
            // search_before does not exists so we reverse the sort
            // https://github.com/elastic/elasticsearch/issues/29449
            cursor = parseCursor(opts.cursorBefore);
            sort = [{ createdAt: 'asc' }, { id: 'asc' }];
        }
        else if (opts.cursorAfter) {
            cursor = opts.cursorAfter ? parseCursor(opts.cursorAfter) : undefined;
        }
        const res = yield client.search({
            index: indexMessages.index,
            size: opts.limit,
            sort,
            track_total_hits: true,
            search_after: cursor,
            query
        });
        const hits = res.hits;
        const total = typeof hits.total === 'object' ? hits.total.value : hits.hits.length;
        const totalPage = hits.hits.length;
        const items = hits.hits.map((hit) => {
            return hit._source;
        });
        if (opts.cursorBefore) {
            // In case we set before we have to reverse the message since we inverted the sort
            items.reverse();
            return {
                count: total,
                items,
                cursorBefore: totalPage > 0 ? createCursor(hits.hits[hits.hits.length - 1]) : null,
                cursorAfter: null
            };
        }
        return {
            count: total,
            items,
            cursorBefore: totalPage > 0 ? createCursor(hits.hits[0]) : null,
            cursorAfter: totalPage > 0 && total > totalPage && totalPage >= opts.limit ? createCursor(hits.hits[hits.hits.length - 1]) : null
        };
    });
}
/**
 * List filters
 */
export function listFilters(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        let aggField;
        if (opts.category === 'integration') {
            aggField = 'integrationName';
        }
        else if (opts.category === 'connection') {
            aggField = 'connectionName';
        }
        else {
            aggField = 'syncConfigName';
        }
        const query = {
            bool: {
                must: [{ term: { accountId: opts.accountId } }, { term: { environmentId: opts.environmentId } }],
                must_not: { exists: { field: 'parentId' } },
                should: []
            }
        };
        if (opts.search) {
            query.bool.must.push({ match_phrase_prefix: { [aggField]: { query: opts.search } } });
        }
        const res = yield client.search({
            index: indexMessages.index,
            size: 0,
            track_total_hits: true,
            aggs: { byName: { terms: { field: `${aggField}.keyword`, size: opts.limit } } },
            query
        });
        const agg = res.aggregations['byName'];
        return {
            items: agg.buckets
        };
    });
}
export function setTimeoutForAll(opts = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.updateByQuery({
            index: indexMessages.index,
            wait_for_completion: opts.wait === true,
            refresh: opts.wait === true,
            query: {
                bool: {
                    filter: [
                        { range: { expiresAt: { lt: 'now' } } },
                        {
                            bool: {
                                should: [{ term: { state: 'waiting' } }, { term: { state: 'running' } }]
                            }
                        }
                    ],
                    must_not: { exists: { field: 'parentId' } },
                    should: []
                }
            },
            script: {
                source: "ctx._source.state = 'timeout'"
            }
        });
    });
}
//# sourceMappingURL=messages.js.map