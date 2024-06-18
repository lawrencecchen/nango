/// <reference types="react" />
import type { Connection } from '@nangohq/types';

import type { SyncResponse } from '../../types';
interface SyncsProps {
    syncs: SyncResponse[] | undefined;
    connection: Connection | null;
    provider: string | null;
    loaded: boolean;
    syncLoaded: boolean;
    reload: () => void;
    env: string;
}
export default function Syncs({ syncs, connection, provider, reload, loaded, syncLoaded, env }: SyncsProps): import('react').JSX.Element;
export {};
