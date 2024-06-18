/// <reference types="react" />
interface ToggleButtonProps {
    enabled: boolean;
    onChange: () => void;
}
export default function ToggleButton({ enabled, onChange }: ToggleButtonProps): import('react').JSX.Element;
export {};
