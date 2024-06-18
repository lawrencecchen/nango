var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isEnterprise, env, getLogger } from '@nangohq/utils';
import { createKVStore } from '@nangohq/kvstore';
import { RemoteRunner } from './remote.runner.js';
import { RenderRunner } from './render.runner.js';
import { LocalRunner } from './local.runner.js';
const logger = getLogger('Runner');
export var RunnerType;
(function (RunnerType) {
    RunnerType["Local"] = "local";
    RunnerType["Render"] = "render";
    RunnerType["Remote"] = "remote";
})(RunnerType = RunnerType || (RunnerType = {}));
export function getRunnerId(suffix) {
    return `${env}-runner-account-${suffix}`;
}
export function getOrStartRunner(runnerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const waitForRunner = function (runner) {
            return __awaiter(this, void 0, void 0, function* () {
                const timeoutMs = isEnterprise ? 60000 : 5000;
                let healthCheck = false;
                const startTime = Date.now();
                while (!healthCheck && Date.now() - startTime < timeoutMs) {
                    try {
                        yield runner.client.health.query();
                        healthCheck = true;
                    }
                    catch (_a) {
                        yield new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                }
                if (!healthCheck) {
                    throw new Error(`Runner '${runnerId}' hasn't started after ${timeoutMs}ms,`);
                }
            });
        };
        const cachedRunner = yield runnersCache.get(runnerId);
        if (cachedRunner) {
            try {
                yield waitForRunner(cachedRunner);
                return cachedRunner;
            }
            catch (err) {
                logger.error(err);
            }
        }
        const isRender = process.env['IS_RENDER'] === 'true';
        let runner;
        if (isRender) {
            runner = yield RenderRunner.getOrStart(runnerId);
        }
        else {
            runner = yield LocalRunner.getOrStart(runnerId);
        }
        yield waitForRunner(runner);
        yield runnersCache.set(runner);
        return runner;
    });
}
export function suspendRunner(runnerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const isRender = process.env['IS_RENDER'] === 'true';
        if (isRender) {
            // we only suspend render runners
            const runner = yield RenderRunner.get(runnerId);
            if (runner) {
                yield runner.suspend();
            }
        }
        yield runnersCache.delete(runnerId);
    });
}
// Caching the runners to minimize calls made to Render api
// and to better handle Render rate limits and potential downtime
class RunnerCache {
    constructor(store) {
        this.store = store;
    }
    cacheKey(s) {
        return `jobs:runner:${s}`;
    }
    get(runnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cached = yield this.store.get(this.cacheKey(runnerId));
                if (cached) {
                    const obj = JSON.parse(cached);
                    switch (obj.runnerType) {
                        case RunnerType.Local:
                            return LocalRunner.fromJSON(obj);
                        case RunnerType.Render:
                            return RenderRunner.fromJSON(obj);
                        case RunnerType.Remote:
                            return RemoteRunner.fromJSON(obj);
                    }
                }
                return undefined;
            }
            catch (_a) {
                return undefined;
            }
        });
    }
    set(runner) {
        return __awaiter(this, void 0, void 0, function* () {
            const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days
            yield this.store.set(this.cacheKey(runner.id), JSON.stringify(runner), { canOverride: true, ttlInMs: ttl });
        });
    }
    delete(runnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.store.delete(runnerId);
        });
    }
}
const runnersCache = await (() => __awaiter(void 0, void 0, void 0, function* () {
    const store = yield createKVStore();
    return new RunnerCache(store);
}))();
//# sourceMappingURL=runner.js.map