var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getLogger } from '@nangohq/utils';
import { getRunnerClient } from '@nangohq/nango-runner';
import { RunnerType } from './runner.js';
const logger = getLogger('Jobs');
export class RemoteRunner {
    constructor(id, url) {
        this.id = id;
        this.url = url;
        this.runnerType = RunnerType.Remote;
        this.client = getRunnerClient(this.url);
    }
    suspend() {
        logger.warn('cannot suspend a remote runner');
    }
    toJSON() {
        return { runnerType: this.runnerType, id: this.id, url: this.url };
    }
    static fromJSON(obj) {
        throw new Error(`'fromJSON(${obj})' not implemented`);
    }
    static getOrStart(runnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new RemoteRunner(runnerId, process.env['RUNNER_SERVICE_URL'] || 'http://nango-runner');
        });
    }
}
//# sourceMappingURL=remote.runner.js.map