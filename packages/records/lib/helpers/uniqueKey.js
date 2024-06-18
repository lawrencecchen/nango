export function getUniqueId(record) {
    return record.external_id;
}
export function verifyUniqueKeysAreUnique(records) {
    const idMap = new Set();
    const nonUniqueKeys = new Set();
    for (const record of records) {
        const id = getUniqueId(record);
        if (idMap.has(id)) {
            nonUniqueKeys.add(id);
        }
        else {
            idMap.add(id);
        }
    }
    return { nonUniqueKeys };
}
export function removeDuplicateKey(records) {
    const { nonUniqueKeys } = verifyUniqueKeysAreUnique(records);
    const seen = new Set();
    const recordsWithoutDuplicates = records.filter((record) => {
        const key = getUniqueId(record);
        return seen.has(key) ? false : seen.add(key);
    });
    return { records: recordsWithoutDuplicates, nonUniqueKeys: Array.from(nonUniqueKeys) };
}
//# sourceMappingURL=uniqueKey.js.map