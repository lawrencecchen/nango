import type { NangoAction, GmailEmailSentOutput, GmailEmailInput } from '../../types/lib/integration/asana.js';
export default function runAction(nango: NangoAction, input: GmailEmailInput): Promise<GmailEmailSentOutput>;
