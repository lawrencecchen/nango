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
export const NangoFlows = [
    {
        providerConfigKey: 'demo-github-integration',
        syncs: [
            {
                name: 'github-issue-example',
                runs: 'every half hour',
                track_deletes: false,
                type: 'sync',
                auto_start: true,
                attributes: {},
                returns: ['GithubIssue'],
                models: [
                    {
                        name: 'GithubIssue',
                        fields: [
                            {
                                name: 'id',
                                type: 'integer'
                            },
                            {
                                name: 'owner',
                                type: 'string'
                            },
                            {
                                name: 'repo',
                                type: 'string'
                            },
                            {
                                name: 'issue_number',
                                type: 'number'
                            },
                            {
                                name: 'title',
                                type: 'string'
                            },
                            {
                                name: 'author',
                                type: 'string'
                            },
                            {
                                name: 'author_id',
                                type: 'string'
                            },
                            {
                                name: 'state',
                                type: 'string'
                            },
                            {
                                name: 'date_created',
                                type: 'date'
                            },
                            {
                                name: 'date_last_modified',
                                type: 'date'
                            },
                            {
                                name: 'body',
                                type: 'string'
                            }
                        ]
                    }
                ],
                description: '',
                scopes: [],
                endpoints: [],
                nango_yaml_version: 'v1',
                layout_mode: 'root'
            }
        ],
        actions: [
            {
                name: 'github-write-action',
                runs: '',
                track_deletes: false,
                type: 'action',
                auto_start: true,
                attributes: {},
                returns: 'boolean',
                models: [],
                description: '',
                scopes: [],
                endpoints: [],
                nango_yaml_version: 'v1',
                layout_mode: 'root'
            }
        ]
    }
] as const;
