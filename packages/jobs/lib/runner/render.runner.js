var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getRunnerClient } from '@nangohq/nango-runner';
import { env, stringifyError } from '@nangohq/utils';
import { NodeEnv, getPersistAPIUrl } from '@nangohq/shared';
import tracer from 'dd-trace';
import { RenderAPI } from './render.api.js';
import { RunnerType } from './runner.js';
const jobsServiceUrl = process.env['JOBS_SERVICE_URL'] || 'http://localhost:3005';
const render = new RenderAPI(process.env['RENDER_API_KEY'] || '');
export class RenderRunner {
    constructor(id, url, serviceId) {
        this.id = id;
        this.url = url;
        this.serviceId = serviceId;
        this.runnerType = RunnerType.Render;
        this.client = getRunnerClient(this.url);
    }
    toJSON() {
        return { runnerType: this.runnerType, id: this.id, url: this.url, serviceId: this.serviceId };
    }
    static fromJSON(obj) {
        return new RenderRunner(obj.id, obj.url, obj.serviceId);
    }
    suspend() {
        return __awaiter(this, void 0, void 0, function* () {
            const span = tracer.startSpan('runner.suspend').setTag('serviceId', this.serviceId).setTag('runnerId', this.id);
            try {
                yield render.suspendService({ serviceId: this.serviceId });
            }
            finally {
                span.finish();
            }
        });
    }
    static get(runnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            let svc = null;
            const res = yield render.getServices({ name: runnerId, type: 'private_service', limit: '1' });
            if (res.data.length > 0) {
                svc = res.data[0].service;
                return new RenderRunner(runnerId, `http://${runnerId}`, svc.id);
            }
            return undefined;
        });
    }
    static getOrStart(runnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let svc = null;
                // check if runner exists, if not, create it
                let res = yield render.getServices({ name: runnerId, type: 'private_service', limit: '1' });
                if (res.data.length > 0) {
                    svc = res.data[0].service;
                }
                else {
                    const imageTag = env;
                    const ownerId = process.env['RUNNER_OWNER_ID'];
                    if (!ownerId) {
                        throw new Error('RUNNER_OWNER_ID is not set');
                    }
                    res = yield render.createService({
                        type: 'private_service',
                        name: runnerId,
                        ownerId: ownerId,
                        image: { ownerId: ownerId, imagePath: `nangohq/nango-runner:${imageTag}` },
                        serviceDetails: { env: 'image' },
                        envVars: [
                            { key: 'NODE_ENV', value: process.env['NODE_ENV'] || NodeEnv.Dev },
                            { key: 'NANGO_CLOUD', value: process.env['NANGO_CLOUD'] || 'true' },
                            { key: 'NODE_OPTIONS', value: '--max-old-space-size=384' },
                            { key: 'RUNNER_ID', value: runnerId },
                            { key: 'JOBS_SERVICE_URL', value: jobsServiceUrl },
                            { key: 'IDLE_MAX_DURATION_MS', value: `${25 * 60 * 60 * 1000}` },
                            { key: 'PERSIST_SERVICE_URL', value: getPersistAPIUrl() },
                            { key: 'NANGO_TELEMETRY_SDK', value: process.env['NANGO_TELEMETRY_SDK'] || 'false' },
                            { key: 'DD_ENV', value: process.env['DD_ENV'] || '' },
                            { key: 'DD_SITE', value: process.env['DD_SITE'] || '' },
                            { key: 'DD_TRACE_AGENT_URL', value: process.env['DD_TRACE_AGENT_URL'] || '' }
                        ]
                    });
                    svc = res.data.service;
                }
                if (!svc) {
                    throw new Error(`Unable to get/create runner instance ${runnerId}`);
                }
                // check if runner is suspended, if so, resume it
                if (svc.suspended === 'suspended') {
                    const span = tracer.startSpan('runner.resume').setTag('serviceId', svc.id).setTag('runnerId', runnerId);
                    try {
                        yield render.resumeService({ serviceId: svc.id });
                    }
                    finally {
                        span.finish();
                    }
                }
                return new RenderRunner(runnerId, `http://${runnerId}`, svc.id);
            }
            catch (err) {
                throw new Error(`Unable to get runner ${runnerId}: ${stringifyError(err)}`);
            }
        });
    }
}
//# sourceMappingURL=render.runner.js.map