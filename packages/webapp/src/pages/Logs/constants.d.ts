import type { ColumnDef } from '@tanstack/react-table';
import type {
    SearchOperationsConnection,
    SearchOperationsData,
    SearchOperationsIntegration,
    SearchOperationsState,
    SearchOperationsSync,
    SearchOperationsType
} from '@nangohq/types';

import type { MultiSelectArgs } from '../../components/MultiSelect';
export declare const columns: ColumnDef<SearchOperationsData>[];
export declare const statusDefaultOptions: SearchOperationsState[];
export declare const statusOptions: MultiSelectArgs<SearchOperationsState>['options'];
export declare const typesDefaultOptions: SearchOperationsType[];
export declare const typesOptions: (
    | {
          value: string;
          name: string;
          childs?: undefined;
      }
    | {
          value: string;
          name: string;
          childs: {
              name: string;
              value: string;
          }[];
      }
)[];
export declare const integrationsDefaultOptions: SearchOperationsIntegration[];
export declare const connectionsDefaultOptions: SearchOperationsConnection[];
export declare const syncsDefaultOptions: SearchOperationsSync[];
