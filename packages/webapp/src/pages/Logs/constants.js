"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncsDefaultOptions = exports.connectionsDefaultOptions = exports.integrationsDefaultOptions = exports.typesOptions = exports.typesDefaultOptions = exports.statusOptions = exports.statusDefaultOptions = exports.columns = void 0;
const react_icons_1 = require("@radix-ui/react-icons");
const utils_1 = require("../../utils/utils");
const StatusTag_1 = require("./components/StatusTag");
const OperationTag_1 = require("./components/OperationTag");
const ProviderTag_1 = require("./components/ProviderTag");
exports.columns = [
    {
        accessorKey: 'createdAt',
        header: 'Timestamp',
        size: 180,
        cell: ({ row }) => {
            return <div className="font-code text-s">{(0, utils_1.formatDateToLogFormat)(row.original.createdAt)}</div>;
        }
    },
    {
        accessorKey: 'state',
        header: 'Status',
        size: 90,
        cell: ({ row }) => {
            return <StatusTag_1.StatusTag state={row.original.state}/>;
        }
    },
    {
        accessorKey: 'operation',
        header: 'Type',
        size: 100,
        cell: ({ row }) => {
            return <OperationTag_1.OperationTag message={row.original.message} operation={row.original.operation}/>;
        }
    },
    {
        accessorKey: 'integrationId',
        header: 'Integration',
        minSize: 280,
        cell: ({ row }) => {
            return <ProviderTag_1.ProviderTag msg={row.original}/>;
        }
    },
    {
        accessorKey: 'syncConfigId',
        header: 'Script',
        minSize: 280,
        cell: ({ row }) => {
            return <div className="truncate font-code text-s">{row.original.syncConfigName || '-'}</div>;
        }
    },
    {
        accessorKey: 'connectionId',
        header: 'Connection',
        minSize: 0,
        size: 0,
        cell: ({ row }) => {
            return <div className="truncate font-code text-s">{row.original.connectionName || '-'}</div>;
        }
    },
    {
        accessorKey: 'id',
        header: '',
        size: 40,
        cell: () => {
            return (<div className="-ml-2">
                    <react_icons_1.ChevronRightIcon />
                </div>);
        }
    }
];
exports.statusDefaultOptions = ['all'];
exports.statusOptions = [
    { name: 'All', value: 'all' },
    { name: 'Success', value: 'success' },
    { name: 'Failed', value: 'failed' },
    { name: 'Running', value: 'running' },
    { name: 'Cancelled', value: 'cancelled' },
    { name: 'Timeout', value: 'timeout' },
    { name: 'Waiting', value: 'waiting' }
];
exports.typesDefaultOptions = ['all'];
exports.typesOptions = [
    { value: 'all', name: 'All' },
    {
        value: 'sync',
        name: 'Sync',
        childs: [
            { name: 'Execution', value: 'sync:run' },
            { name: 'Pause Schedule', value: 'sync:pause' },
            { name: 'Resume Schedule', value: 'sync:unpause' },
            { name: 'Trigger Incremental Execution', value: 'sync:request_run' },
            { name: 'Trigger Full Execution', value: 'sync:request_run_full' },
            { name: 'Sync Init', value: 'sync:init' },
            { name: 'Cancel Execution', value: 'sync:cancel' }
        ]
    },
    { value: 'action', name: 'Action' },
    { value: 'proxy', name: 'Proxy' },
    { value: 'deploy', name: 'Deploy' },
    { value: 'auth', name: 'Auth' },
    { value: 'webhook', name: 'Webhook' }
];
exports.integrationsDefaultOptions = ['all'];
exports.connectionsDefaultOptions = ['all'];
exports.syncsDefaultOptions = ['all'];
//# sourceMappingURL=constants.js.map