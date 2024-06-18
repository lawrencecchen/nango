var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export function retry(fn, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const { maxAttempts, delayMs, retryIf } = config;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return fn();
            }
            catch (error) {
                if (attempt < maxAttempts && retryIf(error)) {
                    const delay = typeof delayMs === 'number' ? delayMs : delayMs(attempt);
                    yield new Promise((resolve) => setTimeout(resolve, delay));
                }
                else {
                    throw error;
                }
            }
        }
        throw new Error('unreachable');
    });
}
//# sourceMappingURL=retry.js.map