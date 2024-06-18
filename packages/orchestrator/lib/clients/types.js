export function TaskSync(props) {
    return {
        id: props.id,
        name: props.name,
        state: props.state,
        attempt: props.attempt,
        syncId: props.syncId,
        syncName: props.syncName,
        debug: props.debug,
        connection: props.connection,
        abortController: new AbortController(),
        isSync: () => true,
        isWebhook: () => false,
        isAction: () => false,
        isPostConnection: () => false
    };
}
export function TaskAction(props) {
    return {
        id: props.id,
        name: props.name,
        state: props.state,
        attempt: props.attempt,
        actionName: props.actionName,
        connection: props.connection,
        activityLogId: props.activityLogId,
        input: props.input,
        abortController: new AbortController(),
        isSync: () => false,
        isWebhook: () => false,
        isAction: () => true,
        isPostConnection: () => false
    };
}
export function TaskWebhook(props) {
    return {
        id: props.id,
        name: props.name,
        state: props.state,
        attempt: props.attempt,
        webhookName: props.webhookName,
        parentSyncName: props.parentSyncName,
        connection: props.connection,
        activityLogId: props.activityLogId,
        input: props.input,
        abortController: new AbortController(),
        isSync: () => false,
        isWebhook: () => true,
        isAction: () => false,
        isPostConnection: () => false
    };
}
export function TaskPostConnection(props) {
    return {
        id: props.id,
        state: props.state,
        name: props.name,
        attempt: props.attempt,
        postConnectionName: props.postConnectionName,
        connection: props.connection,
        fileLocation: props.fileLocation,
        activityLogId: props.activityLogId,
        abortController: new AbortController(),
        isSync: () => false,
        isWebhook: () => false,
        isAction: () => false,
        isPostConnection: () => true
    };
}
//# sourceMappingURL=types.js.map