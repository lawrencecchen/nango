import type { NangoAction, SlackMessage, SlackResponse } from '../../shared/lib/sdk/sync.js';
export default function runAction(nango: NangoAction, input: SlackMessage): Promise<SlackResponse | null>;
