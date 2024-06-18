import { LogActionEnum } from './Activity.js';
export var SyncStatus;
(function (SyncStatus) {
    SyncStatus["RUNNING"] = "RUNNING";
    SyncStatus["PAUSED"] = "PAUSED";
    SyncStatus["STOPPED"] = "STOPPED";
    SyncStatus["SUCCESS"] = "SUCCESS";
    SyncStatus["ERROR"] = "ERROR";
})(SyncStatus = SyncStatus || (SyncStatus = {}));
export var SyncType;
(function (SyncType) {
    SyncType["INITIAL"] = "INITIAL";
    SyncType["INCREMENTAL"] = "INCREMENTAL";
    SyncType["WEBHOOK"] = "WEBHOOK";
    SyncType["POST_CONNECTION_SCRIPT"] = "POST_CONNECTION_SCRIPT";
    SyncType["FULL"] = "FULL";
    SyncType["ACTION"] = "ACTION";
})(SyncType = SyncType || (SyncType = {}));
export var SyncConfigType;
(function (SyncConfigType) {
    SyncConfigType["SYNC"] = "sync";
    SyncConfigType["ACTION"] = "action";
})(SyncConfigType = SyncConfigType || (SyncConfigType = {}));
export var ScheduleStatus;
(function (ScheduleStatus) {
    ScheduleStatus["RUNNING"] = "RUNNING";
    ScheduleStatus["PAUSED"] = "PAUSED";
    ScheduleStatus["STOPPED"] = "STOPPED";
})(ScheduleStatus = ScheduleStatus || (ScheduleStatus = {}));
export var SyncCommand;
(function (SyncCommand) {
    SyncCommand["PAUSE"] = "PAUSE";
    SyncCommand["UNPAUSE"] = "UNPAUSE";
    SyncCommand["RUN"] = "RUN";
    SyncCommand["RUN_FULL"] = "RUN_FULL";
    SyncCommand["CANCEL"] = "CANCEL";
})(SyncCommand = SyncCommand || (SyncCommand = {}));
export const CommandToActivityLog = {
    PAUSE: LogActionEnum.PAUSE_SYNC,
    UNPAUSE: LogActionEnum.RESTART_SYNC,
    RUN: LogActionEnum.TRIGGER_SYNC,
    RUN_FULL: LogActionEnum.TRIGGER_FULL_SYNC,
    CANCEL: LogActionEnum.CANCEL_SYNC
};
export const SyncCommandToScheduleStatus = {
    PAUSE: ScheduleStatus.PAUSED,
    UNPAUSE: ScheduleStatus.RUNNING,
    RUN: ScheduleStatus.RUNNING,
    RUN_FULL: ScheduleStatus.RUNNING,
    CANCEL: ScheduleStatus.RUNNING
};
//# sourceMappingURL=Sync.js.map