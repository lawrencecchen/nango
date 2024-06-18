/// <reference types="vitest" />

// Configure Vitest (https://vitest.dev/config/)

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['**/*.unit.{test,spec}.?(c|m)[jt]s?(x)'],
        setupFiles: './tests/setupFiles.ts',
        env: {
            NANGO_ENCRYPTION_KEY: 'RzV4ZGo5RlFKMm0YWlXdDhxTFhwb3ZrUG5KNGg3TmU=',
            NANGO_LOGS_ES_URL: 'http://fake.com',
            NANGO_LOGS_ES_USER: '',
            NANGO_LOGS_ES_PWD: '',
            NANGO_LOGS_ENABLED: 'false'
        },
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
