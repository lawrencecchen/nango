"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStore = void 0;
const zustand_1 = require("zustand");
exports.useStore = (0, zustand_1.create)((set, get) => ({
    env: 'dev',
    envs: [{ name: 'dev' }, { name: 'prod' }],
    baseUrl: 'https://api.nango.dev',
    email: '',
    showInteractiveDemo: true,
    debugMode: false,
    setEnv: (value) => {
        set({ env: value });
    },
    setEnvs: (envs) => {
        set({ envs });
    },
    getEnvs: () => {
        return get().envs;
    },
    setBaseUrl: (value) => {
        set({ baseUrl: value });
    },
    setEmail: (value) => {
        set({ email: value });
    },
    setShowInteractiveDemo: (value) => {
        set({ showInteractiveDemo: value });
    },
    setDebugMode: (value) => {
        set({ debugMode: value });
    }
}));
//# sourceMappingURL=store.js.map