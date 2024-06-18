var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { execSync, spawn } from 'child_process';
import { getRunnerClient } from '@nangohq/nango-runner';
import { getLogger } from '@nangohq/utils';
import { RunnerType } from './runner.js';
const logger = getLogger('Jobs');
export class LocalRunner {
    constructor(id, url, childProcess) {
        this.id = id;
        this.url = url;
        this.childProcess = childProcess;
        this.runnerType = RunnerType.Local;
        this.client = getRunnerClient(this.url);
    }
    suspend() {
        this.childProcess.kill();
    }
    toJSON() {
        return { runnerType: this.runnerType, id: this.id, url: this.url };
    }
    static fromJSON(obj) {
        throw new Error(`'fromJSON(${obj})' not implemented`);
    }
    static getOrStart(runnerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const port = Math.floor(Math.random() * 1000) + 11000; // random port between 11000 and 12000;
                let nodePath = '';
                try {
                    nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
                }
                catch (_a) {
                    throw new Error('Unable to find node');
                }
                const nangoRunnerPath = process.env['NANGO_RUNNER_PATH'] || '../runner/dist/app.js';
                const cmd = nodePath;
                const runnerLocation = nangoRunnerPath;
                const cmdOptions = [runnerLocation, port.toString(), runnerId];
                logger.info(`[Runner] Starting runner with command: ${cmd} ${cmdOptions.join(' ')} `);
                const childProcess = spawn(cmd, cmdOptions, {
                    stdio: [null, null, null],
                    env: Object.assign(Object.assign({}, process.env), { RUNNER_ID: runnerId, IDLE_MAX_DURATION_MS: '0' })
                });
                if (!childProcess) {
                    throw new Error('Unable to spawn runner process');
                }
                if (childProcess.stdout) {
                    childProcess.stdout.on('data', (data) => {
                        logger.info(`[Runner] ${data.toString()} `);
                    });
                }
                if (childProcess.stderr) {
                    childProcess.stderr.on('data', (data) => {
                        logger.info(`[Runner][ERROR] ${data.toString()} `);
                    });
                }
                return new LocalRunner(runnerId, `http://localhost:${port}`, childProcess);
            }
            catch (err) {
                throw new Error(`Unable to get runner ${runnerId}: ${err}`);
            }
        });
    }
}
//# sourceMappingURL=local.runner.js.map