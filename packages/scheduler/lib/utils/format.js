export function stringifyTask(task) {
    // remove payload and output from the stringified task
    // to avoid logging sensitive data and/or large data
    return JSON.stringify(Object.assign(Object.assign({}, task), { payload: 'REDACTED', output: 'REDACTED' }));
}
//# sourceMappingURL=format.js.map