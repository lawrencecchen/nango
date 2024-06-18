/// <reference types="react" />
import type { Flow, Connection } from '../../../types';
import type { EndpointResponse } from '../Show';
export interface FlowProps {
    flow: Flow;
    provider: string;
    providerConfigKey: string;
    reload: () => void;
    rawName?: string;
    connections: Connection[];
    endpoints?: EndpointResponse;
    setIsEnabling?: (isEnabling: boolean) => void;
    showSpinner?: boolean;
}
export default function EnableDisableSync({
    flow,
    endpoints,
    provider,
    providerConfigKey,
    reload,
    rawName,
    connections,
    setIsEnabling,
    showSpinner
}: FlowProps): import('react').JSX.Element;
