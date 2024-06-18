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
export default function fetchData(nango) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        let totalRecords = 0;
        try {
            const endpoint = '/api/tasks/me';
            const config = {
                paginate: {
                    type: 'link',
                    link_path_in_response_body: 'data.paging.nextPage',
                    limit_name_in_request: 'limit',
                    response_path: 'data.tasks',
                    limit: 100
                }
            };
            try {
                for (var _b = __asyncValues(nango.paginate(Object.assign(Object.assign({}, config), { endpoint }))), _c; _c = yield _b.next(), !_c.done;) {
                    const task = _c.value;
                    const mappedTask = task.map(mapTask) || [];
                    // Save Task
                    const batchSize = mappedTask.length;
                    totalRecords += batchSize;
                    yield nango.log(`Saving batch of ${batchSize} task(s) (total task(s): ${totalRecords})`);
                    yield nango.batchSave(mappedTask, 'ZohoMailTask');
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        catch (error) {
            throw new Error(`Error in fetchData: ${error.message}`);
        }
    });
}
function mapTask(task) {
    return {
        id: task.id,
        serviceType: task.serviceType,
        modifiedTime: task.modifiedTime,
        resourceId: task.resourceId,
        attachments: task.attachments,
        statusStr: task.statusStr,
        statusValue: task.statusValue,
        description: task.description,
        project: task.project,
        isTaskPublished: task.isTaskPublished,
        title: task.title,
        createdAt: task.createdAt,
        portalId: task.portalId,
        serviceId: task.serviceId,
        owner: task.owner,
        assigneeList: task.assigneeList,
        dependency: task.dependency,
        subtasks: task.subtasks,
        priority: task.priority,
        tags: task.tags,
        followers: task.followers,
        namespaceId: task.namespaceId,
        dependents: task.dependents,
        assignee: task.assignee,
        serviceUniqId: task.serviceUniqId,
        depUniqId: task.depUniqId,
        status: task.status
    };
}
//# sourceMappingURL=tasks.js.map