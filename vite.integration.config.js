/// <reference types="vitest" />
// Configure Vitest (https://vitest.dev/config/)
import { defineConfig } from 'vitest/config';
process.env.TZ = 'UTC';
export default defineConfig({
    test: {
        include: ['**/*.integration.{test,spec}.?(c|m)[jt]s?(x)'],
        globalSetup: './tests/setup.ts',
        setupFiles: './tests/setupFiles.ts',
        threads: false,
        testTimeout: 20000,
        env: {
            NANGO_ENCRYPTION_KEY: 'RzV4ZGo5RlFKMm0wYWlXdDhxTFhwb3ZrUG5KNGg3TmU=',
            NANGO_LOGS_ENABLED: 'true'
        }
    }
});
//# sourceMappingURL=vite.integration.config.js.map