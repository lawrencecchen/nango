import { expect, describe, it } from 'vitest';
import { removeDuplicateKey } from './uniqueKey.js';
describe('removeDuplicateKey', () => {
    it('Should remove duplicates', () => {
        const duplicateRecords = [
            { external_id: '1', name: 'John Doe' },
            { external_id: '1', name: 'John Doe' },
            { external_id: '2', name: 'Jane Doe' },
            { external_id: '2', name: 'Jane Doe' },
            { external_id: '3', name: 'John Doe' },
            { external_id: '3', name: 'John Doe' },
            { external_id: '4', name: 'Mike Doe' },
            { external_id: '5', name: 'Mark Doe' }
        ];
        const expected = [
            { external_id: '1', name: 'John Doe' },
            { external_id: '2', name: 'Jane Doe' },
            { external_id: '3', name: 'John Doe' },
            { external_id: '4', name: 'Mike Doe' },
            { external_id: '5', name: 'Mark Doe' }
        ];
        const { records, nonUniqueKeys } = removeDuplicateKey(duplicateRecords);
        expect(records).toEqual(expected);
        expect(nonUniqueKeys).toEqual(['1', '2', '3']);
    });
});
//# sourceMappingURL=uniqueKey.unit.test.js.map