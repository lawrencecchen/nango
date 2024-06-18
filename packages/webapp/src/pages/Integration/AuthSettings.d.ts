/// <reference types="react" />
import type { EnvironmentAndAccount } from '@nangohq/server';

import type { IntegrationConfig } from '../../types';
interface AuthSettingsProps {
    integration: IntegrationConfig | null;
    environment: EnvironmentAndAccount['environment'];
}
export default function AuthSettings(props: AuthSettingsProps): import('react').JSX.Element;
export {};
