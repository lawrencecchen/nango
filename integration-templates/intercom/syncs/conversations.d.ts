import type { NangoSync } from '../../types/lib/integration/asana.js';
/**
 * Fetches Intercom conversations with all their associated messages and notes.
 *
 * Note that Intercom has a hard limit of 500 message parts (messages/notes/actions etc.) returned per conversation.
 * If a conversation has more than 500 parts some will be missing.
 * Only fetches parts that have a message body, ignores parts which are pure actions & metadata (e.g. closed conversation).
 *
 * ====
 *
 * Initial sync: Fetches conversations updated in the last X years (default: X=2)
 * Incremential sync: Fetches the conversations that have been updates since the last sync (updated_at date from Intercom, seems to be reliable)
 */
export default function fetchData(nango: NangoSync): Promise<void>;
