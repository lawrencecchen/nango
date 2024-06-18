/// <reference types="react" />
import type { EnvironmentAndAccount } from '@nangohq/server';

import type { Tabs, SubTabs, EndpointResponse } from './Show';
import type { IntegrationConfig, Flow, FlowEndpoint } from '../../types';
interface APIReferenceProps {
    integration: IntegrationConfig | null;
    setActiveTab: (tab: Tabs) => void;
    endpoints: EndpointResponse;
    environment: EnvironmentAndAccount['environment'];
    setSubTab: (tab: SubTabs) => void;
    setFlow: (flow: Flow) => void;
    setEndpoint: (endpoint: FlowEndpoint | string) => void;
}
export default function APIReference(props: APIReferenceProps): import('react').JSX.Element;
export {};
