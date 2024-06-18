import type { NangoSync } from '../../types/lib/integration/asana.js';
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
export default function fetchData(nango: NangoSync): Promise<void>;
