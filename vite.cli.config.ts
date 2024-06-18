/// <reference types="vitest" />

// Configure Vitest (https://vitest.dev/config/)

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['**/*.unit.cli-{test,spec}.?(c|m)[jt]s?(x)'],
        env: {
            NANGO_ENCRYPTION_KEY: 'RzV4ZGo5RlFKMm0wYWlXdDhxTFhwb3ZrUG5KNGg3TmU='
        },
        threads: false,
        chaiConfig: {
            truncateThreshold: 10000
        }
    },
    resolve: {
        alias: {
            '@nangohq/shared': './packages/shared/lib',
            '@nangohq/models': './packages/server/lib/models',
            '@nangohq/types': './packages/types/lib',
            '@nangohq/logs': './packages/logs/lib',
            '@nangohq/utils': './packages/utils/lib'
        }
    }
});
