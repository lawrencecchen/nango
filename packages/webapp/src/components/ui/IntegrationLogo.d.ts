/// <reference types="react" />
interface IntegrationLogoProps {
    provider: string;
    height?: number;
    width?: number;
    color?: string;
    classNames?: string;
}
export default function IntegrationLogo({ provider, height, width, color, classNames }: IntegrationLogoProps): import('react').JSX.Element;
export {};
