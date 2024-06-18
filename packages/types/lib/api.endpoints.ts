import type { EndpointMethod } from './api.js';
import type { GetOperation, SearchFilters, SearchMessages, SearchOperations } from './logs/api.js';
import type { GetOnboardingStatus } from './onboarding/api.js';
import type { SetMetadata, UpdateMetadata } from './connection/api/metadata.js';

export type APIEndpoints = SearchOperations | GetOperation | SearchMessages | SearchFilters | GetOnboardingStatus | SetMetadata | UpdateMetadata;

/**
 * Automatically narrow endpoints type with Method + Path
 */
export type APIEndpointsPicker<TMethod extends EndpointMethod, TPath extends APIEndpoints['Path']> = Extract<APIEndpoints, { Method: TMethod; Path: TPath }>;

/**
 * Automatically narrow endpoints type with Path
 * Useful to get allowed methods
 */
export type APIEndpointsPickerWithPath<TPath extends APIEndpoints['Path']> = Extract<APIEndpoints, { Path: TPath }>;
