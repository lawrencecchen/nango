import type { NangoSync, GithubCreateIssueInput, GithubCreateIssueResult } from '../../types/lib/integration/asana.js';
export default function runAction(nango: NangoSync, input: GithubCreateIssueInput): Promise<GithubCreateIssueResult>;
