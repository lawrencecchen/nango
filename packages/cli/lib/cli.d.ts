export declare const version: (debug: boolean) => void;
export declare function generate({ fullPath, debug }: { fullPath: string; debug?: boolean }): Promise<void>;
/**
 * Init
 * If we're not currently in the nango-integrations directory create one
 * and create an example nango.yaml file
 */
export declare function init({ absolutePath, debug }: { absolutePath: string; debug?: boolean }): Promise<void>;
export declare function tscWatch({ fullPath, debug }: { fullPath: string; debug?: boolean }): Promise<void>;
export declare function configWatch({ fullPath, debug }: { fullPath: string; debug?: boolean }): void;
/**
 * Docker Run
 * @desc spawn a child process to run the docker compose located in the cli
 * Look into https://www.npmjs.com/package/docker-compose to avoid dependency maybe?
 */
export declare const dockerRun: (debug?: boolean) => Promise<void>;
