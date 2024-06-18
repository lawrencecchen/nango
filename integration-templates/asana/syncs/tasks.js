var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { toUser } from '../mappers/to-user.js';
import { toTask } from '../mappers/to-task.js';
export default function fetchData(nango) {
    var e_1, _a, e_2, _b, e_3, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const lastSyncDate = nango.lastSyncDate;
        try {
            for (var _d = __asyncValues(nango.paginate({ endpoint: '/api/1.0/workspaces', params: { limit: 100 }, retries: 10 })), _e; _e = yield _d.next(), !_e.done;) {
                const workspaces = _e.value;
                for (const workspace of workspaces) {
                    try {
                        for (var _f = (e_2 = void 0, __asyncValues(nango.paginate({
                            endpoint: '/api/1.0/projects',
                            params: { workspace: workspace.gid, limit: 100 },
                            retries: 10
                        }))), _g; _g = yield _f.next(), !_g.done;) {
                            const projects = _g.value;
                            for (const project of projects) {
                                const params = {
                                    project: project.gid,
                                    limit: '100',
                                    opt_fields: [
                                        'name',
                                        'resource_type',
                                        'completed',
                                        'due_on',
                                        'permalink_url',
                                        'name',
                                        'notes',
                                        'created_at',
                                        'modified_at',
                                        'assignee.name',
                                        'assignee.email',
                                        'assignee.photo'
                                    ].join(',')
                                };
                                if (lastSyncDate) {
                                    params['modified_since'] = lastSyncDate.toISOString();
                                }
                                try {
                                    for (var _h = (e_3 = void 0, __asyncValues(nango.paginate({ endpoint: '/api/1.0/tasks', params, retries: 10 }))), _j; _j = yield _h.next(), !_j.done;) {
                                        const tasks = _j.value;
                                        const normalizedTasks = tasks.map((task) => {
                                            return Object.assign(Object.assign({}, toTask(task)), { assignee: task.assignee ? toUser(task.assignee) : null });
                                        });
                                        yield nango.batchSave(normalizedTasks, 'Task');
                                    }
                                }
                                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                finally {
                                    try {
                                        if (_j && !_j.done && (_c = _h.return)) yield _c.call(_h);
                                    }
                                    finally { if (e_3) throw e_3.error; }
                                }
                            }
                        }
                    }
                    catch (e_2_1) { e_2 = { error: e_2_1 }; }
                    finally {
                        try {
                            if (_g && !_g.done && (_b = _f.return)) yield _b.call(_f);
                        }
                        finally { if (e_2) throw e_2.error; }
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) yield _a.call(_d);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
//# sourceMappingURL=tasks.js.map