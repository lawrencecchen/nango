import useSWR from 'swr';
import type { GetUser } from '@nangohq/server';

import { swrFetcher } from '../utils/api';

export function useUser(enabled = true) {
    const { data, error, mutate } = useSWR<GetUser>(enabled ? '/api/v1/user' : null, swrFetcher);

    const loading = !data && !error;

    return {
        loading,
        user: data?.user,
        mutate
    };
}
