/// <reference types="react" />
import type { ClassValue } from 'clsx';

import type { LeftNavBarItems } from '../components/LeftNavBar';
interface DashboardLayoutI {
    children: React.ReactNode;
    selectedItem: LeftNavBarItems;
    fullWidth?: boolean;
    className?: ClassValue;
}
export default function DashboardLayout({ children, selectedItem, fullWidth, className }: DashboardLayoutI): import('react').JSX.Element;
export {};
