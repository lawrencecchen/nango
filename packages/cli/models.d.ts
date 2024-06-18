export interface GithubIssue {
    id: number;
    owner: string;
    repo: string;
    issue_number: number;
    title: string;
    author: string;
    author_id: string;
    state: string;
    date_created: Date;
    date_last_modified: Date;
    body: string;
}
export declare const NangoFlows: readonly [
    {
        readonly providerConfigKey: 'demo-github-integration';
        readonly syncs: readonly [
            {
                readonly name: 'github-issue-example';
                readonly runs: 'every half hour';
                readonly track_deletes: false;
                readonly type: 'sync';
                readonly auto_start: true;
                readonly attributes: {};
                readonly returns: readonly ['GithubIssue'];
                readonly models: readonly [
                    {
                        readonly name: 'GithubIssue';
                        readonly fields: readonly [
                            {
                                readonly name: 'id';
                                readonly type: 'integer';
                            },
                            {
                                readonly name: 'owner';
                                readonly type: 'string';
                            },
                            {
                                readonly name: 'repo';
                                readonly type: 'string';
                            },
                            {
                                readonly name: 'issue_number';
                                readonly type: 'number';
                            },
                            {
                                readonly name: 'title';
                                readonly type: 'string';
                            },
                            {
                                readonly name: 'author';
                                readonly type: 'string';
                            },
                            {
                                readonly name: 'author_id';
                                readonly type: 'string';
                            },
                            {
                                readonly name: 'state';
                                readonly type: 'string';
                            },
                            {
                                readonly name: 'date_created';
                                readonly type: 'date';
                            },
                            {
                                readonly name: 'date_last_modified';
                                readonly type: 'date';
                            },
                            {
                                readonly name: 'body';
                                readonly type: 'string';
                            }
                        ];
                    }
                ];
                readonly description: '';
                readonly scopes: readonly [];
                readonly endpoints: readonly [];
                readonly nango_yaml_version: 'v1';
                readonly layout_mode: 'root';
            }
        ];
        readonly actions: readonly [
            {
                readonly name: 'github-write-action';
                readonly runs: '';
                readonly track_deletes: false;
                readonly type: 'action';
                readonly auto_start: true;
                readonly attributes: {};
                readonly returns: 'boolean';
                readonly models: readonly [];
                readonly description: '';
                readonly scopes: readonly [];
                readonly endpoints: readonly [];
                readonly nango_yaml_version: 'v1';
                readonly layout_mode: 'root';
            }
        ];
    }
];
