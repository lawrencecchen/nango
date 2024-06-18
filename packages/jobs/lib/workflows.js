var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { CancellationScope, proxyActivities, isCancellation } from '@temporalio/workflow';
const SYNC_TIMEOUT = '24h';
const SYNC_MAX_ATTEMPTS = 3;
const ACTION_TIMEOUT = '15m';
const ACTION_MAX_ATTEMPTS = 1; // no retry
const WEBHOOK_TIMEOUT = '15m';
const WEBHOOK_MAX_ATTEMPTS = 3;
const { routeSync, scheduleAndRouteSync } = proxyActivities({
    // 1 hour to start so syncs are not evicted from the queue too soon
    // 24 hours to complete to allow for long running syncs
    scheduleToStartTimeout: '1h',
    startToCloseTimeout: SYNC_TIMEOUT,
    retry: {
        maximumAttempts: SYNC_MAX_ATTEMPTS
    },
    heartbeatTimeout: '30m'
});
const { runAction, reportFailure: reportActionFailure } = proxyActivities({
    // actions are more time sensitive, hence shorter timeout
    // actions are synchronous so no retry and fast eviction from the queue
    scheduleToStartTimeout: '1m',
    startToCloseTimeout: ACTION_TIMEOUT,
    retry: {
        maximumAttempts: ACTION_MAX_ATTEMPTS
    }
});
const { runWebhook, runPostConnectionScript } = proxyActivities({
    // webhook execution should be fast, hence shorter startToCloseTimeout
    // but we allow for longer time to start so events are not evicted too soon if system is busy
    scheduleToStartTimeout: '1h',
    startToCloseTimeout: WEBHOOK_TIMEOUT,
    retry: {
        maximumAttempts: WEBHOOK_MAX_ATTEMPTS
    }
});
const { cancelActivity, reportFailure } = proxyActivities({
    scheduleToStartTimeout: '5m',
    startToCloseTimeout: '30s',
    retry: {
        maximumAttempts: 3
    }
});
export function initialSync(args) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield routeSync(args);
        }
        catch (e) {
            if (isCancellation(e)) {
                yield CancellationScope.nonCancellable(() => cancelActivity(args));
                return false;
            }
            yield reportFailure(e, args, SYNC_TIMEOUT, SYNC_MAX_ATTEMPTS);
            return false;
        }
    });
}
export function continuousSync(args) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield scheduleAndRouteSync(args);
            return result;
        }
        catch (e) {
            if (isCancellation(e)) {
                yield CancellationScope.nonCancellable(() => cancelActivity(args));
                return { cancelled: true };
            }
            yield reportFailure(e, args, SYNC_TIMEOUT, SYNC_MAX_ATTEMPTS);
            return false;
        }
    });
}
export function action(args) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield runAction(args);
        }
        catch (err) {
            yield reportActionFailure(err, args, ACTION_TIMEOUT, ACTION_MAX_ATTEMPTS);
            return {
                success: false,
                error: {
                    type: 'nango_internal_error',
                    status: 500,
                    payload: { message: (_a = err.cause) === null || _a === void 0 ? void 0 : _a.message }
                },
                response: null
            };
        }
    });
}
export function webhook(args) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield runWebhook(args);
        }
        catch (err) {
            yield reportFailure(err, args, WEBHOOK_TIMEOUT, WEBHOOK_MAX_ATTEMPTS);
            return false;
        }
    });
}
export function postConnectionScript(args) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield runPostConnectionScript(args);
        }
        catch (err) {
            yield reportFailure(err, args, WEBHOOK_TIMEOUT, WEBHOOK_MAX_ATTEMPTS);
            return {
                success: false,
                error: {
                    type: 'nango_internal_error',
                    status: 500,
                    payload: { message: (_a = err.cause) === null || _a === void 0 ? void 0 : _a.message }
                },
                response: null
            };
        }
    });
}
//# sourceMappingURL=workflows.js.map