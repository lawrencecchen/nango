/// <reference types="react" />
import type { EndpointResponse, FlowConfiguration } from './Show';
import { SubTabs } from './Show';
import type { IntegrationConfig, Flow } from '../../types';
interface ScriptProps {
    endpoints: EndpointResponse;
    integration: IntegrationConfig;
    reload: () => void;
    setFlow: (flow: Flow) => void;
    setSubTab: (tab: SubTabs) => void;
    setFlowConfig: (flowConfig: FlowConfiguration) => void;
}
export default function Scripts(props: ScriptProps): import('react').JSX.Element;
export {};
