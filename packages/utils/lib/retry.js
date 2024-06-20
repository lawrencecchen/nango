export async function retry(fn, config) {
    const { maxAttempts, delayMs, retryIf } = config;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return fn();
        }
        catch (error) {
            if (attempt < maxAttempts && retryIf(error)) {
                const delay = typeof delayMs === 'number' ? delayMs : delayMs(attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
            else {
                throw error;
            }
        }
    }
    throw new Error('unreachable');
}
//# sourceMappingURL=retry.js.map