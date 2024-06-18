import type { OAuthSession } from '@nangohq/shared';
declare class OAuthSessionService {
    create(oAuthSession: OAuthSession): Promise<void>;
    findById(id: string): Promise<OAuthSession | null>;
    delete(id: string): Promise<void>;
    /**
     * This will clear the sessions that have been created for more than 24hrs,
     * it's possible that some sessions are created but at the end the callback url
     * was not called hence the sessions still remains.
     * We will use the method to clean such for now its cleans in the last 24hrs
     */
    clearStaleSessions(): Promise<any>;
    private queryBuilder;
}
declare const _default: OAuthSessionService;
export default _default;
