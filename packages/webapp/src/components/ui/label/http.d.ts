/// <reference types="react" />
import type { FlowEndpoint } from '../../../types';
interface HttpLabelProp {
    path: string;
}
export declare function HttpLabel({ endpoint }: { endpoint: FlowEndpoint }): import('react').JSX.Element;
export declare function GET({ path }: HttpLabelProp): import('react').JSX.Element;
export declare function POST({ path }: HttpLabelProp): import('react').JSX.Element;
export declare function PUT({ path }: HttpLabelProp): import('react').JSX.Element;
export declare function PATCH({ path }: HttpLabelProp): import('react').JSX.Element;
export declare function DELETE({ path }: HttpLabelProp): import('react').JSX.Element;
export {};
