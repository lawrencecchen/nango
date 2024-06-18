"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugMode = void 0;
const store_1 = require("../store");
const DebugMode = () => {
    const debugMode = (0, store_1.useStore)((state) => state.debugMode);
    if (!debugMode) {
        return null;
    }
    return <div className="bg-red-500 px-3 py-1 bg-opacity-60 text-white text-xs w-full z-[100] text-center">Debug mode activated</div>;
};
exports.DebugMode = DebugMode;
//# sourceMappingURL=DebugMode.js.map