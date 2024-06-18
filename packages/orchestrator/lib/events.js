import EventEmitter from 'node:events';
export class EventsHandler extends EventEmitter {
    constructor(on) {
        super();
        this.onCallbacks = {
            CREATED: (task) => {
                on.CREATED(task);
                this.emit(`task:created:${task.groupKey}`, task);
            },
            STARTED: (task) => {
                on.STARTED(task);
                this.emit(`task:started:${task.id}`, task);
            },
            SUCCEEDED: (task) => {
                on.SUCCEEDED(task);
                this.emit(`task:completed:${task.id}`, task);
            },
            FAILED: (task) => {
                on.FAILED(task);
                this.emit(`task:completed:${task.id}`, task);
            },
            EXPIRED: (task) => {
                on.EXPIRED(task);
                this.emit(`task:completed:${task.id}`, task);
            },
            CANCELLED: (task) => {
                on.CANCELLED(task);
                this.emit(`task:completed:${task.id}`, task);
            }
        };
    }
}
//# sourceMappingURL=events.js.map