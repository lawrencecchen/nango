var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
function fetchPaginatedData(nango, portalId, limit = 50) {
    return __asyncGenerator(this, arguments, function* fetchPaginatedData_1() {
        let offset = 0;
        while (true) {
            const response = yield __await(nango.get({
                endpoint: '/contentsearch/v2/search',
                params: {
                    type: 'KNOWLEDGE_ARTICLE',
                    term: 'a_b_c_d_e_f_g_h_i_j_k_l_m_n_o_p_q_r_s_t_u_v_w_x_y_z',
                    portalId: portalId.toString(),
                    limit: limit.toString(),
                    offset: offset.toString()
                }
            }));
            if (!response.data || response.data.total === 0) {
                return yield __await(void 0);
            }
            yield yield __await(response.data.results);
            if (response.data.total <= offset + limit) {
                return yield __await(void 0);
            }
            offset += limit;
        }
    });
}
export default function fetchData(nango) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const portalResponse = yield nango.get({
            endpoint: '/integrations/v1/me'
        });
        if (!portalResponse.data || !portalResponse.data.portalId) {
            throw new Error('No portal id found');
        }
        try {
            for (var _b = __asyncValues(fetchPaginatedData(nango, portalResponse.data.portalId)), _c; _c = yield _b.next(), !_c.done;) {
                const pageData = _c.value;
                const kbs = [];
                for (const result of pageData) {
                    const response = yield nango.get({
                        endpoint: `/cms/v3/site-search/indexed-data/${result.id}`,
                        params: {
                            type: 'KNOWLEDGE_ARTICLE'
                        }
                    });
                    if (!response.data) {
                        continue;
                    }
                    const { data } = response;
                    kbs.push({
                        id: data === null || data === void 0 ? void 0 : data.id.toString(),
                        publishDate: data.fields.publishedDate.value,
                        title: data.fields['title_nested.en'].value,
                        content: data.fields['html_other_nested.en'].value,
                        description: data.fields['description_nested.en'].value,
                        category: data.fields['category_nested.en'].value
                    });
                }
                yield nango.batchSave(kbs, 'HubspotKnowledgeBase');
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
//# sourceMappingURL=knowledge-base.js.map