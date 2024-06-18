export declare enum Steps {
    Start = 0,
    Authorize = 1,
    Deploy = 2,
    Webhooks = 3,
    Fetch = 4,
    Write = 5,
    Complete = 6
}
export declare enum Language {
    Node = 0,
    cURL = 1
}
export declare const endpointSync = '/github/demo-issues';
export declare const endpointAction = '/github/demo-write-issue';
export declare const model = 'GithubIssueDemo';
export declare const providerConfigKey = 'github-demo';
export declare const actionName = 'create-demo-issue';
