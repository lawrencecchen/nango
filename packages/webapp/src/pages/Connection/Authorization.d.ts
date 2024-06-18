/// <reference types="react" />
import type { Connection } from '@nangohq/types';
interface AuthorizationProps {
    connection: Connection;
    forceRefresh: () => Promise<void>;
    loaded: boolean;
    syncLoaded: boolean;
}
export default function Authorization(props: AuthorizationProps): import('react').JSX.Element;
export {};
