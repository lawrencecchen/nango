var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * This syncs:
 *  - pages
 *  - sub-pages (any nesting level)
 *  - database entries (which are also pages in Notion)
 *  - entries of sub-databases (any nesting level)
 *
 * For each of these it will retrieve:
 *  - Page id
 *  - Title
 *  - URL
 *  - Plain text content of the page
 *  - Id of the parent page
 *
 * Note that it only retrieves text content:
 * It ignores images, files and other blocks that do not have a `rich_text` property.
 * https://developers.notion.com/reference/rich-text
 *
 */
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const pages = (yield paginate(nango, 'post', '/v1/search', 'Notion pages', 100, true)).filter((result) => result.object === 'page');
        const batchSize = 10;
        yield nango.log(`Found ${pages.length} new/updated Notion pages to sync.`);
        for (let i = 0; i < pages.length; i += batchSize) {
            yield nango.log(`Fetching plain text, in batch of ${batchSize} Notion pages, from page ${i + 1} (total pages: ${pages.length})`);
            const batchOfPages = pages.slice(i, Math.min(pages.length, i + batchSize));
            const pagesWithPlainText = yield Promise.all(batchOfPages.map((page) => __awaiter(this, void 0, void 0, function* () { return mapPage(page, yield fetchPlainText(page, nango)); })));
            yield nango.batchSave(pagesWithPlainText, 'NotionPage');
        }
    });
}
function fetchPlainText(page, nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const blocks = yield paginate(nango, 'get', `/v1/blocks/${page.id}/children`, 'Notion blocks', 100);
        return findAllByKey(blocks, 'rich_text')
            .map((richText) => richTextToPlainText(richText))
            .join('\n');
    });
}
function paginate(nango, method, endpoint, desc, pageSize = 100, incremental = false) {
    return __awaiter(this, void 0, void 0, function* () {
        let cursor;
        let pageCounter = 0;
        let results = [];
        while (true) {
            yield nango.log(`Fetching ${desc} ${pageCounter * pageSize + 1} to ${++pageCounter * pageSize}`);
            const res = yield nango.proxy({
                method: method,
                endpoint: endpoint,
                data: method === 'post' ? { page_size: pageSize, start_cursor: cursor } : {},
                params: method === 'get' ? { page_size: `${pageSize}`, start_cursor: cursor } : {},
                retries: 10 // Exponential backoff + long-running job = handles rate limits well.
            });
            if (incremental &&
                nango.lastSyncDate &&
                res.data.results.length &&
                new Date(res.data.results[res.data.results.length - 1].last_edited_time) < nango.lastSyncDate) {
                results = results.concat(res.data.results.filter((result) => new Date(result.last_edited_time) >= nango.lastSyncDate));
                break;
            }
            else {
                results = results.concat(res.data.results);
            }
            if (!res.data.has_more || !res.data.next_cursor) {
                break;
            }
            else {
                cursor = res.data.next_cursor;
            }
        }
        return results;
    });
}
function richTextToPlainText(richText) {
    return richText
        .filter((text) => text.plain_text)
        .map((text) => text.plain_text)
        .join('');
}
function findAllByKey(obj, keyToFind) {
    return Object.entries(obj).reduce((acc, [key, value]) => key === keyToFind ? acc.concat([value]) : typeof value === 'object' && value ? acc.concat(findAllByKey(value, keyToFind)) : acc, []);
}
function mapPage(page, plainText) {
    return {
        id: page.id,
        url: page.url,
        content: plainText,
        parent_page_id: page.parent.page_id
    };
}
//# sourceMappingURL=pages.js.map