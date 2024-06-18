/// <reference types="react" />
export declare enum LeftNavBarItems {
    Integrations = 0,
    Connections = 1,
    EnvironmentSettings = 2,
    Syncs = 3,
    AccountSettings = 4,
    UserSettings = 5,
    InteractiveDemo = 6,
    Logs = 7
}
export interface LeftNavBarProps {
    selectedItem: LeftNavBarItems;
}
export default function LeftNavBar(props: LeftNavBarProps): import('react').JSX.Element;
