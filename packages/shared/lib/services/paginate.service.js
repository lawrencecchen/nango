var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
import parseLinksHeader from 'parse-link-header';
import get from 'lodash-es/get.js';
import { PaginationType } from '../models/Proxy.js';
import { isValidHttpUrl } from '../utils/utils.js';
class PaginationService {
    validateConfiguration(paginationConfig) {
        if (!paginationConfig.type) {
            throw new Error('Pagination type is required');
        }
        const { type } = paginationConfig;
        if (type.toLowerCase() === PaginationType.CURSOR) {
            const cursorPagination = paginationConfig;
            if (!cursorPagination.cursor_name_in_request) {
                throw new Error('Param cursor_name_in_request is required for cursor pagination');
            }
            if (!cursorPagination.cursor_path_in_response) {
                throw new Error('Param cursor_path_in_response is required for cursor pagination');
            }
            if (paginationConfig.limit && !paginationConfig.limit_name_in_request) {
                throw new Error('Param limit_name_in_request is required for cursor pagination when limit is set');
            }
        }
        else if (type.toLowerCase() === PaginationType.LINK) {
            const linkPagination = paginationConfig;
            if (!linkPagination.link_rel_in_response_header && !linkPagination.link_path_in_response_body) {
                throw new Error('Either param link_rel_in_response_header or link_path_in_response_body is required for link pagination');
            }
        }
        else if (type.toLowerCase() === PaginationType.OFFSET) {
            const offsetPagination = paginationConfig;
            if (!offsetPagination.offset_name_in_request) {
                throw new Error('Param offset_name_in_request is required for offset pagination');
            }
        }
        else {
            throw new Error(`Pagination type ${type} is not supported. Only ${PaginationType.CURSOR}, ${PaginationType.LINK}, and ${PaginationType.OFFSET} pagination types are supported.`);
        }
    }
    cursor(config, paginationConfig, updatedBodyOrParams, passPaginationParamsInBody, proxy) {
        return __asyncGenerator(this, arguments, function* cursor_1() {
            const cursorPagination = paginationConfig;
            let nextCursor;
            while (true) {
                if (nextCursor) {
                    updatedBodyOrParams[cursorPagination.cursor_name_in_request] = nextCursor;
                }
                this.updateConfigBodyOrParams(passPaginationParamsInBody, config, updatedBodyOrParams);
                const response = yield __await(proxy(config));
                const responseData = cursorPagination.response_path ? get(response.data, cursorPagination.response_path) : response.data;
                if (!responseData || !responseData.length) {
                    return yield __await(void 0);
                }
                yield yield __await(responseData);
                nextCursor = get(response.data, cursorPagination.cursor_path_in_response);
                if (!nextCursor || nextCursor.trim().length === 0) {
                    return yield __await(void 0);
                }
            }
        });
    }
    link(config, paginationConfig, updatedBodyOrParams, passPaginationParamsInBody, proxy) {
        return __asyncGenerator(this, arguments, function* link_1() {
            const linkPagination = paginationConfig;
            this.updateConfigBodyOrParams(passPaginationParamsInBody, config, updatedBodyOrParams);
            while (true) {
                const response = yield __await(proxy(config));
                const responseData = paginationConfig.response_path ? get(response.data, paginationConfig.response_path) : response.data;
                if (!responseData.length) {
                    return yield __await(void 0);
                }
                yield yield __await(responseData);
                const nextPageLink = this.getNextPageLinkFromBodyOrHeaders(linkPagination, response, paginationConfig);
                if (!nextPageLink) {
                    return yield __await(void 0);
                }
                if (!isValidHttpUrl(nextPageLink)) {
                    // some providers only send path+query params in the link so we can immediately assign those to the endpoint
                    config.endpoint = nextPageLink;
                }
                else {
                    const url = new URL(nextPageLink);
                    config.endpoint = url.pathname + url.search;
                }
                delete config.params;
            }
        });
    }
    offset(config, paginationConfig, updatedBodyOrParams, passPaginationParamsInBody, proxy) {
        return __asyncGenerator(this, arguments, function* offset_1() {
            const offsetPagination = paginationConfig;
            const offsetParameterName = offsetPagination.offset_name_in_request;
            let offset = 0;
            while (true) {
                updatedBodyOrParams[offsetParameterName] = `${offset}`;
                this.updateConfigBodyOrParams(passPaginationParamsInBody, config, updatedBodyOrParams);
                const response = yield __await(proxy(config));
                const responseData = paginationConfig.response_path ? get(response.data, paginationConfig.response_path) : response.data;
                if (!responseData || !responseData.length) {
                    return yield __await(void 0);
                }
                yield yield __await(responseData);
                if (paginationConfig['limit'] && responseData.length < paginationConfig['limit']) {
                    return yield __await(void 0);
                }
                if (responseData.length < 1) {
                    // Last page was empty so no need to fetch further
                    return yield __await(void 0);
                }
                offset += responseData.length;
            }
        });
    }
    updateConfigBodyOrParams(passPaginationParamsInBody, config, updatedBodyOrParams) {
        passPaginationParamsInBody ? (config.data = updatedBodyOrParams) : (config.params = updatedBodyOrParams);
    }
    getNextPageLinkFromBodyOrHeaders(linkPagination, response, paginationConfig) {
        var _a;
        if (linkPagination.link_rel_in_response_header) {
            const linkHeader = parseLinksHeader(response.headers['link']);
            return (_a = linkHeader === null || linkHeader === void 0 ? void 0 : linkHeader[linkPagination.link_rel_in_response_header]) === null || _a === void 0 ? void 0 : _a.url;
        }
        else if (linkPagination.link_path_in_response_body) {
            return get(response.data, linkPagination.link_path_in_response_body);
        }
        throw Error(`Either 'link_rel_in_response_header' or 'link_path_in_response_body' should be specified for '${paginationConfig.type}' pagination`);
    }
}
export default new PaginationService();
//# sourceMappingURL=paginate.service.js.map