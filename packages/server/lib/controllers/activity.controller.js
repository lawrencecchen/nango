var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { activityFilter, getAllSyncAndActionNames, getTopLevelLogByEnvironment, getLogMessagesForLogs } from '@nangohq/shared';
class ActivityController {
    retrieve(req, res, next) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const limit = req.query['limit'] ? parseInt(req.query['limit']) : 20;
                const offset = req.query['offset'] ? parseInt(req.query['offset']) : 0;
                const status = (_a = req.query['status']) === null || _a === void 0 ? void 0 : _a.toString();
                const script = (_b = req.query['script']) === null || _b === void 0 ? void 0 : _b.toString();
                const connection = (_c = req.query['connection']) === null || _c === void 0 ? void 0 : _c.toString();
                const integration = (_d = req.query['integration']) === null || _d === void 0 ? void 0 : _d.toString();
                const date = (_e = req.query['date']) === null || _e === void 0 ? void 0 : _e.toString();
                const { environment } = res.locals;
                const logs = yield getTopLevelLogByEnvironment(environment.id, limit, offset, { status, script, connection, integration, date });
                res.send(logs);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getMessages(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const rawLogIds = req.query['logIds'];
                if (typeof rawLogIds !== 'string') {
                    res.status(400).send({ message: 'Missing logsIds parameter' });
                    return;
                }
                const logIds = new Set();
                // Deduplicate and exclude NaN
                for (const logId of rawLogIds.split(',')) {
                    const parsed = parseInt(logId, 10);
                    if (parsed) {
                        logIds.add(parsed);
                    }
                }
                if (logIds.size <= 0) {
                    res.send([]);
                    return;
                }
                const { environment } = res.locals;
                const logs = yield getLogMessagesForLogs(Array.from(logIds.values()), environment.id);
                res.send(logs);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getPossibleFilters(_, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { environment } = res.locals;
                const scripts = yield getAllSyncAndActionNames(environment.id);
                const integrations = yield activityFilter(environment.id, 'provider_config_key');
                const connections = yield activityFilter(environment.id, 'connection_id');
                res.send({ scripts, integrations, connections });
            }
            catch (error) {
                next(error);
            }
        });
    }
}
export default new ActivityController();
//# sourceMappingURL=activity.controller.js.map