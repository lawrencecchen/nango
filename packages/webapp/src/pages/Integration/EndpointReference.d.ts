/// <reference types="react" />
import type { EnvironmentAndAccount } from '@nangohq/server';

import type { IntegrationConfig, FlowEndpoint, Flow } from '../../types';
import { Tabs, SubTabs } from './Show';
interface EndpointReferenceProps {
    environment: EnvironmentAndAccount['environment'];
    integration: IntegrationConfig;
    activeEndpoint: string | FlowEndpoint | null;
    activeFlow: Flow | null;
    setSubTab: (tab: SubTabs) => void;
    setActiveTab: (tab: Tabs) => void;
}
export default function EndpointReference(props: EndpointReferenceProps): import('react').JSX.Element;
export {};
