"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchPresetFromRange = exports.getPresetRange = exports.presets = exports.slidePeriod = exports.getLogsUrl = void 0;
const date_fns_1 = require("date-fns");
function getLogsUrl(options) {
    const usp = new URLSearchParams();
    for (const [key, val] of Object.entries(options)) {
        if (!val || key === 'env') {
            continue;
        }
        if (key === 'day') {
            const from = new Date();
            from.setHours(0, 0);
            const to = new Date();
            to.setHours(23, 59);
            usp.set('from', from.toISOString());
            usp.set('to', to.toISOString());
            continue;
        }
        usp.set(key, val);
    }
    usp.set('live', 'false');
    usp.sort();
    return `/${options.env}/logs?${usp.toString()}`;
}
exports.getLogsUrl = getLogsUrl;
function slidePeriod(period) {
    const now = new Date();
    let from = new Date(period.from);
    let to = new Date(period.to);
    const sliding = now.getTime() - to.getTime();
    to = (0, date_fns_1.addMilliseconds)(to, sliding);
    from = (0, date_fns_1.addMilliseconds)(from, sliding);
    return { from, to };
}
exports.slidePeriod = slidePeriod;
// Define presets
exports.presets = [
    { name: 'last5m', label: 'Last 5 minutes' },
    { name: 'last1h', label: 'Last hour' },
    { name: 'last24h', label: 'Last 24 hours' },
    { name: 'last3d', label: 'Last 3 days' },
    { name: 'last7d', label: 'Last 7 days' },
    { name: 'last14d', label: 'Last 14 days' }
];
function getPresetRange(preset) {
    const from = new Date();
    const to = new Date();
    switch (preset) {
        case 'last5m':
            from.setMinutes(from.getMinutes() - 5);
            break;
        case 'last1h':
            from.setMinutes(from.getMinutes() - 60);
            break;
        case 'last24h':
            from.setDate(from.getDate() - 1);
            break;
        case 'last3d':
            from.setDate(from.getDate() - 2);
            from.setHours(0, 0, 0, 0);
            to.setHours(23, 59, 59, 999);
            break;
        case 'last7d':
            from.setDate(from.getDate() - 6);
            from.setHours(0, 0, 0, 0);
            to.setHours(23, 59, 59, 999);
            break;
        case 'last14d':
            from.setDate(from.getDate() - 13);
            from.setHours(0, 0, 0, 0);
            to.setHours(23, 59, 59, 999);
            break;
    }
    return { from, to };
}
exports.getPresetRange = getPresetRange;
function matchPresetFromRange(range) {
    const minutes = (range.to.getTime() - range.from.getTime()) / 1000 / 60;
    for (const preset of exports.presets) {
        const tmp = getPresetRange(preset.name);
        const tmpMinutes = (tmp.to.getTime() - tmp.from.getTime()) / 1000 / 60;
        if (tmpMinutes === minutes) {
            return preset;
        }
    }
    return null;
}
exports.matchPresetFromRange = matchPresetFromRange;
//# sourceMappingURL=logs.js.map