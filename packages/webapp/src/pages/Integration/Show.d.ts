/// <reference types="react" />
import type { Flow } from '../../types';
export declare enum Tabs {
    API = 0,
    Scripts = 1,
    Auth = 2
}
export declare enum SubTabs {
    Reference = 0,
    Flow = 1
}
export interface FlowConfiguration {
    provider: string;
    providerConfigKey: string;
    syncs: Flow[];
    actions: Flow[];
    rawName?: string;
}
export interface EndpointResponse {
    allFlows: FlowConfiguration | null;
    disabledFlows?: FlowConfiguration;
}
export default function ShowIntegration(): import('react').JSX.Element;
