import type { NangoSync, GithubRepo } from '../../types/lib/integration/asana.js';
export default function runAction(nango: NangoSync): Promise<{
    repos: GithubRepo[];
}>;
