var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import express from 'express';
import timeout from 'connect-timeout';
import { getJobsUrl, getPersistAPIUrl } from '@nangohq/shared';
import superjson from 'superjson';
import { RunnerMonitor } from './monitor.js';
import { exec } from './exec.js';
import { cancel } from './cancel.js';
export const t = initTRPC.create({
    transformer: superjson
});
const router = t.router;
const publicProcedure = t.procedure;
const appRouter = router({
    health: healthProcedure(),
    run: runProcedure(),
    cancel: cancelProcedure()
});
function healthProcedure() {
    return publicProcedure.query(() => {
        return { status: 'ok' };
    });
}
const runnerId = process.env['RUNNER_ID'] || '';
const jobsServiceUrl = ((_a = process.env['NOTIFY_IDLE_ENDPOINT']) === null || _a === void 0 ? void 0 : _a.replace(/\/idle$/, '')) || getJobsUrl(); // TODO: remove legacy NOTIFY_IDLE_ENDPOINT once all runners are updated with JOBS_SERVICE_URL env var
const persistServiceUrl = getPersistAPIUrl();
const usage = new RunnerMonitor({ runnerId, jobsServiceUrl, persistServiceUrl });
function runProcedure() {
    return publicProcedure
        .input((input) => input)
        .mutation(({ input }) => __awaiter(this, void 0, void 0, function* () {
        const { nangoProps, code, codeParams } = input;
        try {
            usage.track(nangoProps);
            return yield exec(nangoProps, input.isInvokedImmediately, input.isWebhook, code, codeParams);
        }
        finally {
            usage.untrack(nangoProps);
        }
    }));
}
function cancelProcedure() {
    return publicProcedure
        .input((input) => input)
        .mutation(({ input }) => {
        return cancel(input.syncId);
    });
}
export const server = express();
server.use(timeout('24h'));
server.use('/', trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: () => ({})
}));
server.use(haltOnTimedout);
function haltOnTimedout(req, _res, next) {
    if (!req.timedout)
        next();
}
//# sourceMappingURL=server.js.map