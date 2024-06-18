var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import superjson from 'superjson';
import { z } from 'zod';
import { getLogger } from '@nangohq/utils';
import { suspendRunner } from './runner/runner.js';
const logger = getLogger('Jobs');
export const t = initTRPC.create({
    transformer: superjson
});
const router = t.router;
const publicProcedure = t.procedure;
// TODO: add logging middleware
const appRouter = router({
    health: healthProcedure(),
    idle: idleProcedure()
});
export const server = createHTTPServer({
    router: appRouter
});
function healthProcedure() {
    return publicProcedure.query(() => {
        return { status: 'ok' };
    });
}
function idleProcedure() {
    return publicProcedure.input(z.object({ runnerId: z.string().nonempty(), idleTimeMs: z.number() })).mutation(({ input }) => __awaiter(this, void 0, void 0, function* () {
        const { runnerId, idleTimeMs } = input;
        logger.info(`[runner ${runnerId}]: idle for ${idleTimeMs}ms. Suspending...`);
        yield suspendRunner(runnerId);
        return { status: 'ok' };
    }));
}
//# sourceMappingURL=server.js.map