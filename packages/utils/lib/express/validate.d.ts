import type { Request, NextFunction } from 'express';
import { z } from 'zod';
import type { ValidationError, Endpoint } from '@nangohq/types';

import type { EndpointRequest, EndpointResponse } from './route.js';
interface RequestParser<E extends Endpoint<any>> {
    parseBody?: (data: unknown) => E['Body'];
    parseQuery?: (data: unknown) => E['Querystring'];
    parseParams?: (data: unknown) => E['Params'];
}
export declare const validateRequest: <E extends Endpoint<any>>(
    parser: RequestParser<E>
) => (req: EndpointRequest<E>, res: EndpointResponse<E>, next: NextFunction) => void;
export declare function zodErrorToHTTP(error: z.ZodError): ValidationError[];
/**
 * Enforce empty request body
 */
export declare function requireEmptyBody(req: Request): z.SafeParseReturnType<{}, {}>;
/**
 * Enforce empty request query string
 */
export declare function requireEmptyQuery(
    req: Request,
    {
        withEnv
    }?: {
        withEnv: boolean;
    }
): z.SafeParseReturnType<
    | {
          env?: string;
      }
    | {
          env?: unknown;
      },
    | {
          env?: string;
      }
    | {
          env?: unknown;
      }
>;
export {};
