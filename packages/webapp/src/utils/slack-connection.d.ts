export declare const connectSlack: ({
    accountUUID,
    env,
    hostUrl,
    onFinish,
    onFailure
}: {
    accountUUID: string;
    env: string;
    hostUrl: string;
    onFinish: () => void;
    onFailure: () => void;
}) => Promise<void>;
export declare const updateSlackNotifications: (env: string, enabled: boolean) => Promise<void>;
