/// <reference types="react" />
import type { EnvironmentAndAccount } from '@nangohq/server';

import type { FlowConfiguration, EndpointResponse } from './Show';
import { Tabs, SubTabs } from './Show';
import type { IntegrationConfig, Flow } from '../../types';
interface FlowPageProps {
    environment: EnvironmentAndAccount['environment'];
    integration: IntegrationConfig;
    flow: Flow | null;
    flowConfig: FlowConfiguration | null;
    reload: () => void;
    endpoints: EndpointResponse;
    setFlow: (flow: Flow) => void;
    setActiveTab: (tab: Tabs) => void;
    setSubTab: (tab: SubTabs) => void;
}
export default function FlowPage(props: FlowPageProps): import('react').JSX.Element;
export {};
