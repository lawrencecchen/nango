/// <reference types="react" />
import type { Flow, FlowEndpoint, IntegrationConfig } from '../../../types';
import { SubTabs } from '../Show';
export interface EndpointRowProps {
    flow: Flow;
    integration: IntegrationConfig | null;
    endpoint: string | FlowEndpoint;
    setSubTab: (tab: SubTabs) => void;
    setFlow: (flow: Flow) => void;
    setEndpoint: (endpoint: FlowEndpoint | string) => void;
}
export default function EndpointRow({ flow, endpoint, setSubTab, setFlow, setEndpoint }: EndpointRowProps): import('react').JSX.Element;
