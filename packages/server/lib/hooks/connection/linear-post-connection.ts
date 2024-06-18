import axios from 'axios';

import type { InternalNango as Nango } from './post-connection.js';

export default async function execute(nango: Nango) {
    const query = `
        query {
            organization {
                id
            }
        }`;

    const connection = await nango.getConnection();
    const response = await nango.proxy({
        endpoint: '/graphql',
        data: { query },
        method: 'POST',
        connectionId: connection.connection_id,
        providerConfigKey: connection.provider_config_key
    });

    if (axios.isAxiosError(response) || !response || !response.data || !response.data.data?.organization?.id) {
        return;
    }

    const organizationId = response.data.data.organization.id;

    await nango.updateConnectionConfig({ organizationId });
}
